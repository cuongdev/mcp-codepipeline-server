declare module '@modelcontextprotocol/sdk' {
  export interface ParamDefinition {
    type: string;
    description: string;
    required?: boolean;
    enum?: string[];
    properties?: Record<string, ParamDefinition>;
    items?: ParamDefinition;
  }

  export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, ParamDefinition | string>;
  }

  export interface Tool {
    name: string;
    parameters: Record<string, any>;
  }

  export interface ErrorDetail {
    message: string;
    code: string;
    details?: any;
  }

  export interface SuccessResult {
    result: any;
  }

  export interface ErrorResult {
    error: ErrorDetail;
  }

  export interface MCPServerConfig {
    serverName: string;
    serverVersion: string;
    serverDescription: string;
    toolDefinitions: ToolDefinition[];
  }

  export class MCPRouter {
    constructor(server: MCPServer);
    router: any;
  }

  export class MCPServer {
    constructor(config: MCPServerConfig);
    protected handleTool(tool: Tool): Promise<SuccessResult | ErrorResult>;
  }
}
