import AWS from 'aws-sdk';
import {
  PipelineSummary,
  PipelineState,
  PipelineExecution,
  ApprovalRequest,
  RetryStageRequest,
  TriggerPipelineRequest,
  StageState
} from '../types/codepipeline.js';
import { getEnv } from '../utils/env.js';

export class CodePipelineService {
  private codepipeline: AWS.CodePipeline;

  constructor() {
    // Get AWS configuration from environment variables
    const region = getEnv('AWS_REGION', 'us-west-2'); // Default to us-west-2 if not provided
    const accessKeyId = getEnv('AWS_ACCESS_KEY_ID');
    const secretAccessKey = getEnv('AWS_SECRET_ACCESS_KEY');
    
    // Configure AWS SDK
    const awsConfig: AWS.ConfigurationOptions = { region };
    
    // Add credentials if provided
    if (accessKeyId && secretAccessKey) {
      awsConfig.credentials = new AWS.Credentials({
        accessKeyId,
        secretAccessKey
      });
    }
    
    // Update AWS SDK configuration
    AWS.config.update(awsConfig);
    
    console.log(`AWS CodePipeline service initialized with region: ${region}`);
    this.codepipeline = new AWS.CodePipeline(awsConfig);
  }

  /**
   * List all pipelines
   */
  async listPipelines(): Promise<PipelineSummary[]> {
    try {
      const response = await this.codepipeline.listPipelines().promise();
      
      return response.pipelines?.map(pipeline => ({
        name: pipeline.name || '',
        version: pipeline.version || 0,
        created: pipeline.created?.toISOString() || '',
        updated: pipeline.updated?.toISOString() || ''
      })) || [];
    } catch (error) {
      console.error('Error listing pipelines:', error);
      throw error;
    }
  }

  /**
   * Get pipeline state
   */
  async getPipelineState(pipelineName: string): Promise<PipelineState> {
    try {
      const response = await this.codepipeline.getPipelineState({ name: pipelineName }).promise();
      
      // Convert AWS.CodePipeline.StageState[] to our StageState[]
      const stageStates: StageState[] = response.stageStates?.map(stage => {
        // Convert TransitionState
        const inboundTransitionState = stage.inboundTransitionState ? {
          enabled: stage.inboundTransitionState.enabled === undefined ? false : stage.inboundTransitionState.enabled,
          lastChangedBy: stage.inboundTransitionState.lastChangedBy,
          lastChangedAt: stage.inboundTransitionState.lastChangedAt,
          disabledReason: stage.inboundTransitionState.disabledReason
        } : undefined;
        
        // Convert StageExecution
        const latestExecution = stage.latestExecution ? {
          pipelineExecutionId: stage.latestExecution.pipelineExecutionId || '',
          status: stage.latestExecution.status || ''
          // AWS SDK types may have different property names, we're mapping to our interface
        } : undefined;
        
        // Convert ActionStates
        const actionStates = (stage.actionStates || []).map(action => {
          // Convert ActionExecution
          const latestExecution = action.latestExecution ? {
            status: action.latestExecution.status || '',
            summary: action.latestExecution.summary,
            lastStatusChange: action.latestExecution.lastStatusChange || new Date().toISOString(),
            token: action.latestExecution.token,
            externalExecutionId: action.latestExecution.externalExecutionId,
            externalExecutionUrl: action.latestExecution.externalExecutionUrl,
            errorDetails: action.latestExecution.errorDetails ? {
              code: action.latestExecution.errorDetails.code || '',
              message: action.latestExecution.errorDetails.message || ''
            } : undefined
          } : undefined;
          
          // Convert ActionRevision
          const currentRevision = action.currentRevision ? {
            revisionId: action.currentRevision.revisionId || '',
            revisionChangeId: action.currentRevision.revisionChangeId || '',
            created: action.currentRevision.created || new Date().toISOString()
          } : undefined;
          
          return {
            actionName: action.actionName || '',
            currentRevision,
            latestExecution,
            entityUrl: action.entityUrl
          };
        });
        
        return {
          stageName: stage.stageName || '',
          inboundTransitionState,
          actionStates,
          latestExecution
        };
      }) || [];
      
      return {
        pipelineName: response.pipelineName || '',
        pipelineVersion: response.pipelineVersion || 0,
        stageStates: stageStates,
        created: response.created?.toISOString() || '',
        updated: response.updated?.toISOString() || ''
      };
    } catch (error) {
      console.error(`Error getting pipeline state for ${pipelineName}:`, error);
      throw error;
    }
  }

