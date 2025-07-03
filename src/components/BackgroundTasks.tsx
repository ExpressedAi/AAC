import { MarkdownRenderer } from './MarkdownRenderer';
import { BackgroundTask, Agent } from '../types';
import { dbService } from '../services/database';
import { taskManagementService } from '../services/taskManagementService';

export const BackgroundTasks: React.FC = () => {
  const createTask = async () => {
    if (!selectedAgent || isCreating) {
      alert('Please select an agent');
      return;
    }
    if (taskType === 'general' && !taskPrompt.trim()) {
      alert('Please enter a task description');
      return;
    }
    if (taskType === 'capability' && (!selectedCapability || !capabilityInput.trim())) {
      alert('Please select a capability and provide input');
      return;
    }

    setIsCreating(true);
    
    try {
      // Use the new task management service for parallel execution
      await taskManagementService.initiateBackgroundTask(
        selectedAgent,
        taskType === 'general' ? taskPrompt : capabilityInput,
        taskType,
        selectedCapability,
        capabilityInput
      );
      
      // Clear form
      setTaskPrompt('');
      setCapabilityInput('');
      setSelectedAgent('');
      setSelectedCapability('');
      
      // Refresh task list
      await loadTasks();
      
      alert('Task initiated successfully! It will run in parallel.');
    } catch (error) {
      console.error('Error creating task:', error);
      alert(`Error creating task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };
}