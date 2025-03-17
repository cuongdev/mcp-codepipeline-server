import { CodePipelineManager } from "../types.js";
import AWS from 'aws-sdk';

export const getPipelineMetricsSchema = {
  name: "get_pipeline_metrics",
  description: "Get performance metrics for a pipeline",
  inputSchema: {
    type: "object",
    properties: {
      pipelineName: { 
        type: "string",
        description: "Name of the pipeline"
      },
      period: {
        type: "number",
        description: "Time period in seconds for the metrics (default: 86400 - 1 day)",
        default: 86400
      },
      startTime: {
        type: "string",
        description: "Start time for metrics in ISO format (default: 1 week ago)",
        format: "date-time"
      },
      endTime: {
        type: "string",
        description: "End time for metrics in ISO format (default: now)",
        format: "date-time"
      }
    },
    required: ["pipelineName"],
  },
} as const;

export async function getPipelineMetrics(
  codePipelineManager: CodePipelineManager, 
  input: {
    pipelineName: string;
    period?: number;
    startTime?: string;
    endTime?: string;
  }
) {
  const { pipelineName, period = 86400 } = input;
  
  // Set default time range if not provided
  const endTime = input.endTime ? new Date(input.endTime) : new Date();
  const startTime = input.startTime ? new Date(input.startTime) : new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week ago
  
  // Create CloudWatch client
  const cloudwatch = new AWS.CloudWatch({
    region: codePipelineManager.getCodePipeline().config.region
  });
  
  // Get execution success/failure metrics
  const successMetric = await cloudwatch.getMetricStatistics({
    Namespace: 'AWS/CodePipeline',
    MetricName: 'SucceededPipeline',
    Dimensions: [{ Name: 'PipelineName', Value: pipelineName }],
    StartTime: startTime,
    EndTime: endTime,
    Period: period,
    Statistics: ['Sum', 'Average', 'Maximum']
  }).promise();
  
  const failedMetric = await cloudwatch.getMetricStatistics({
    Namespace: 'AWS/CodePipeline',
    MetricName: 'FailedPipeline',
    Dimensions: [{ Name: 'PipelineName', Value: pipelineName }],
    StartTime: startTime,
    EndTime: endTime,
    Period: period,
    Statistics: ['Sum', 'Average', 'Maximum']
  }).promise();
  
  // Get execution time metrics
  const executionTimeMetric = await cloudwatch.getMetricStatistics({
    Namespace: 'AWS/CodePipeline',
    MetricName: 'PipelineExecutionTime',
    Dimensions: [{ Name: 'PipelineName', Value: pipelineName }],
    StartTime: startTime,
    EndTime: endTime,
    Period: period,
    Statistics: ['Average', 'Minimum', 'Maximum']
  }).promise();
  
  // Calculate success rate
  const totalSuccessful = successMetric.Datapoints?.reduce((sum, point) => sum + (point.Sum || 0), 0) || 0;
  const totalFailed = failedMetric.Datapoints?.reduce((sum, point) => sum + (point.Sum || 0), 0) || 0;
  const totalExecutions = totalSuccessful + totalFailed;
  const successRate = totalExecutions > 0 ? (totalSuccessful / totalExecutions) * 100 : 0;
  
  // Format execution time data
  const executionTimeData = executionTimeMetric.Datapoints?.map(point => ({
    timestamp: point.Timestamp?.toISOString(),
    average: point.Average,
    minimum: point.Minimum,
    maximum: point.Maximum
  })) || [];
  
  // Get pipeline executions for the period
  const codepipeline = codePipelineManager.getCodePipeline();
  const pipelineExecutions = await codepipeline.listPipelineExecutions({
    pipelineName,
    maxResults: 20 // Limit to recent executions
  }).promise();
  
  // Calculate average stage duration
  const stageMetrics: Record<string, { count: number, totalDuration: number }> = {};
  
  // We would need to fetch each execution detail to get accurate stage timing
  // This is a simplified version using the available data
  for (const execution of pipelineExecutions.pipelineExecutionSummaries || []) {
    if (execution.startTime && execution.status === 'Succeeded') {
      const executionDetail = await codepipeline.getPipelineExecution({
        pipelineName,
        pipelineExecutionId: execution.pipelineExecutionId || ''
      }).promise();
      
      // Get pipeline state to analyze stage timing
      const pipelineState = await codepipeline.getPipelineState({
        name: pipelineName
      }).promise();
      
      // Process stage information
      for (const stage of pipelineState.stageStates || []) {
        if (stage.latestExecution?.status === 'Succeeded' && 
            stage.stageName && 
            stage.actionStates && 
            stage.actionStates.length > 0) {
          
          // Find earliest and latest action timestamps
          let earliestTime: Date | undefined;
          let latestTime: Date | undefined;
          
          for (const action of stage.actionStates) {
            if (action.latestExecution?.lastStatusChange) {
              const timestamp = new Date(action.latestExecution.lastStatusChange);
              
              if (!earliestTime || timestamp < earliestTime) {
                earliestTime = timestamp;
              }
              
              if (!latestTime || timestamp > latestTime) {
                latestTime = timestamp;
              }
            }
          }
          
          // Calculate duration if we have both timestamps
          if (earliestTime && latestTime) {
            const stageName = stage.stageName;
            const duration = (latestTime.getTime() - earliestTime.getTime()) / 1000; // in seconds
            
            if (!stageMetrics[stageName]) {
              stageMetrics[stageName] = { count: 0, totalDuration: 0 };
            }
            
            stageMetrics[stageName].count += 1;
            stageMetrics[stageName].totalDuration += duration;
          }
        }
      }
    }
  }
  
  // Calculate average duration for each stage
  const stageDurations = Object.entries(stageMetrics).map(([stageName, metrics]) => ({
    stageName,
    averageDuration: metrics.count > 0 ? metrics.totalDuration / metrics.count : 0,
    executionCount: metrics.count
  }));
  
  // Prepare the metrics result
  const metrics = {
    pipelineName,
    timeRange: {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      periodSeconds: period
    },
    executionStats: {
      totalExecutions,
      successfulExecutions: totalSuccessful,
      failedExecutions: totalFailed,
      successRate: successRate.toFixed(2) + '%'
    },
    executionTime: {
      average: executionTimeMetric.Datapoints?.length ? 
        executionTimeMetric.Datapoints.reduce((sum, point) => sum + (point.Average || 0), 0) / executionTimeMetric.Datapoints.length : 
        0,
      minimum: Math.min(...(executionTimeMetric.Datapoints?.map(point => point.Minimum || 0) || [0])),
      maximum: Math.max(...(executionTimeMetric.Datapoints?.map(point => point.Maximum || 0) || [0])),
      dataPoints: executionTimeData
    },
    stagePerformance: stageDurations
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(metrics, null, 2),
      },
    ],
  };
}
