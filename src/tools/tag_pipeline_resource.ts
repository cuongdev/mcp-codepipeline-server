import { CodePipelineManager } from "../types.js";

export const tagPipelineResourceSchema = {
  name: "tag_pipeline_resource",
  description: "Add or update tags for a pipeline resource",
  inputSchema: {
    type: "object",
    properties: {
      pipelineName: { 
        type: "string",
        description: "Name of the pipeline"
      },
      tags: {
        type: "array",
        description: "List of tags to add or update",
        items: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "Tag key"
            },
            value: {
              type: "string",
              description: "Tag value"
            }
          },
          required: ["key", "value"]
        }
      }
    },
    required: ["pipelineName", "tags"],
  },
} as const;

export async function tagPipelineResource(
  codePipelineManager: CodePipelineManager, 
  input: {
    pipelineName: string;
    tags: Array<{ key: string; value: string }>;
  }
) {
  const { pipelineName, tags } = input;
  const codepipeline = codePipelineManager.getCodePipeline();
  
  // First, get the pipeline ARN
  const pipelineResponse = await codepipeline.getPipeline({ name: pipelineName }).promise();
  const resourceArn = pipelineResponse.metadata?.pipelineArn;
  
  if (!resourceArn) {
    throw new Error(`Could not find ARN for pipeline: ${pipelineName}`);
  }
  
  // Tag the resource
  await codepipeline.tagResource({
    resourceArn,
    tags: tags.map(tag => ({
      key: tag.key,
      value: tag.value
    }))
  }).promise();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ 
          message: "Pipeline resource tagged successfully",
          resourceArn,
          tags
        }, null, 2),
      },
    ],
  };
}
