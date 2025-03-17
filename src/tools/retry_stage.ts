import { CodePipelineManager } from "../types.js";

export const retryStageSchema = {
  name: "retry_stage",
  description: "Retry a failed stage",
  inputSchema: {
    type: "object",
    properties: {
      pipelineName: { 
        type: "string",
        description: "Name of the pipeline"
      },
      stageName: { 
        type: "string",
        description: "Name of the stage"
      },
      pipelineExecutionId: { 
        type: "string",
        description: "Execution ID"
      }
    },
    required: ["pipelineName", "stageName", "pipelineExecutionId"],
  },
} as const;

export async function retryStage(
  codePipelineManager: CodePipelineManager, 
  input: {
    pipelineName: string;
    stageName: string;
    pipelineExecutionId: string;
  }
) {
  const { pipelineName, stageName, pipelineExecutionId } = input;
  const codepipeline = codePipelineManager.getCodePipeline();
  
  await codepipeline.retryStageExecution({
    pipelineName,
    stageName,
    pipelineExecutionId,
    retryMode: 'FAILED_ACTIONS'
  }).promise();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ 
          message: "Stage retry initiated successfully" 
        }, null, 2),
      },
    ],
  };
}
