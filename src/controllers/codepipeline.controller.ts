import { Request, Response } from 'express';
import { CodePipelineService } from '../services/codepipeline.service.js';
import { 
  ApprovalRequest, 
  RetryStageRequest, 
  TriggerPipelineRequest 
} from '../types/codepipeline.js';

export class CodePipelineController {
  private codePipelineService: CodePipelineService;

  constructor() {
    this.codePipelineService = new CodePipelineService();
  }

  /**
   * List all pipelines
   */
  listPipelines = async (req: Request, res: Response): Promise<void> => {
    try {
      const pipelines = await this.codePipelineService.listPipelines();
      res.status(200).json({ pipelines });
    } catch (error) {
      console.error('Error in listPipelines controller:', error);
      res.status(500).json({ error: 'Failed to list pipelines' });
    }
  };

  /**
   * Get pipeline state
   */
  getPipelineState = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pipelineName } = req.params;
      
      if (!pipelineName) {
        res.status(400).json({ error: 'Pipeline name is required' });
        return;
      }

      const pipelineState = await this.codePipelineService.getPipelineState(pipelineName);
      res.status(200).json({ pipelineState });
    } catch (error) {
      console.error('Error in getPipelineState controller:', error);
      res.status(500).json({ error: 'Failed to get pipeline state' });
    }
  };

  /**
   * List pipeline executions
   */
  listPipelineExecutions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pipelineName } = req.params;
      
      if (!pipelineName) {
        res.status(400).json({ error: 'Pipeline name is required' });
        return;
      }

      const executions = await this.codePipelineService.listPipelineExecutions(pipelineName);
      res.status(200).json({ executions });
    } catch (error) {
      console.error('Error in listPipelineExecutions controller:', error);
      res.status(500).json({ error: 'Failed to list pipeline executions' });
    }
  };

  /**
   * Approve a manual approval action
   */
  approveAction = async (req: Request, res: Response): Promise<void> => {
    try {
      const approvalRequest: ApprovalRequest = req.body;
      const { approved, comments } = req.body;
      
      if (!approvalRequest.pipelineName || !approvalRequest.stageName || 
          !approvalRequest.actionName || !approvalRequest.token) {
        res.status(400).json({ error: 'Missing required approval parameters' });
        return;
      }

      await this.codePipelineService.approveAction(
        approvalRequest, 
        approved === true, 
        comments || ''
      );
      
      res.status(200).json({ 
        message: `Action ${approved ? 'approved' : 'rejected'} successfully` 
      });
    } catch (error) {
      console.error('Error in approveAction controller:', error);
      res.status(500).json({ error: 'Failed to process approval' });
    }
  };

  /**
   * Retry a failed stage
   */
  retryStage = async (req: Request, res: Response): Promise<void> => {
    try {
      const retryRequest: RetryStageRequest = req.body;
      
      if (!retryRequest.pipelineName || !retryRequest.stageName || !retryRequest.pipelineExecutionId) {
        res.status(400).json({ error: 'Missing required retry parameters' });
        return;
      }

      await this.codePipelineService.retryStageExecution(retryRequest);
      res.status(200).json({ message: 'Stage retry initiated successfully' });
    } catch (error) {
      console.error('Error in retryStage controller:', error);
      res.status(500).json({ error: 'Failed to retry stage' });
    }
  };

  /**
   * Trigger a pipeline execution
   */
  triggerPipeline = async (req: Request, res: Response): Promise<void> => {
    try {
      const triggerRequest: TriggerPipelineRequest = req.body;
      
      if (!triggerRequest.pipelineName) {
        res.status(400).json({ error: 'Pipeline name is required' });
        return;
      }

      const executionId = await this.codePipelineService.startPipelineExecution(triggerRequest);
      res.status(200).json({ 
        message: 'Pipeline triggered successfully', 
        executionId 
      });
    } catch (error) {
      console.error('Error in triggerPipeline controller:', error);
      res.status(500).json({ error: 'Failed to trigger pipeline' });
    }
  };

  /**
   * Get pipeline execution logs
   */
  getPipelineExecutionLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pipelineName, executionId } = req.params;
      
      if (!pipelineName || !executionId) {
        res.status(400).json({ error: 'Pipeline name and execution ID are required' });
        return;
      }

      const logs = await this.codePipelineService.getPipelineExecutionLogs(pipelineName, executionId);
      res.status(200).json({ logs });
    } catch (error) {
      console.error('Error in getPipelineExecutionLogs controller:', error);
      res.status(500).json({ error: 'Failed to get pipeline execution logs' });
    }
  };

  /**
   * Stop pipeline execution
   */
  stopPipelineExecution = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pipelineName, executionId } = req.params;
      const { reason } = req.body;
      
      if (!pipelineName || !executionId) {
        res.status(400).json({ error: 'Pipeline name and execution ID are required' });
        return;
      }

      await this.codePipelineService.stopPipelineExecution(pipelineName, executionId, reason);
      res.status(200).json({ message: 'Pipeline execution stopped successfully' });
    } catch (error) {
      console.error('Error in stopPipelineExecution controller:', error);
      res.status(500).json({ error: 'Failed to stop pipeline execution' });
    }
  };
}
