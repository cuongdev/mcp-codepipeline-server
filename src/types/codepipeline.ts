export interface PipelineSummary {
  name: string;
  version: number;
  created: string;
  updated: string;
}

export interface StageExecution {
  pipelineExecutionId: string;
  status: string;
}

export interface ActionRevision {
  revisionId: string;
  revisionChangeId: string;
  created: string | Date;
}

export interface ActionExecutionError {
  code: string;
  message: string;
}

export interface ActionExecution {
  status: string;
  summary?: string;
  lastStatusChange: string | Date;
  token?: string;
  externalExecutionId?: string;
  externalExecutionUrl?: string;
  errorDetails?: ActionExecutionError;
}

export interface ActionState {
  actionName: string;
  currentRevision?: ActionRevision;
  latestExecution?: ActionExecution;
  entityUrl?: string;
}

export interface TransitionState {
  enabled: boolean;
  lastChangedBy?: string;
  lastChangedAt?: string | Date;
  disabledReason?: string;
}

export interface StageExecution {
  pipelineExecutionId: string;
  status: string;
  startTime?: Date;
  lastUpdateTime?: Date;
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

export interface PipelineExecution {
  pipelineExecutionId: string;
  status: string;
  artifactRevisions?: {
    name: string;
    revisionId: string;
    revisionChangeIdentifier: string;
    revisionSummary: string;
    created: string;
    revisionUrl: string;
  }[];
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
