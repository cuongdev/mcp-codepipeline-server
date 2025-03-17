import { CodePipelineManager } from "../types.js";

export const listPipelinesSchema = {
  name: "list_pipelines",
  description: "List all CodePipeline pipelines",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
} as const;

export async function listPipelines(codePipelineManager: CodePipelineManager) {
  const codepipeline = codePipelineManager.getCodePipeline();
  const response = await codepipeline.listPipelines().promise();
  
  const pipelines = response.pipelines?.map((pipeline: AWS.CodePipeline.PipelineSummary) => ({
    name: pipeline.name || '',
    version: pipeline.version || 0,
    created: pipeline.created?.toISOString() || '',
    updated: pipeline.updated?.toISOString() || ''
  })) || [];

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ pipelines }, null, 2),
      },
    ],
  };
}
