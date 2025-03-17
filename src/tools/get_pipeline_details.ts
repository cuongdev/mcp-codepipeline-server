import { CodePipelineManager } from "../types.js";

export const getPipelineDetailsSchema = {
  name: "get_pipeline_details",
  description: "Get the full definition of a specific pipeline",
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

export async function getPipelineDetails(
  codePipelineManager: CodePipelineManager, 
  input: { pipelineName: string }
) {
  const { pipelineName } = input;
  const codepipeline = codePipelineManager.getCodePipeline();
  
  const response = await codepipeline.getPipeline({ name: pipelineName }).promise();
  
  // Format the pipeline details for better readability
  const pipelineDetails = {
    pipeline: {
      name: response.pipeline?.name || '',
      roleArn: response.pipeline?.roleArn || '',
      artifactStore: response.pipeline?.artifactStore,
      stages: response.pipeline?.stages?.map(stage => ({
        name: stage.name,
        actions: stage.actions?.map(action => ({
          name: action.name,
          actionTypeId: action.actionTypeId,
          runOrder: action.runOrder,
          configuration: action.configuration,
          outputArtifacts: action.outputArtifacts,
          inputArtifacts: action.inputArtifacts,
          region: action.region,
          namespace: action.namespace
        }))
      })),
      version: response.pipeline?.version || 0,
      metadata: {
        created: response.metadata?.created?.toISOString() || '',
        updated: response.metadata?.updated?.toISOString() || '',
        pipelineArn: response.metadata?.pipelineArn || ''
      }
    }
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(pipelineDetails, null, 2),
      },
    ],
  };
}
