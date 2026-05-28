[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/cuongdev-mcp-codepipeline-server-badge.png)](https://mseep.ai/app/cuongdev-mcp-codepipeline-server)

# AWS CodePipeline MCP Server

This is a Model Context Protocol (MCP) server that integrates with AWS CodePipeline, allowing you to manage your pipelines through Windsurf and Cascade. The server provides a standardized interface for interacting with AWS CodePipeline services.

**Author:** Cuong T Nguyen

## Features

- List all pipelines
- Get pipeline state and detailed pipeline definitions
- List pipeline executions
- Approve or reject manual approval actions
- Retry failed stages
- Trigger pipeline executions
- View pipeline execution logs
- Stop pipeline executions
- Tag pipeline resources
- Create webhooks for automatic pipeline triggering
- Get pipeline performance metrics

## Prerequisites

- Node.js (v14 or later)
- AWS account with CodePipeline access
- AWS credentials with permissions for CodePipeline and CloudWatch (read metrics)
- Windsurf IDE with Cascade AI assistant

## Installation

1. Clone this repository:

```bash
git clone https://github.com/cuongdev/mcp-codepipeline-server.git
cd mcp-codepipeline-server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on the `.env.example` template:

```bash
cp .env.example .env
```

4. Update the `.env` file with your AWS configuration (see `.env.example`):

```
AWS_REGION=us-east-1
AWS_PROFILE=your-aws-profile
```

> **Note**: For security, never commit your `.env` file to version control.

### AWS authentication

You do **not** need long-lived access keys in `.env`. Pick one approach:

| Approach | Configuration |
|----------|----------------|
| **AWS profile** (recommended for local dev) | `AWS_PROFILE=my-profile` — uses `~/.aws/credentials` / `~/.aws/config` |
| **AWS SSO** | `aws configure sso` then `aws sso login --profile my-sso` and set `AWS_PROFILE=my-sso` |
| **Static keys** | Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (and `AWS_SESSION_TOKEN` for temporary creds) |
| **IAM role** | Run on EC2/ECS/Lambda/EKS with an attached role; set only `AWS_REGION` |

If access keys are omitted, the AWS SDK uses its [default credential provider chain](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials.html).

### Creating an AWS profile

A **profile** is a named entry in `~/.aws/credentials` and `~/.aws/config`. Set `AWS_PROFILE` to that name in `.env` or MCP config.

#### Option A: Access keys (IAM user)

Requires [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).

```bash
aws configure --profile codepipeline-dev
```

You will be prompted for:

| Prompt | Example |
|--------|---------|
| AWS Access Key ID | `AKIA...` |
| AWS Secret Access Key | (secret) |
| Default region name | `us-east-1` |
| Default output format | `json` |

Then in `.env`:

```
AWS_REGION=us-east-1
AWS_PROFILE=codepipeline-dev
```

#### Option B: AWS SSO (IAM Identity Center)

```bash
aws configure sso --profile codepipeline-sso
```

Follow the prompts (SSO start URL, SSO region, account, role). Then log in before starting the MCP server:

```bash
aws sso login --profile codepipeline-sso
```

In `.env`:

```
AWS_REGION=us-east-1
AWS_PROFILE=codepipeline-sso
```

SSO sessions expire; run `aws sso login` again when you see credential errors.

#### Verify the profile

```bash
aws sts get-caller-identity --profile codepipeline-dev
aws codepipeline list-pipelines --region us-east-1 --profile codepipeline-dev
```

If both commands succeed, the MCP server can use the same `AWS_PROFILE` and `AWS_REGION`.

#### Files created (reference)

`~/.aws/credentials`:

```ini
[codepipeline-dev]
aws_access_key_id = AKIA...
aws_secret_access_key = ...
```

`~/.aws/config`:

```ini
[profile codepipeline-dev]
region = us-east-1
output = json
```

## Usage

### Build the project

```bash
npm run build
```

### Start the server

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

## Integration with Windsurf

This MCP server is designed to work with Windsurf, allowing Cascade to interact with AWS CodePipeline through natural language requests.

### Setup Steps

1. Make sure the server is running:

```bash
npm start
```

2. Add the server configuration to your Windsurf MCP config file at `~/.codeium/windsurf/mcp_config.json`:

```json
{
   "mcpServers": {
    "codepipeline": {
      "command": "npx",
      "args": [
        "-y",
        "path/to/mcp-codepipeline-server/dist/index.js"
      ],
      "env": {
        "AWS_REGION": "us-east-1",
        "AWS_PROFILE": "your-aws-profile"
      }
    }
  }
}
```

3. Create the directory if it doesn't exist:

```bash
mkdir -p ~/.codeium/windsurf
touch ~/.codeium/windsurf/mcp_config.json
```

4. Restart Windsurf to load the new MCP server configuration

### Using with Cascade

Once configured, you can interact with AWS CodePipeline using natural language in Windsurf. For example:

- "List all my CodePipeline pipelines"
- "Show me the current state of my 'production-deploy' pipeline"
- "Trigger the 'test-build' pipeline"
- "Get metrics for my 'data-processing' pipeline"
- "Create a webhook for my 'frontend-deploy' pipeline"

Cascade will translate these requests into the appropriate MCP tool calls.

## MCP Tools

### Core Pipeline Management

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `list_pipelines` | List all CodePipeline pipelines | None |
| `get_pipeline_state` | Get the state of a specific pipeline | `pipelineName`: Name of the pipeline |
| `list_pipeline_executions` | List executions for a specific pipeline | `pipelineName`: Name of the pipeline |
| `trigger_pipeline` | Trigger a pipeline execution | `pipelineName`: Name of the pipeline |
| `stop_pipeline_execution` | Stop a pipeline execution | `pipelineName`: Name of the pipeline<br>`executionId`: Execution ID<br>`reason`: Optional reason for stopping |

### Pipeline Details and Metrics

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_pipeline_details` | Get the full definition of a pipeline | `pipelineName`: Name of the pipeline |
| `get_pipeline_execution_logs` | Get logs for a pipeline execution | `pipelineName`: Name of the pipeline<br>`executionId`: Execution ID |
| `get_pipeline_metrics` | Get performance metrics for a pipeline | `pipelineName`: Name of the pipeline<br>`period`: Optional metric period in seconds<br>`startTime`: Optional start time for metrics<br>`endTime`: Optional end time for metrics |

### Pipeline Actions and Integrations

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `approve_action` | Approve or reject a manual approval action | `pipelineName`: Name of the pipeline<br>`stageName`: Name of the stage<br>`actionName`: Name of the action<br>`token`: Approval token<br>`approved`: Boolean indicating approval or rejection<br>`comments`: Optional comments |
| `retry_stage` | Retry a failed stage | `pipelineName`: Name of the pipeline<br>`stageName`: Name of the stage<br>`pipelineExecutionId`: Execution ID |
| `tag_pipeline_resource` | Add or update tags for a pipeline resource | `pipelineName`: Name of the pipeline<br>`tags`: Array of key-value pairs for tagging |
| `create_pipeline_webhook` | Create a webhook for a pipeline | `pipelineName`: Name of the pipeline<br>`webhookName`: Name for the webhook<br>`targetAction`: Target action for the webhook<br>`authentication`: Authentication type<br>`authenticationConfiguration`: Optional auth config<br>`filters`: Optional event filters |

## Troubleshooting

### Common Issues

1. **Connection refused error**:
   - Ensure the server is running on the specified port
   - Check if the port is blocked by a firewall

2. **AWS credential errors**:
   - For profiles/SSO: run `aws sso login --profile YOUR_PROFILE` if needed, then set `AWS_PROFILE`
   - For static keys: verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `.env` or MCP `env`
   - Ensure the principal has CodePipeline (and CloudWatch for metrics) permissions
   - Check server startup logs for `AWS credentials: default provider chain` vs `static keys`

3. **Windsurf not detecting the MCP server**:
   - Check the `mcp_config.json` file format
   - Ensure the server URL is correct
   - Restart Windsurf after making changes

### Logs

The server logs information to the console. Check these logs for troubleshooting:

```bash
# Run with more verbose logging
DEBUG=* npm start
```

## Examples

### Creating a Webhook for GitHub Integration

```json
{
  "pipelineName": "my-pipeline",
  "webhookName": "github-webhook",
  "targetAction": "Source",
  "authentication": "GITHUB_HMAC",
  "authenticationConfiguration": {
    "SecretToken": "my-secret-token"
  },
  "filters": [
    {
      "jsonPath": "$.ref",
      "matchEquals": "refs/heads/main"
    }
  ]
}
```

### Getting Pipeline Metrics

```json
{
  "pipelineName": "my-pipeline",
  "period": 86400,
  "startTime": "2025-03-10T00:00:00Z",
  "endTime": "2025-03-17T23:59:59Z"
}
```

## License

ISC
