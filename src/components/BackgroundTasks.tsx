import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Play, Zap, Settings } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { StarRating } from './StarRating';
import { BackgroundTask, Agent } from '../types';
import { dbService } from '../services/database';
import { chatService } from '../services/chat';
import { agentCapabilitiesService } from '../services/agentCapabilities';
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

  const handleRateTask = async (taskId: string, rating: number) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, rating } : task
    );
    setTasks(updatedTasks);

    // Save the updated task
    const task = updatedTasks.find(t => t.id === taskId);
    if (task) {
      await dbService.saveBackgroundTask(task);
    }
  };

  const getStatusIcon = (status: BackgroundTask['status']) => {
                {task.result && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-1">Result:</p>
                    <div className="text-sm">
                      <MarkdownRenderer content={task.result} className="prose-sm" />
                    </div>
                    
                    {/* Task Rating */}
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">Rate this result:</span>
                        <StarRating
                          rating={task.rating || 0}
                          onRatingChange={(rating) => handleRateTask(task.id, rating)}
                          size="sm"
                        />
                      </div>
                      {task.rating && (
                        <p className="text-xs text-green-600 mt-1">
                          This feedback helps improve the agent's performance
                        </p>
                      )}
                    </div>
                  </div>
                )}
}