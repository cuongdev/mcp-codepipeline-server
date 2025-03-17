import { CodePipelineManager } from "../types.js";
import AWS from 'aws-sdk';

export const createPipelineWebhookSchema = {
  name: "create_pipeline_webhook",
  description: "Create a webhook for a pipeline to enable automatic triggering",
  inputSchema: {
    type: "object",
    properties: {
      pipelineName: { 
        type: "string",
        description: "Name of the pipeline"
      },
      webhookName: { 
        type: "string",
        description: "Name for the webhook"
      },
      targetAction: { 
        type: "string",
        description: "The name of the action in the pipeline that processes the webhook"
      },
      authentication: { 
        type: "string",
        description: "Authentication method for the webhook",
        enum: ["GITHUB_HMAC", "IP", "UNAUTHENTICATED"]
      },
      authenticationConfiguration: {
        type: "object",
        description: "Authentication configuration based on the authentication type",
        properties: {
          SecretToken: {
            type: "string",
            description: "Secret token for GITHUB_HMAC authentication"
          },
          AllowedIpRange: {
            type: "string",
            description: "Allowed IP range for IP authentication"
          }
        }
      },
      filters: {
        type: "array",
        description: "Event filters for the webhook",
        items: {
          type: "object",
          properties: {
            jsonPath: {
              type: "string",
              description: "JSON path to filter events"
            },
            matchEquals: {
              type: "string",
              description: "Value to match in the JSON path"
            }
          },
          required: ["jsonPath"]
        }
      }
    },
    required: ["pipelineName", "webhookName", "targetAction", "authentication"],
  },
} as const;

export async function createPipelineWebhook(
  codePipelineManager: CodePipelineManager, 
  input: {
    pipelineName: string;
    webhookName: string;
    targetAction: string;
    authentication: string;
    authenticationConfiguration?: {
      SecretToken?: string;
      AllowedIpRange?: string;
    };
    filters?: Array<{
      jsonPath: string;
      matchEquals?: string;
    }>;
  }
) {
  const { 
    pipelineName, 
    webhookName, 
    targetAction, 
    authentication, 
    authenticationConfiguration = {}, 
    filters = [] 
  } = input;
  
  const codepipeline = codePipelineManager.getCodePipeline();
  
  // Create the webhook
  const response = await codepipeline.putWebhook({
    webhook: {
      name: webhookName,
      targetPipeline: pipelineName,
      targetAction: targetAction,
      filters: filters.map(filter => ({
        jsonPath: filter.jsonPath,
        matchEquals: filter.matchEquals
      })),
      authentication,
      authenticationConfiguration
    }
  }).promise();
  
  // Register the webhook
  await codepipeline.registerWebhookWithThirdParty({
    webhookName
  }).promise();

  // Extract webhook details safely
  const webhookDetails = {
    name: webhookName,
    url: response.webhook ? String(response.webhook.url) : undefined,
    targetPipeline: pipelineName,
    targetAction: targetAction
  };
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ 
          message: "Pipeline webhook created and registered successfully",
          webhookDetails
        }, null, 2),
      },
    ],
  };
}
