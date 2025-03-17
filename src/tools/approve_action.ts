import { CodePipelineManager } from "../types.js";

export const approveActionSchema = {
  name: "approve_action",
  description: "Approve or reject a manual approval action",
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
      actionName: { 
        type: "string",
        description: "Name of the action"
      },
      token: { 
        type: "string",
        description: "Approval token"
      },
      approved: { 
        type: "boolean",
        description: "Boolean indicating approval or rejection"
      },
      comments: { 
        type: "string",
        description: "Optional comments"
      }
    },
    required: ["pipelineName", "stageName", "actionName", "token", "approved"],
  },
} as const;

export async function approveAction(
  codePipelineManager: CodePipelineManager, 
  input: {
    pipelineName: string;
    stageName: string;
    actionName: string;
    token: string;
    approved: boolean;
    comments?: string;
  }
) {
  const { pipelineName, stageName, actionName, token, approved, comments } = input;
  const codepipeline = codePipelineManager.getCodePipeline();
  
  await codepipeline.putApprovalResult({
    pipelineName,
    stageName,
    actionName,
    token,
    result: {
      status: approved ? 'Approved' : 'Rejected',
      summary: comments || ''
    }
  }).promise();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ 
          message: `Action ${approved ? 'approved' : 'rejected'} successfully` 
        }, null, 2),
      },
    ],
  };
}