  /**
   * Get pipeline executions
   */
  async listPipelineExecutions(pipelineName: string): Promise<PipelineExecution[]> {
    try {
      const response = await this.codepipeline.listPipelineExecutions({ 
        pipelineName 
      }).promise();
      
      return response.pipelineExecutionSummaries?.map(execution => ({
        pipelineExecutionId: execution.pipelineExecutionId || '',
        status: execution.status || '',
        artifactRevisions: execution.sourceRevisions?.map(revision => ({
          name: revision.actionName || '',
          revisionId: revision.revisionId || '',
          revisionChangeIdentifier: revision.revisionUrl || '', // Fixed property name
          revisionSummary: revision.revisionSummary || '',
          created: new Date().toISOString(), // Fixed missing property
          revisionUrl: revision.revisionUrl || ''
        })) || []
      })) || [];
    } catch (error) {
      console.error(`Error listing pipeline executions for ${pipelineName}:`, error);
      throw error;
    }
  }

  /**
   * Approve or reject a manual approval action
   */
  async approveAction(request: ApprovalRequest, approved: boolean, comments: string = ''): Promise<void> {
    try {
      await this.codepipeline.putApprovalResult({
        pipelineName: request.pipelineName,
        stageName: request.stageName,
        actionName: request.actionName,
        token: request.token,
        result: {
          status: approved ? 'Approved' : 'Rejected',
          summary: comments
        }
      }).promise();
    } catch (error) {
      console.error(`Error ${approved ? 'approving' : 'rejecting'} action:`, error);
      throw error;
    }
  }

  /**
   * Retry a failed stage
   */
  async retryStageExecution(request: RetryStageRequest): Promise<void> {
    try {
      await this.codepipeline.retryStageExecution({
        pipelineName: request.pipelineName,
        stageName: request.stageName,
        pipelineExecutionId: request.pipelineExecutionId,
        retryMode: 'FAILED_ACTIONS'
      }).promise();
    } catch (error) {
      console.error(`Error retrying stage execution:`, error);
      throw error;
    }
  }

  /**
   * Trigger a pipeline execution
   */
  async startPipelineExecution(request: TriggerPipelineRequest): Promise<string> {
    try {
      const response = await this.codepipeline.startPipelineExecution({
        name: request.pipelineName
      }).promise();
      
      return response.pipelineExecutionId || '';
    } catch (error) {
      console.error(`Error starting pipeline execution:`, error);
      throw error;
    }
  }

  /**
   * Get pipeline execution logs
   */
  async getPipelineExecutionLogs(pipelineName: string, executionId: string): Promise<AWS.CodePipeline.GetPipelineExecutionOutput> {
    try {
      return await this.codepipeline.getPipelineExecution({
        pipelineName,
        pipelineExecutionId: executionId
      }).promise();
    } catch (error) {
      console.error(`Error getting pipeline execution logs:`, error);
      throw error;
    }
  }

  /**
   * Stop pipeline execution
   */
  async stopPipelineExecution(pipelineName: string, executionId: string, reason: string = 'Stopped by user'): Promise<void> {
    try {
      await this.codepipeline.stopPipelineExecution({
        pipelineName,
        pipelineExecutionId: executionId,
        reason,
        abandon: false
      }).promise();
    } catch (error) {
      console.error(`Error stopping pipeline execution:`, error);
      throw error;
    }
  }
}
