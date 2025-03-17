# MCP Server for AWS CodePipeline - Beginner's Guide

## 1. Project Overview

### What is an MCP Server?

A Model Context Protocol (MCP) server creates a bridge between Cascade (the AI assistant in Windsurf IDE) and external services like AWS. Think of it as a translator that converts natural language requests into API calls to specific services.

**Example**: When you ask Cascade "List all my CodePipeline pipelines," the MCP server translates this into an AWS API call and returns the results.

### Goals
- Create a Model Context Protocol (MCP) server that allows Cascade to interact with AWS CodePipeline
- Enable natural language control of pipeline operations through Windsurf
- Provide a secure and efficient bridge between the Windsurf IDE and AWS services

### What You'll Build
- A server that can list and manage AWS CodePipeline resources
- Functionality to view pipeline states, executions, and details
- Capability to trigger pipeline executions, approvals, and other operations
- Proper authentication and error handling mechanisms

### Key Technologies
- **TypeScript**: Used for type-safe development (don't worry if you're new to it!)
- **Node.js**: Runtime environment for JavaScript
- **Express**: Simple HTTP server framework
- **AWS SDK**: Library to interact with AWS services
- **Model Context Protocol SDK**: Framework for MCP implementation
- **ES Modules**: Modern JavaScript module system

### Visual Overview

```
User → Windsurf → Cascade → MCP Server → AWS CodePipeline
    ↑                                         |
    |                                         |
    └─────────────── Results ────────────────┘
```

## 2. Getting Started: Step by Step

### Setting Up Your Project

1. **Create a new project folder**
   ```bash
   mkdir my-mcp-server
   cd my-mcp-server
   ```

2. **Initialize Node.js project**
   ```bash
   npm init -y
   ```

3. **Install dependencies**
   ```bash
   npm install @modelcontextprotocol/sdk express aws-sdk cors body-parser dotenv
   npm install --save-dev typescript @types/express @types/node @types/cors @types/body-parser
   ```

4. **Create TypeScript configuration**
   Create a file named `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "NodeNext",
       "moduleResolution": "NodeNext",
       "esModuleInterop": true,
       "outDir": "./dist",
       "strict": true
     },
     "include": ["src/**/*"]
   }
   ```

5. **Add scripts to package.json**
   Update your `package.json` to include:
   ```json
   "scripts": {
     "build": "tsc",
     "start": "node dist/index.js",
     "dev": "ts-node src/index.ts"
   }
   ```

### Folder Structure Overview

Create this folder structure step by step:

```
my-mcp-server/
├── src/
│   ├── config/                  # Server configuration
│   ├── controllers/             # HTTP request handlers
│   ├── routes/                  # API routes
│   ├── services/                # Business logic & AWS API calls
│   ├── utils/                   # Helper functions
│   ├── types/                   # TypeScript interfaces
│   ├── index.ts                 # Entry point
│   └── mcp-server.ts            # MCP implementation
├── .env                         # Environment variables
├── .gitignore                   # Git ignore rules
└── package.json                 # Project config
```

**Pro Tip**: Don't worry about creating all files at once. We'll build them one by one as we progress.

### How the Files Work Together

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐     ┌─────────┐
│   index.ts  │────▶│ mcp-server.ts│────▶│ controllers │────▶│services │────▶ AWS
└─────────────┘     └──────────────┘     └────────────┘     └─────────┘
      ▲                    ▲                   ▲                 ▲
      │                    │                   │                 │
      └─ Starts both ◀────┘                   │                 │
         servers           Uses interfaces ────┘                 │
                           from types/         Calls methods ───┘
```

## 3. Building Your First MCP Server Components

### Core Concepts Made Simple

Let's break down each key component with simple explanations and examples:

### Step 1: Define Your Environment Helper

Create `src/utils/env.ts` to load environment variables:

```typescript
// src/utils/env.ts
import dotenv from 'dotenv';
import path from 'path';

export function loadEnv(): void {
  // Load .env file if it exists
  dotenv.config();
  console.log('Environment variables loaded');
}

