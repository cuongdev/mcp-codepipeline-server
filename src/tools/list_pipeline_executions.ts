import { CodePipelineManager } from "../types.js";
import AWS from 'aws-sdk';

export const listPipelineExecutionsSchema = {
  name: "list_pipeline_executions",
  description: "List executions for a specific pipeline",
  inputSchema: {
    type: "object",
    properties: {
      pipelineName: { 
        type: "string",
        description: "Name of the pipeline"
      }
    },
    required: ["pipelineName"],
  },
} as const;

export async function listPipelineExecutions(codePipelineManager: CodePipelineManager, input: { pipelineName: string }) {
  const { pipelineName } = input;
  const codepipeline = codePipelineManager.getCodePipeline();
  
  const response = await codepipeline.listPipelineExecutions({ 
    pipelineName 
  }).promise();
  
  const executions = response.pipelineExecutionSummaries?.map((execution: AWS.CodePipeline.PipelineExecutionSummary) => ({
    pipelineExecutionId: execution.pipelineExecutionId || '',
    status: execution.status || '',
    startTime: execution.startTime?.toISOString() || '',
    lastUpdateTime: execution.lastUpdateTime?.toISOString() || '',
    sourceRevisions: execution.sourceRevisions?.map((revision: AWS.CodePipeline.SourceRevision) => ({
      name: revision.actionName || '',
      revisionId: revision.revisionId || '',
      revisionUrl: revision.revisionUrl || '',
      revisionSummary: revision.revisionSummary || ''
    })) || []
  })) || [];

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ executions }, null, 2),
      },
    ],
  };
}
