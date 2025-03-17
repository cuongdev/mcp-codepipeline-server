interface ServerDescription {
  name: string;
  version: string;
  displayName?: string;
  description?: string;
  publisher?: string;
  homepage?: string;
  license?: string;
  repository?: string;
}

export const serverConfig: ServerDescription = {
  name: "aws-codepipeline-mcp-server",
  version: "1.0.0",
  displayName: "AWS CodePipeline MCP Server",
  description: "MCP server for interacting with AWS CodePipeline services",
  publisher: "Cuong T Nguyen",
  homepage: "https://cuong.asia",
  license: "MIT",
  repository: "https://github.com/cuongdev/mcp-codepipeline-server"
};
