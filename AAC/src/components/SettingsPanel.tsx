import React, { useState, useEffect } from 'react';
import { Settings, Bot, Key, Save, Plus, Trash2, Zap, Globe, Code, FileText, BarChart3, Search, Terminal } from 'lucide-react';
import { Agent } from '../types';
import { agentCapabilitiesService } from '../services/agentCapabilities';

const OPENROUTER_KEYS = [
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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'
];

export const SettingsPanel: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'capabilities'>('basic');
  const [availableCapabilities, setAvailableCapabilities] = useState<any[]>([]);

  useEffect(() => {
    loadAgents();
    loadAvailableCapabilities();
  }, []);

  const loadAvailableCapabilities = async () => {
    try {
      const capabilities = await agentCapabilitiesService.getAllAvailableCapabilities();
      setAvailableCapabilities(capabilities);
    } catch (error) {
      console.error('Error loading capabilities:', error);
      setAvailableCapabilities(agentCapabilitiesService.getAvailableCapabilities());
    }
  };

  const loadAgents = () => {
    const savedAgents = localStorage.getItem('agents');
    if (savedAgents) {
      setAgents(JSON.parse(savedAgents));
    } else {
      const defaultAgents: Agent[] = OPENROUTER_KEYS.map((key, index) => ({
        id: `agent-${index + 1}`,
        name: `Background Agent ${index + 1}`,
        prompt: 'You are a helpful assistant that performs background tasks efficiently.',
        apiKey: key,
        model: 'gpt-4.1-nano-2025-04-14',
        isActive: index < 3,
        capabilities: [],
        specialization: 'general'
      }));
      setAgents(defaultAgents);
      localStorage.setItem('agents', JSON.stringify(defaultAgents));
    }
  };

  const saveAgents = (updatedAgents: Agent[]) => {
    setAgents(updatedAgents);
    localStorage.setItem('agents', JSON.stringify(updatedAgents));
  };

  const handleCreateAgent = () => {
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: '',
      prompt: '',
      apiKey: OPENROUTER_KEYS[0],
      model: 'gpt-4.1-nano-2025-04-14',
      isActive: false,
      capabilities: [],
      specialization: 'general'
    };
    setEditingAgent(newAgent);
    setIsCreating(true);
  };

  const handleSaveAgent = () => {
    if (!editingAgent || !editingAgent.name.trim() || !editingAgent.prompt.trim()) return;

    if (isCreating) {
      const updatedAgents = [...agents, editingAgent];
      saveAgents(updatedAgents);
    } else {
      const updatedAgents = agents.map(agent => 
        agent.id === editingAgent.id ? editingAgent : agent
      );
      saveAgents(updatedAgents);
    }

    setEditingAgent(null);
    setIsCreating(false);
  };

  const handleDeleteAgent = (agentId: string) => {
    const updatedAgents = agents.filter(agent => agent.id !== agentId);
    saveAgents(updatedAgents);
  };

  const handleToggleActive = (agentId: string) => {
    const updatedAgents = agents.map(agent =>
      agent.id === agentId ? { ...agent, isActive: !agent.isActive } : agent
    );
    saveAgents(updatedAgents);
  };

  const handleCapabilityToggle = (capabilityId: string) => {
    if (!editingAgent) return;
    
    const existingCapability = editingAgent.capabilities.find(cap => cap.id === capabilityId);
    const availableCapability = availableCapabilities.find(cap => cap.id === capabilityId);
    
    if (existingCapability) {
      setEditingAgent({
        ...editingAgent,
        capabilities: editingAgent.capabilities.filter(cap => cap.id !== capabilityId)
      });
    } else {
      setEditingAgent({
        ...editingAgent,
        capabilities: [...editingAgent.capabilities, { ...availableCapability, enabled: true }]
      });
    }
  };

  const getCapabilityIcon = (capabilityId: string) => {
    switch (capabilityId) {
      case 'web_search': return <Search size={16} />;
      case 'web_scraping': return <Globe size={16} />;
      case 'html_generation': return <Code size={16} />;
      case 'code_generation': return <Code size={16} />;
      case 'data_analysis': return <BarChart3 size={16} />;
      case 'content_creation': return <FileText size={16} />;
      case 'research': return <Search size={16} />;
      case 'batch_processing': return <Zap size={16} />;
      default:
        if (capabilityId.startsWith('mcp_')) {
          return <Terminal size={16} />;
        }
        return <Bot size={16} />;
    }
  };

  const refreshCapabilities = async () => {
    await loadAvailableCapabilities();
  };

  const groupCapabilities = () => {
    const baseCapabilities = availableCapabilities.filter(cap => !cap.id.startsWith('mcp_'));
    const mcpCapabilities = availableCapabilities.filter(cap => cap.id.startsWith('mcp_'));
    return { baseCapabilities, mcpCapabilities };
  };

  const { baseCapabilities, mcpCapabilities } = groupCapabilities();

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="p-4 border-b border-blue-200 bg-blue-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-blue-800 flex items-center">
            <Settings size={20} className="mr-2" />
            Agent Settings
          </h2>
          <button
            onClick={handleCreateAgent}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm shadow-md"
          >
            <Plus size={16} />
            <span>New Agent</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${agent.isActive ? 'bg-green-400' : 'bg-blue-300'}`} />
                <div>
                  <h3 className="font-medium text-blue-800">{agent.name}</h3>
                  {agent.specialization && agent.specialization !== 'general' && (
                    <p className="text-xs text-blue-500 capitalize">{agent.specialization.replace('_', ' ')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleActive(agent.id)}
                  className={`px-3 py-1 text-xs rounded-full ${
                    agent.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {agent.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => setEditingAgent(agent)}
                  className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                >
                  <Settings size={16} />
                </button>
                <button
                  onClick={() => handleDeleteAgent(agent.id)}
                  className="p-1 text-blue-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-blue-700 mb-2">{agent.prompt}</p>
            
            {agent.capabilities && agent.capabilities.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {agent.capabilities.map((capability) => (
                  <span
                    key={capability.id}
                    className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                  >
                    {getCapabilityIcon(capability.id)}
                    <span>{capability.name}</span>
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex items-center text-xs text-blue-500">
              <Key size={12} className="mr-1" />
              <span>API Key: {agent.apiKey.substring(0, 20)}...</span>
              <span className="ml-2 text-blue-400">• {agent.model}</span>
            </div>
          </div>
        ))}

        {editingAgent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {isCreating ? 'Create New Agent' : 'Edit Agent'}
              </h3>
              
              <div className="flex space-x-1 bg-blue-100 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'basic'
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  <Settings size={16} />
                  <span>Basic Settings</span>
                </button>
                <button
                  onClick={() => setActiveTab('capabilities')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'capabilities'
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  <Zap size={16} />
                  <span>Capabilities</span>
                </button>
              </div>

              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
                    <input
                      type="text"
                      value={editingAgent.name}
                      onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 shadow-sm"
                      placeholder="Enter agent name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                    <select
                      value={editingAgent.specialization}
                      onChange={(e) => setEditingAgent({ ...editingAgent, specialization: e.target.value as any })}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 shadow-sm"
                    >
                      <option value="general">General Assistant</option>
                      <option value="web_search">Web Search Specialist</option>
                      <option value="web_scraping">Web Scraping Expert</option>
                      <option value="content_crawling">Content Crawler</option>
                      <option value="html_generation">HTML Generator</option>
                      <option value="data_analysis">Data Analyst</option>
                      <option value="code_generation">Code Generator</option>
                      <option value="research">Research Assistant</option>
                      <option value="content_creation">Content Creator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt</label>
                    <textarea
                      value={editingAgent.prompt}
                      onChange={(e) => setEditingAgent({ ...editingAgent, prompt: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 resize-none shadow-sm"
                      placeholder="Enter system prompt for this agent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                    <select
                      value={editingAgent.apiKey}
                      onChange={(e) => setEditingAgent({ ...editingAgent, apiKey: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 shadow-sm"
                    >
                      {OPENROUTER_KEYS.map((key, index) => (
                        <option key={key} value={key}>
                          Key {index + 1}: {key.substring(0, 20)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                    <select
                      value={editingAgent.model}
                      onChange={(e) => setEditingAgent({ ...editingAgent, model: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 shadow-sm"
                    >
                      <option value="deepseek/deepseek-prover-v2">DeepSeek Prover V2</option>
                      <option value="deepseek/deepseek-r1-0528">DeepSeek R1</option>
                      <option value="qwen/qwen2.5-vl-32b-instruct">Qwen 2.5 VL 32B</option>
                      <option value="anthropic/claude-opus-4">Claude Opus 4</option>
                      <option value="anthropic/claude-sonnet-4">Claude Sonnet 4</option>
                      <option value="openai/o3-mini-high">OpenAI O3 Mini High</option>
                      <option value="openai/gpt-4.1">GPT-4.1</option>
                      <option value="openai/gpt-4.1-nano">GPT-4.1 Nano</option>
                      <option value="openai/gpt-4o-mini-search-preview">GPT-4o Mini Search</option>
                      <option value="openai/gpt-4o-search-preview">GPT-4o Search</option>
                      <option value="openai/gpt-4.5-preview">GPT-4.5 Preview</option>
                      <option value="google/gemini-2.5-pro-preview">Gemini 2.5 Pro</option>
                      <option value="google/gemini-2.5-flash-preview-05-20:thinking">Gemini 2.5 Flash Thinking</option>
                      <option value="x-ai/grok-3-mini-beta">Grok 3 Mini Beta</option>
                      <option value="x-ai/grok-3-beta">Grok 3 Beta</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editingAgent.isActive}
                      onChange={(e) => setEditingAgent({ ...editingAgent, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-500 border-blue-300 rounded focus:ring-blue-400"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-blue-700">
                      Active Agent
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'capabilities' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Available Capabilities</h4>
                    <button
                      onClick={refreshCapabilities}
                      className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      Refresh MCP Tools
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {/* Base Capabilities */}
                    {baseCapabilities.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Core Capabilities</h5>
                        <div className="space-y-2">
                          {baseCapabilities.map((capability) => {
                            const isEnabled = (editingAgent.capabilities || []).some(cap => cap.id === capability.id);
                            return (
                              <div key={capability.id} className="flex items-start space-x-3 p-3 border border-blue-200 rounded-lg">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={() => handleCapabilityToggle(capability.id)}
                                  className="w-4 h-4 text-blue-500 border-blue-300 rounded focus:ring-blue-400 mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    {getCapabilityIcon(capability.id)}
                                    <h5 className="font-medium text-blue-800">{capability.name}</h5>
                                  </div>
                                  <p className="text-sm text-blue-600">{capability.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* MCP Tools */}
                    {mcpCapabilities.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide flex items-center">
                          <Terminal size={12} className="mr-1" />
                          MCP Tools ({mcpCapabilities.length})
                        </h5>
                        <div className="space-y-2">
                          {mcpCapabilities.map((capability) => {
                            const isEnabled = (editingAgent.capabilities || []).some(cap => cap.id === capability.id);
                            return (
                              <div key={capability.id} className="flex items-start space-x-3 p-3 border border-green-200 bg-green-50 rounded-lg">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={() => handleCapabilityToggle(capability.id)}
                                  className="w-4 h-4 text-green-500 border-green-300 rounded focus:ring-green-400 mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Terminal size={16} className="text-green-600" />
                                    <h5 className="font-medium text-green-800">{capability.name}</h5>
                                  </div>
                                  <p className="text-sm text-green-700">{capability.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {mcpCapabilities.length === 0 && (
                      <div className="text-center py-4">
                        <Terminal size={32} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">No MCP tools available</p>
                        <p className="text-xs text-gray-400 mt-1">Start MCP servers to see available tools</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setEditingAgent(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAgent}
                  disabled={!editingAgent.name.trim() || !editingAgent.prompt.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  <Save size={16} />
                  <span>Save Agent</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};