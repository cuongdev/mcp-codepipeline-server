import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Server as BaseMCPServer } from "@modelcontextprotocol/sdk/server/index.js";
import codePipelineRoutes from './routes/codepipeline.routes';

// Define types that match the SDK expectations
interface Tool {
  name: string;
  parameters: any;
}

interface ParamDefinition {
  type: string;
  description: string;
  required?: boolean;
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ParamDefinition>;
}

interface SuccessResult {
  status: 'success';
  result: any;
}

interface ErrorResult {
  status: 'error';
  error: {
    code: string;
    message: string;
  };
}

// Define the MCPRouter class since it's not directly exported
class MCPRouter {
  router: express.Router;
  
  constructor(server: any) {
    this.router = express.Router();
    this.setupRoutes(server);
  }
  
  private setupRoutes(server: any): void {
    this.router.post('/mcp', (req, res) => {
      // Handle MCP requests
      res.json({ status: 'success' });
    });
  }
}

// Define the tool definitions following MCP standard
const toolDefinitions: ToolDefinition[] = [
  {
    name: 'listPipelines',
    description: 'List all CodePipeline pipelines',
    parameters: {}
  },
  {
    name: 'getPipelineState',
    description: 'Get the state of a specific pipeline',
    parameters: {
      pipelineName: {
        type: 'string',
        description: 'Name of the pipeline'
      } as ParamDefinition
    }
  },
  {
    name: 'listPipelineExecutions',
    description: 'List executions for a specific pipeline',
    parameters: {
      pipelineName: {
        type: 'string',
        description: 'Name of the pipeline'
      } as ParamDefinition
    }
  },
  {
    name: 'approveAction',
    description: 'Approve or reject a manual approval action',
    parameters: {
      pipelineName: {
        type: 'string',
        description: 'Name of the pipeline'
      } as ParamDefinition,
      stageName: {
        type: 'string',
        description: 'Name of the stage'
      } as ParamDefinition,
      actionName: {
        type: 'string',
        description: 'Name of the action'
      } as ParamDefinition,
      token: {
        type: 'string',
        description: 'Approval token'
      } as ParamDefinition,
      approved: {
        type: 'boolean',
        description: 'Boolean indicating approval or rejection'
      } as ParamDefinition,
      comments: {
        type: 'string',
        description: 'Optional comments',
        required: false
      } as ParamDefinition
    }
  },
  {
    name: 'retryStage',
    description: 'Retry a failed stage',
    parameters: {
      pipelineName: {
        type: 'string',
        description: 'Name of the pipeline'
      } as ParamDefinition,
      stageName: {
        type: 'string',
        description: 'Name of the stage'
      } as ParamDefinition,
      pipelineExecutionId: {
        type: 'string',
        description: 'Execution ID'
      } as ParamDefinition
    }
  },
  {
    name: 'triggerPipeline',
    description: 'Trigger a pipeline execution',
    parameters: {
      pipelineName: {
        type: 'string',
        description: 'Name of the pipeline'
      } as ParamDefinition
    }
  },
  {
    name: 'getPipelineExecutionLogs',
    description: 'Get logs for a pipeline execution',
    parameters: {
      pipelineName: {
        type: 'string',
        description: 'Name of the pipeline'
      } as ParamDefinition,
      executionId: {
        type: 'string',
        description: 'Execution ID'
      } as ParamDefinition
    }
  },
  {
    name: 'stopPipelineExecution',
    description: 'Stop a pipeline execution',
    parameters: {
      pipelineName: {
        type: 'string',
        description: 'Name of the pipeline'
      } as ParamDefinition,
      executionId: {
        type: 'string',
        description: 'Execution ID'
      } as ParamDefinition,
      reason: {
        type: 'string',
        description: 'Optional reason for stopping',
        required: false
      } as ParamDefinition
    }
  }
];

export class MCPServer extends BaseMCPServer {
  private app: express.Application;
  private port: number;
  private mcpRouter: MCPRouter;

  constructor(port: number = 3000) {
    // Initialize the MCP server with tool definitions
    super({
      name: 'AWS CodePipeline MCP Server',
      version: '1.0.0',
      description: 'MCP server for AWS CodePipeline integration',
      tools: toolDefinitions
    });

    this.app = express();
    this.port = port;
    this.mcpRouter = new MCPRouter(this);
    this.configureMiddleware();
    this.configureRoutes();
  }

  private configureMiddleware(): void {
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
  }

  private configureRoutes(): void {
    // Mount the MCP routes
    this.app.use('/', this.mcpRouter.router);

    // API routes
    this.app.use('/api', codePipelineRoutes);

    // Health check route
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok' });
    });
  }

  // Override the MCP handleTool method to implement tool execution
  protected async handleTool(tool: Tool): Promise<SuccessResult | ErrorResult> {
    try {
      // Import the controller directly
      const { CodePipelineController } = require('./controllers/codepipeline.controller');
      const controller = new CodePipelineController();
      
      // Process tool based on name
      switch (tool.name) {
        case 'listPipelines': {
          const result = await controller.listPipelines();
          return { status: 'success', result };
        }
        
        case 'getPipelineState': {
          const params = tool.parameters as { pipelineName: string };
          const result = await controller.getPipelineState(params.pipelineName);
          return { status: 'success', result };
        }
        
        case 'listPipelineExecutions': {
          const params = tool.parameters as { pipelineName: string };
          const result = await controller.listPipelineExecutions(params.pipelineName);
          return { status: 'success', result };
        }
        
        case 'approveAction': {
          const params = tool.parameters as { 
            pipelineName: string; 
            stageName: string; 
            actionName: string; 
            token: string; 
            approved: boolean; 
            comments?: string 
          };
          const result = await controller.approveAction(
            params.pipelineName, 
            params.stageName, 
            params.actionName, 
            params.token, 
            params.approved, 
            params.comments
          );
          return { status: 'success', result };
        }
        
        case 'retryStage': {
          const params = tool.parameters as { 
            pipelineName: string; 
            stageName: string; 
            pipelineExecutionId: string 
          };
          const result = await controller.retryStage(
            params.pipelineName, 
            params.stageName, 
            params.pipelineExecutionId
          );
          return { status: 'success', result };
        }
        
        case 'triggerPipeline': {
          const params = tool.parameters as { pipelineName: string };
          const result = await controller.triggerPipeline(params.pipelineName);
          return { status: 'success', result };
        }
        
        case 'getPipelineExecutionLogs': {
          const params = tool.parameters as { pipelineName: string; executionId: string };
          const result = await controller.getPipelineExecutionLogs(
            params.pipelineName, 
            params.executionId
          );
          return { status: 'success', result };
        }
        
        case 'stopPipelineExecution': {
          const params = tool.parameters as { 
            pipelineName: string; 
            executionId: string; 
            reason?: string 
          };
          const result = await controller.stopPipelineExecution(
            params.pipelineName, 
            params.executionId, 
            params.reason || 'Stopped by user'
          );
          return { status: 'success', result };
        }
        
        default:
          return {
            status: 'error',
            error: {
              code: 'UNKNOWN_TOOL',
              message: `Unknown tool: ${tool.name}`
            }
          };
      }
    } catch (error: any) {
      console.error('Error handling tool:', error);
      return {
        status: 'error',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Internal server error'
        }
      };
    }
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`MCP server running on port ${this.port}`);
      console.log(`Server description available at http://localhost:${this.port}/`);
      console.log(`Health check available at http://localhost:${this.port}/health`);
      console.log(`MCP tools endpoint available at http://localhost:${this.port}/tools`);
    });
  }
}
