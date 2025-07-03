import React, { useState, useEffect } from 'react';
import { User, Save, Zap, Eye, Brain, Search, Globe, Code, FileText, BarChart3, Terminal } from 'lucide-react';
import { agentCapabilitiesService } from '../services/agentCapabilities';

interface MainAgentConfig {
  prompt: string;
  model: string;
  capabilities: any[];
}

export const MainAgentConfig: React.FC = () => {
  const [config, setConfig] = useState<MainAgentConfig>({
    prompt: '',
    model: 'gpt-4.1-nano-2025-04-14',
    capabilities: []
  });
  const [availableCapabilities, setAvailableCapabilities] = useState<any[]>([]);

  useEffect(() => {
    loadConfig();
    loadAvailableCapabilities();
  }, []);

  const loadConfig = () => {
    const savedConfig = localStorage.getItem('main-agent-config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  };

  const loadAvailableCapabilities = async () => {
    try {
      const capabilities = await agentCapabilitiesService.getAllAvailableCapabilities();
      setAvailableCapabilities(capabilities);
    } catch (error) {
      console.error('Error loading capabilities:', error);
      setAvailableCapabilities(agentCapabilitiesService.getAvailableCapabilities());
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem('main-agent-config', JSON.stringify(config));
  };

  const handleCapabilityToggle = (capabilityId: string) => {
    const existingCapability = config.capabilities.find(cap => cap.id === capabilityId);
    const availableCapability = availableCapabilities.find(cap => cap.id === capabilityId);
    
    if (existingCapability) {
      setConfig({
        ...config,
        capabilities: config.capabilities.filter(cap => cap.id !== capabilityId)
      });
    } else {
      setConfig({
        ...config,
        capabilities: [...config.capabilities, { ...availableCapability, enabled: true }]
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
        return <Brain size={16} />;
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
            <User size={20} className="mr-2" />
            Main Agent Configuration
          </h2>
          <button
            onClick={handleSaveConfig}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm shadow-md"
          >
            <Save size={16} />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt</label>
            <textarea
              value={config.prompt}
              onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 resize-none shadow-sm"
              placeholder="Enter system prompt for the main agent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <select
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
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
            
            <div className="space-y-4">
              {/* Base Capabilities */}
              {baseCapabilities.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Core Capabilities</h5>
                  <div className="space-y-2">
                    {baseCapabilities.map((capability) => {
                      const isEnabled = config.capabilities.some(cap => cap.id === capability.id);
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
                      const isEnabled = config.capabilities.some(cap => cap.id === capability.id);
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
        </div>
      </div>
    </div>
  );
};