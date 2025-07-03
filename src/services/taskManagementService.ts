import { Agent, BackgroundTask } from '../types';
import { dbService } from './database';
import { chatService } from './chat';
import { agentCapabilitiesService } from './agentCapabilities';

export class TaskManagementService {
  private static instance: TaskManagementService;

  static getInstance(): TaskManagementService {
    if (!TaskManagementService.instance) {
      TaskManagementService.instance = new TaskManagementService();
    }
    return TaskManagementService.instance;
  }

  async initiateBackgroundTask(
    agentId: string,
    prompt: string,
    taskType: 'general' | 'capability' = 'general',
    capability?: string,
    capabilityInput?: string
  ): Promise<string> {
    // Get agent details
    const agents = this.getAgents();
    const agent = agents.find(a => a.id === agentId);
    
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    // Create initial task
    const task: BackgroundTask = {
      id: Date.now().toString(),
      agentId,
      prompt: taskType === 'general' ? prompt : `Use ${capability} capability: ${capabilityInput}`,
      capability: taskType === 'capability' ? capability : undefined,
      status: 'pending',
      timestamp: new Date()
    };

    // Save initial task
    await dbService.saveBackgroundTask(task);

    // Execute task asynchronously without blocking
    this.executeTaskAsync(task, agent, taskType, capability, capabilityInput);

    return task.id;
  }

  private async executeTaskAsync(
    task: BackgroundTask,
    agent: Agent,
    taskType: 'general' | 'capability',
    capability?: string,
    capabilityInput?: string
  ): Promise<void> {
    try {
      // Update status to running
      task.status = 'running';
      await dbService.saveBackgroundTask(task);

      let response;

      if (taskType === 'capability' && capability) {
        // Execute using capability
        const capabilityResult = await agentCapabilitiesService.executeCapability(
          agent,
          capability,
          capabilityInput || '',
          'Please complete this task using your specialized capability.'
        );
        
        if (capabilityResult.success) {
          response = { content: JSON.stringify(capabilityResult.result, null, 2) };
        } else {
          response = { error: capabilityResult.error };
        }
      } else {
        // Execute as general task
        const fullPrompt = `${agent.prompt}\n\nTask: ${task.prompt}`;
        response = await chatService.sendBackgroundTask(agent.id, fullPrompt, agent.apiKey);
      }

      // Update task with result
      if (response.error) {
        task.status = 'error';
        task.error = response.error;
      } else {
        task.status = 'completed';
        task.result = response.content;
      }

      await dbService.saveBackgroundTask(task);
    } catch (error) {
      console.error('Error executing background task:', error);
      task.status = 'error';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      await dbService.saveBackgroundTask(task);
    }
  }

  private getAgents(): Agent[] {
    try {
      const savedAgents = localStorage.getItem('agents');
      return savedAgents ? JSON.parse(savedAgents) : [];
    } catch (error) {
      console.error('Error loading agents:', error);
      return [];
    }
  }

  getActiveAgents(): Agent[] {
    return this.getAgents().filter(agent => agent.isActive);
  }

  async getAllTasks(): Promise<BackgroundTask[]> {
    return await dbService.getBackgroundTasks();
  }

  async getTaskById(taskId: string): Promise<BackgroundTask | null> {
    const tasks = await this.getAllTasks();
    return tasks.find(task => task.id === taskId) || null;
  }
}

export const taskManagementService = TaskManagementService.getInstance();