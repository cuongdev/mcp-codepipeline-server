import { Router } from 'express';
import { CodePipelineController } from '../controllers/codepipeline.controller.js';

const router = Router();
const codePipelineController = new CodePipelineController();

// List all pipelines
router.get('/pipelines', codePipelineController.listPipelines);

// Get pipeline state
router.get('/pipelines/:pipelineName/state', codePipelineController.getPipelineState);

// List pipeline executions
router.get('/pipelines/:pipelineName/executions', codePipelineController.listPipelineExecutions);

// Approve or reject a manual approval action
router.post('/pipelines/approve', codePipelineController.approveAction);

// Retry a failed stage
router.post('/pipelines/retry-stage', codePipelineController.retryStage);

// Trigger a pipeline execution
router.post('/pipelines/trigger', codePipelineController.triggerPipeline);

// Get pipeline execution logs
router.get('/pipelines/:pipelineName/executions/:executionId/logs', codePipelineController.getPipelineExecutionLogs);

// Stop pipeline execution
router.post('/pipelines/:pipelineName/executions/:executionId/stop', codePipelineController.stopPipelineExecution);

export default router;
