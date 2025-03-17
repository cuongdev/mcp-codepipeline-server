import { CodePipelineManager } from "../types.js";

export const triggerPipelineSchema = {
  name: "trigger_pipeline",
  description: "Trigger a pipeline execution",
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

export async function triggerPipeline(
  codePipelineManager: CodePipelineManager, 
  input: {
    pipelineName: string;
  }
) {
  const { pipelineName } = input;
  const codepipeline = codePipelineManager.getCodePipeline();
  
  const response = await codepipeline.startPipelineExecution({
    name: pipelineName
  }).promise();
  
  const executionId = response.pipelineExecutionId || '';

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ 
          message: "Pipeline triggered successfully", 
          executionId 
        }, null, 2),
      },
    ],
  };
}
