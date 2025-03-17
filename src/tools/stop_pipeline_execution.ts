import { CodePipelineManager } from "../types.js";

export const stopPipelineExecutionSchema = {
  name: "stop_pipeline_execution",
  description: "Stop a pipeline execution",
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
      },
      reason: { 
        type: "string",
        description: "Optional reason for stopping"
      }
    },
    required: ["pipelineName", "executionId"],
  },
} as const;

export async function stopPipelineExecution(
  codePipelineManager: CodePipelineManager, 
  input: {
    pipelineName: string;
    executionId: string;
    reason?: string;
  }
) {
  const { pipelineName, executionId, reason } = input;
  const codepipeline = codePipelineManager.getCodePipeline();
  
  await codepipeline.stopPipelineExecution({
    pipelineName,
    pipelineExecutionId: executionId,
    reason: reason || 'Stopped by user',
    abandon: false
  }).promise();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ 
          message: "Pipeline execution stopped successfully" 
        }, null, 2),
      },
    ],
  };
}
