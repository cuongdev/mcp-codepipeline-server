#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadEnv, getEnv } from './utils/env.js';
import { CodePipelineManager } from "./types.js";
import { serverConfig } from "./config/server-config.js";

// Import tool schemas and handlers
import { 
  listPipelines, 
  listPipelinesSchema 
} from "./tools/list_pipelines.js";

import { 
  getPipelineState, 
  getPipelineStateSchema 
} from "./tools/get_pipeline_state.js";

import { 
  listPipelineExecutions, 
  listPipelineExecutionsSchema 
} from "./tools/list_pipeline_executions.js";

import { 
  approveAction, 
  approveActionSchema 
} from "./tools/approve_action.js";

import { 
  retryStage,
  retryStageSchema 
} from "./tools/retry_stage.js";

import { 
  triggerPipeline, 
  triggerPipelineSchema 
} from "./tools/trigger_pipeline.js";

import { 
  getPipelineExecutionLogs, 
  getPipelineExecutionLogsSchema 
} from "./tools/get_pipeline_execution_logs.js";

import { 
  stopPipelineExecution, 
  stopPipelineExecutionSchema 
} from "./tools/stop_pipeline_execution.js";

// Import new tool schemas and handlers
import {
  getPipelineDetails,
  getPipelineDetailsSchema
} from "./tools/get_pipeline_details.js";

import {
  tagPipelineResource,
  tagPipelineResourceSchema
} from "./tools/tag_pipeline_resource.js";

import {
  createPipelineWebhook,
  createPipelineWebhookSchema
} from "./tools/create_pipeline_webhook.js";

import {
  getPipelineMetrics,
  getPipelineMetricsSchema
} from "./tools/get_pipeline_metrics.js";

import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

// Load environment variables
loadEnv();

// Log configuration for debugging
console.log('----- AWS CodePipeline MCP Server Configuration -----');
console.log('PORT:', getEnv('PORT', '3000'));
console.log('AWS_REGION:', getEnv('AWS_REGION'));
console.log('AWS_ACCESS_KEY_ID:', getEnv('AWS_ACCESS_KEY_ID') ? '***' : 'undefined');
console.log('AWS_SECRET_ACCESS_KEY:', getEnv('AWS_SECRET_ACCESS_KEY') ? '***' : 'undefined');
console.log('-----------------------------------------------------');

// Initialize CodePipeline manager
const codePipelineManager = new CodePipelineManager();

// Create server instance
const server = new Server(
  {
    name: serverConfig.name,
    version: serverConfig.version,
  },
  {
    capabilities: {
      tools: { listChanged: true },
      resources: { listChanged: false },
      prompts: { listChanged: false }
    },
    instructions: "AWS CodePipeline MCP Server for interacting with AWS CodePipeline services"
  }
);

// Set up tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      listPipelinesSchema,
      getPipelineStateSchema,
      listPipelineExecutionsSchema,
      approveActionSchema,
      retryStageSchema,
      triggerPipelineSchema,
      getPipelineExecutionLogsSchema,
      stopPipelineExecutionSchema,
      // Add new tool schemas
      getPipelineDetailsSchema,
      tagPipelineResourceSchema,
      createPipelineWebhookSchema,
      getPipelineMetricsSchema,
    ],
  };
});

// Set up tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request: { params: { name: string; _meta?: any; arguments?: Record<string, any> }; method: string }) => {
  try {
    const { name, arguments: input = {} } = request.params;

    switch (name) {
      case "list_pipelines": {
        return await listPipelines(codePipelineManager);
      }

      case "get_pipeline_state": {
        return await getPipelineState(codePipelineManager, input as { pipelineName: string });
      }

      case "list_pipeline_executions": {
        return await listPipelineExecutions(codePipelineManager, input as { pipelineName: string });
      }

      case "approve_action": {
        return await approveAction(codePipelineManager, input as {
          pipelineName: string;
          stageName: string;
          actionName: string;
          token: string;
          approved: boolean;
          comments?: string;
        });
      }

      case "retry_stage": {
        return await retryStage(codePipelineManager, input as {
          pipelineName: string;
          stageName: string;
          pipelineExecutionId: string;
        });
      }

      case "trigger_pipeline": {
        return await triggerPipeline(codePipelineManager, input as {
          pipelineName: string;
        });
      }

      case "get_pipeline_execution_logs": {
        return await getPipelineExecutionLogs(codePipelineManager, input as {
          pipelineName: string;
          executionId: string;
        });
      }

      case "stop_pipeline_execution": {
        return await stopPipelineExecution(codePipelineManager, input as {
          pipelineName: string;
          executionId: string;
          reason?: string;
        });
      }

      // Add handlers for new tools
      case "get_pipeline_details": {
        return await getPipelineDetails(codePipelineManager, input as {
          pipelineName: string;
        });
      }

      case "tag_pipeline_resource": {
        return await tagPipelineResource(codePipelineManager, input as {
          pipelineName: string;
          tags: Array<{ key: string; value: string }>;
        });
      }

      case "create_pipeline_webhook": {
        return await createPipelineWebhook(codePipelineManager, input as {
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
        });
      }

      case "get_pipeline_metrics": {
        return await getPipelineMetrics(codePipelineManager, input as {
          pipelineName: string;
          period?: number;
          startTime?: string;
          endTime?: string;
        });
      }

      default:
        throw new McpError(ErrorCode.InvalidRequest, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) throw error;
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error}`
    );
  }
});

// Resources handlers (empty for now, can be implemented if needed)
server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [] }));
server.setRequestHandler(ReadResourceRequestSchema, async () => { throw new McpError(ErrorCode.InvalidRequest, "No resources available"); });

// Create transport and start server
const transport = new StdioServerTransport();

// Connect the server to the transport
server.connect(transport);

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, async () => {
      console.log(`Received ${signal}, shutting down...`);
      await server.close();
      process.exit(0);
  });
});

// Log server start
console.log("AWS CodePipeline MCP Server started successfully");
console.log(`Server running with AWS region: ${getEnv('AWS_REGION')}`);
