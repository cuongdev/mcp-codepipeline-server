import AWS from 'aws-sdk';
import { getEnv } from './utils/env.js';

export class CodePipelineManager {
  private codepipeline: AWS.CodePipeline;

  constructor() {
    // Get AWS configuration from environment variables
    const region = getEnv('AWS_REGION', 'us-west-2'); // Default to us-west-2 if not provided
    const accessKeyId = getEnv('AWS_ACCESS_KEY_ID');
    const secretAccessKey = getEnv('AWS_SECRET_ACCESS_KEY');
    
    // Configure AWS SDK
    const awsConfig: AWS.ConfigurationOptions = { region };
    
    // Add credentials if provided
    if (accessKeyId && secretAccessKey) {
      awsConfig.credentials = new AWS.Credentials({
        accessKeyId,
        secretAccessKey
      });
    }
    
    // Update AWS SDK configuration
    AWS.config.update(awsConfig);
    
    console.log(`AWS CodePipeline manager initialized with region: ${region}`);
    this.codepipeline = new AWS.CodePipeline(awsConfig);
  }

  getCodePipeline(): AWS.CodePipeline {
    return this.codepipeline;
  }
}

// Types for the API responses
export interface PipelineSummary {
  name: string;
  version: number;
  created: string;
  updated: string;
}

export interface TransitionState {
  enabled: boolean;
  lastChangedBy?: string;
  lastChangedAt?: Date | string;
  disabledReason?: string;
}

export interface StageExecution {
  pipelineExecutionId: string;
  status: string;
}

export interface ErrorDetails {
  code: string;
  message: string;
}

export interface ActionExecution {
  status: string;
  summary?: string;
  lastStatusChange: Date | string;
  token?: string;
  externalExecutionId?: string;
  externalExecutionUrl?: string;
  errorDetails?: ErrorDetails;
}

export interface ActionRevision {
  revisionId: string;
  revisionChangeId: string;
  created: Date | string;
}

export interface ActionState {
  actionName: string;
  currentRevision?: ActionRevision;
  latestExecution?: ActionExecution;
  entityUrl?: string;
}

export interface StageState {
  stageName: string;
  inboundTransitionState?: TransitionState;
  actionStates: ActionState[];
  latestExecution?: StageExecution;
}

export interface PipelineState {
  pipelineName: string;
  pipelineVersion: number;
  stageStates: StageState[];
  created: string;
  updated: string;
}

export interface ArtifactRevision {
  name: string;
  revisionId: string;
  revisionChangeIdentifier: string;
  revisionSummary: string;
  created: string;
  revisionUrl: string;
}

export interface PipelineExecution {
  pipelineExecutionId: string;
  status: string;
  artifactRevisions: ArtifactRevision[];
}

export interface ApprovalRequest {
  pipelineName: string;
  stageName: string;
  actionName: string;
  token: string;
}

export interface RetryStageRequest {
  pipelineName: string;
  stageName: string;
  pipelineExecutionId: string;
}

export interface TriggerPipelineRequest {
  pipelineName: string;
}
