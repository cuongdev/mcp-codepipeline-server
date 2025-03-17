import { CodePipelineManager } from "../types.js";
import AWS from 'aws-sdk';

export const getPipelineExecutionLogsSchema = {
  name: "get_pipeline_execution_logs",
  description: "Get logs for a pipeline execution",
  inputSchema: {
    type: "object",
    properties: {
      pipelineName: { 
        type: "string",
        description: "Name of the pipeline"
      },
      executionId: { 
        type: "string",
        description: "Execution ID"
      }
    },
    required: ["pipelineName", "executionId"],
  },
} as const;

export async function getPipelineExecutionLogs(
  codePipelineManager: CodePipelineManager, 
  input: {
    pipelineName: string;
    executionId: string;
  }
) {
  const { pipelineName, executionId } = input;
  const codepipeline = codePipelineManager.getCodePipeline();
  
  const response = await codepipeline.getPipelineExecution({
    pipelineName,
    pipelineExecutionId: executionId
  }).promise();

  // Format the response for better readability
  // Extract and format the execution details
  const logs = {
    pipelineName: response.pipelineExecution?.pipelineName || pipelineName,
    pipelineVersion: response.pipelineExecution?.pipelineVersion || '1',
    pipelineExecution: {
      pipelineExecutionId: response.pipelineExecution?.pipelineExecutionId,
      status: response.pipelineExecution?.status,
      artifactRevisions: response.pipelineExecution?.artifactRevisions?.map((revision: AWS.CodePipeline.ArtifactRevision) => ({
        name: revision.name,
        revisionId: revision.revisionId,
        revisionSummary: revision.revisionSummary,
        revisionUrl: revision.revisionUrl
      }))
    }
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ logs }, null, 2),
      },
    ],
  };
}