// Helper to get environment variables
export function getEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}
```

### Step 2: Create Server Configuration

Create `src/config/server-config.ts` to define your server's metadata:

```typescript
// src/config/server-config.ts
export const serverConfig = {
  name: "my-aws-mcp-server",
  version: "1.0.0",
  displayName: "My AWS MCP Server",
  description: "MCP server for interacting with AWS services",
  publisher: "Your Name",
  license: "MIT"
};
```

### Step 3: Define Your AWS Service

Create `src/services/aws-service.ts` to handle AWS SDK calls:

```typescript
// src/services/aws-service.ts
import AWS from 'aws-sdk';
import { getEnv } from '../utils/env.js';

export class AWSService {
  private awsService: AWS.Service;

  constructor() {
    const region = getEnv('AWS_REGION', 'us-west-2');
    
    // Initialize the specific AWS SDK service you need
    // For example, for S3:
    this.awsService = new AWS.S3({ region });
    
    console.log(`AWS service initialized with region: ${region}`);
  }

  // Add methods for each AWS operation
  // Example for S3 listBuckets:
  async listItems() {
    try {
      // Replace this with your specific AWS service call
      const result = await this.awsService.listBuckets().promise();
      return result;
    } catch (error) {
      console.error('Error listing items:', error);
      throw error;
    }
  }
}
```

### Step 4: Create a Controller

Create `src/controllers/aws-controller.ts` to handle HTTP requests:

```typescript
// src/controllers/aws-controller.ts
import { Request, Response } from 'express';
import { AWSService } from '../services/aws-service.js';

export class AWSController {
  private awsService: AWSService;

  constructor() {
    this.awsService = new AWSService();
  }

  // Example controller method
  listItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const items = await this.awsService.listItems();
      res.status(200).json({ items });
    } catch (error) {
      console.error('Error in listItems controller:', error);
      res.status(500).json({ error: 'Failed to list items' });
    }
  };
}
```

### Step 5: Define Routes

Create `src/routes/aws-routes.ts` to define API endpoints:

```typescript
// src/routes/aws-routes.ts
import { Router } from 'express';
import { AWSController } from '../controllers/aws-controller.js';

const router = Router();
const awsController = new AWSController();

// Define routes
router.get('/items', awsController.listItems);

export default router;
```

### Understanding MCP Interfaces

Here are the key interfaces you'll use, simplified:

#### Tool Interface
```typescript
// This is what Cascade sends to your MCP server
interface Tool {
  name: string;         // The name of the tool (e.g., "list_buckets")
  parameters: {         // The parameters the user provided
    [key: string]: any  // E.g., { "region": "us-west-2" }
  };
}
```

#### Tool Definition Interface
```typescript
// This tells Cascade what tools your MCP server provides
interface ToolDefinition {
  name: string;          // Tool name (e.g., "list_buckets")
  description: string;   // Human-readable description
  parameters: {          // What parameters this tool accepts
    type: "object",
    properties: {        // Define each parameter
      paramName: {
        type: "string",   // Parameter type
        description: "What this parameter does"
      }
      // More parameters...
    }
  }
}
```

## 4. Creating the MCP Server Implementation

### Step 6: Implement the MCP Server

Create `src/mcp-server.ts` - this is the heart of your MCP implementation:

```typescript
// src/mcp-server.ts
import { Server as BaseMCPServer } from "@modelcontextprotocol/sdk/server/index.js";

// Define your tools
const toolDefinitions = [
  {
    name: "list_items",              // Tool name for Cascade to call
    description: "List all items",    // Human-readable description
    parameters: {
      type: "object",
      properties: {}
    }
  },
  // Add more tool definitions here
];

// Create the MCP server class
export class MCPServer extends BaseMCPServer {
  constructor() {
    super();
    this.registerTools();
  }

  private registerTools() {
    // Register each tool with its handler
    this.router.register("list_items", this.handleTool.bind(this));
    // Register more tools here
  }

