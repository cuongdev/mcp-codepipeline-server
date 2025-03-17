import { CodePipelineManager } from "../types.js";
import AWS from 'aws-sdk';

export const getPipelineStateSchema = {
  name: "get_pipeline_state",
  description: "Get the state of a specific pipeline",
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

export async function getPipelineState(codePipelineManager: CodePipelineManager, input: { pipelineName: string }) {
  const { pipelineName } = input;
  const codepipeline = codePipelineManager.getCodePipeline();
  
  const response = await codepipeline.getPipelineState({ name: pipelineName }).promise();
  
  // Convert AWS.CodePipeline.StageState[] to our StageState[]
  const stageStates = response.stageStates?.map((stage: AWS.CodePipeline.StageState) => {
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
    } : undefined;
    
    // Convert ActionStates
    const actionStates = (stage.actionStates || []).map((action: AWS.CodePipeline.ActionState) => {
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
  
  const pipelineState = {
    pipelineName: response.pipelineName || '',
    pipelineVersion: response.pipelineVersion || 0,
    stageStates: stageStates,
    created: response.created?.toISOString() || '',
    updated: response.updated?.toISOString() || ''
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ pipelineState }, null, 2),
      },
    ],
  };
}
