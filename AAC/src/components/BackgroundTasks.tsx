import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Play, Zap, Settings } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { BackgroundTask, Agent } from '../types';
import { dbService } from '../services/database';
import { chatService } from '../services/chat';
import { agentCapabilitiesService } from '../services/agentCapabilities';

export const BackgroundTasks: React.FC = () => {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [taskPrompt, setTaskPrompt] = useState('');
  const [selectedCapability, setSelectedCapability] = useState<string>('');
  const [capabilityInput, setCapabilityInput] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [taskType, setTaskType] = useState<'general' | 'capability'>('general');

  useEffect(() => {
    loadTasks();
    loadAgents();
    
    const interval = setInterval(loadTasks, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadTasks = async () => {
    try {
      const backgroundTasks = await dbService.getBackgroundTasks();
      const sortedTasks = backgroundTasks.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setTasks(sortedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadAgents = () => {
    const savedAgents = localStorage.getItem('agents');
    if (savedAgents) {
      const allAgents = JSON.parse(savedAgents);
      setAgents(allAgents.filter((agent: Agent) => agent.isActive));
    }
  };

  const createTask = async () => {
    if (!selectedAgent || isCreating) return;
    if (taskType === 'general' && !taskPrompt.trim()) return;
    if (taskType === 'capability' && (!selectedCapability || !capabilityInput.trim())) return;

    setIsCreating(true);
    
    const agent = agents.find(a => a.id === selectedAgent);
    if (!agent) return;

    const task: BackgroundTask = {
      id: Date.now().toString(),
      agentId: selectedAgent,
      prompt: taskType === 'general' ? taskPrompt : `Use ${selectedCapability} capability: ${capabilityInput}`,
      capability: taskType === 'capability' ? selectedCapability : undefined,
      status: 'pending',
      timestamp: new Date()
    };

    try {
      await dbService.saveBackgroundTask(task);
      
      // Update task status to running
      task.status = 'running';
      await dbService.saveBackgroundTask(task);
      
      let response;
      
      if (taskType === 'capability' && selectedCapability) {
        // Execute using capability
        const capabilityResult = await agentCapabilitiesService.executeCapability(
          agent,
          selectedCapability,
          capabilityInput,
          'Please complete this task using your specialized capability.'
        );
        
        if (capabilityResult.success) {
          response = { content: JSON.stringify(capabilityResult.result, null, 2) };
        } else {
          response = { error: capabilityResult.error };
        }
      } else {
        // Execute as general task
        response = await chatService.sendBackgroundTask(agent.id, agent.prompt + '\n\nTask: ' + taskPrompt, agent.apiKey);
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
      await loadTasks();
      
      setTaskPrompt('');
      setCapabilityInput('');
      setSelectedAgent('');
      setSelectedCapability('');
    } catch (error) {
      console.error('Error creating task:', error);
      task.status = 'error';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      await dbService.saveBackgroundTask(task);
      await loadTasks();
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusIcon = (status: BackgroundTask['status']) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      case 'running':
        return <AlertCircle size={16} className="text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: BackgroundTask['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSelectedAgentCapabilities = () => {
    const agent = agents.find(a => a.id === selectedAgent);
    return agent?.capabilities?.filter(cap => cap.enabled) || [];
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="p-4 border-b border-blue-200 bg-blue-50">
        <h2 className="text-lg font-semibold text-blue-800 mb-4">Background Tasks</h2>
        
        {/* Create Task Form */}
        <div className="space-y-3">
          {/* Task Type Selection */}
          <div className="flex space-x-1 bg-blue-100 rounded-lg p-1">
            <button
              onClick={() => setTaskType('general')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                taskType === 'general'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              <Play size={16} />
              <span>General Task</span>
            </button>
            <button
              onClick={() => setTaskType('capability')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                taskType === 'capability'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              <Zap size={16} />
              <span>Use Capability</span>
            </button>
          </div>

          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 text-sm bg-white shadow-sm"
          >
            <option value="">Select an agent...</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          
          {taskType === 'general' ? (
            <textarea
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              placeholder="Enter task description..."
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 text-sm resize-none bg-white shadow-sm"
              rows={3}
            />
          ) : (
            <>
              <select
                value={selectedCapability}
                onChange={(e) => setSelectedCapability(e.target.value)}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 text-sm bg-white shadow-sm"
                disabled={!selectedAgent}
              >
                <option value="">Select a capability...</option>
                {getSelectedAgentCapabilities().map((capability) => (
                  <option key={capability.id} value={capability.id}>
                    {capability.name}
                  </option>
                ))}
              </select>
              
              <textarea
                value={capabilityInput}
                onChange={(e) => setCapabilityInput(e.target.value)}
                placeholder="Enter input for the selected capability..."
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 text-sm resize-none bg-white shadow-sm"
                rows={3}
                disabled={!selectedCapability}
              />
            </>
          )}
          
          <button
            onClick={createTask}
            disabled={
              !selectedAgent || 
              isCreating || 
              (taskType === 'general' && !taskPrompt.trim()) ||
              (taskType === 'capability' && (!selectedCapability || !capabilityInput.trim()))
            }
            className="flex items-center space-x-2 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm shadow-md"
          >
            {taskType === 'capability' ? <Zap size={16} /> : <Play size={16} />}
            <span>{isCreating ? 'Creating...' : 'Create Task'}</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center text-blue-500 mt-8">
            <Clock size={48} className="mx-auto mb-4 text-blue-300" />
            <p>No background tasks yet</p>
          </div>
        ) : (
          tasks.map((task) => {
            const agent = agents.find(a => a.id === task.agentId);
            return (
              <div key={task.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(task.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {task.timestamp.toLocaleString()}
                  </div>
                </div>
                
                <div className="mb-2">
                  <p className="text-sm font-medium text-blue-700">Agent: {agent?.name || 'Unknown'}</p>
                  {task.capability && (
                    <p className="text-xs text-blue-500 flex items-center mt-1">
                      <Zap size={12} className="mr-1" />
                      Capability: {task.capability.replace('_', ' ')}
                    </p>
                  )}
                  <p className="text-sm text-blue-600 mt-1">{task.prompt}</p>
                </div>
                
                {task.result && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-1">Result:</p>
                    <div className="text-sm">
                      <MarkdownRenderer content={task.result} className="prose-sm" />
                    </div>
                  </div>
                )}
                
                {task.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800 mb-1">Error:</p>
                    <p className="text-sm text-red-700">{task.error}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};