  // Handle tool execution
  async handleTool(tool) {
    try {
      // Call your API server
      const response = await fetch(`http://localhost:3000/api/${tool.name.replace('_', '/')}`, {
        method: "GET",
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      // Return success response
      return {
        status: 'success',
        result: data
      };
    } catch (error) {
      console.error(`Error executing tool ${tool.name}:`, error);
      
      // Return error response
      return {
        status: 'error',
        error: {
          code: 'EXECUTION_ERROR',
          message: `Failed to execute tool: ${error.message}`
        }
      };
    }
  }

  // Return tool definitions to the MCP framework
  getToolDefinitions() {
    return toolDefinitions;
  }
}
```

### Step 7: Create the Main Entry Point

Create `src/index.ts` to start both servers:

```typescript
// src/index.ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadEnv, getEnv } from './utils/env.js';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { MCPServer } from './mcp-server.js';
import awsRoutes from './routes/aws-routes.js';

// Load environment variables
loadEnv();

// Create and start the MCP server
const server = new MCPServer();
const transport = new StdioServerTransport();
server.connect(transport);

// Create and start the HTTP server
const app = express();
const PORT = parseInt(getEnv('PORT', '3000'));

// Configure middleware
app.use(cors());
app.use(bodyParser.json());

// Configure routes
app.use('/api', awsRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});

console.log("MCP Server started successfully");
```

### How the Processing Flow Works (Made Simple)

```
1. User: "List my AWS items"
   ↓
2. Cascade understands and calls your tool "list_items"
   ↓
3. MCP Server receives the request through StdioServerTransport
   ↓
4. MCPServer.handleTool() makes an HTTP request to your Express server
   ↓
5. Express routes the request to your controller
   ↓
6. Controller calls your service
   ↓
7. Service makes AWS API call
   ↓
8. Results travel back up the chain to the user
```

**Key Point**: Your MCP server actually has TWO servers running:
1. The MCP protocol server (communicates with Cascade)
2. An HTTP server (handles API requests from the MCP server)

## 5. Final Steps and Troubleshooting

### Step 8: Configure Environment Variables

Create a `.env` file in your project root:

```
PORT=3000
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

### Step 9: Create a .gitignore File

Create a `.gitignore` file to prevent sensitive information from being committed:

```
node_modules/
dist/
.env
*.log
.DS_Store
```

### Step 10: Build and Run Your Server

```bash
# Build your TypeScript code
npm run build

# Start your server
npm start
```

### Step 11: Configure Windsurf

Update your Windsurf MCP configuration (typically in `~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "your-service-name": {
      "command": "npx",
      "args": [
        "-y",
        "path/to/your-mcp-server/dist/index.js"
      ],
      "env": {
        "AWS_REGION": "your-region",
        "AWS_ACCESS_KEY_ID": "your-access-key",
        "AWS_SECRET_ACCESS_KEY": "your-secret-key"
      }
    }
  }
}
```

### Adding New AWS Operations (Simple Steps)

1. **Add a service method**: Create a new method in your service class
2. **Add a controller method**: Create a handler in your controller
3. **Add a route**: Connect the controller to an API endpoint
4. **Add a tool definition**: Tell Cascade about your new capability
5. **Register the tool handler**: Connect the tool to your implementation

### Common Issues and Solutions

#### 1. "Cannot find module" errors

**Problem**: TypeScript can't find imported modules

**Solution**: 
- Make sure you're using `.js` extensions in imports (ES modules requirement)  
- Check that the module is installed in package.json

#### 2. AWS SDK errors

**Problem**: AWS operations fail with authentication errors

**Solution**:
- Verify your AWS credentials in the .env file
- Check that the region is correct
- Ensure proper IAM permissions for the AWS operations

#### 3. MCP Server not communicating with Windsurf

**Problem**: Cascade can't access your tools

**Solution**:
- Check the path to your index.js file in mcp_config.json
- Verify that you're returning proper tool definitions
- Make sure both your Express and MCP servers are running

#### 4. "TypeError: Cannot read property of undefined"

**Problem**: Trying to access properties that don't exist

**Solution**:
- Use optional chaining (`?.`) when accessing nested properties
- Add null checks before accessing properties
- Add console.log statements to debug object structures

### What Next?

Once you have your basic MCP server working:

1. **Expand functionality**: Add more AWS operations
2. **Refine error handling**: Provide detailed error messages
3. **Add validation**: Validate inputs before processing
4. **Implement testing**: Add unit and integration tests
5. **Improve documentation**: Add comments and API docs

---

By following this beginner-friendly guide, you can create your own MCP server for any AWS service. Start with something simple, get it working, and then gradually expand its capabilities. Good luck with your MCP development journey!
