import React, { useState, useEffect } from 'react';
import { Plus, Play, Store as Stop, Settings, Trash2, Download, FileText, Terminal, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { MCPServer, MCPConfig } from '../types';

export const MCPServerManager: React.FC = () => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [logs, setLogs] = useState<{ [serverId: string]: string[] }>({});
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [configText, setConfigText] = useState('');

  // Load saved servers from localStorage on mount
  useEffect(() => {
    const savedServers = localStorage.getItem('mcp-servers');
    if (savedServers) {
      try {
        setServers(JSON.parse(savedServers));
      } catch (error) {
        console.error('Failed to load saved servers:', error);
      }
    }
  }, []);

  // Save servers to localStorage whenever servers change
  useEffect(() => {
    localStorage.setItem('mcp-servers', JSON.stringify(servers));
  }, [servers]);

  const handleAddConfig = async () => {
    if (!configText.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      const config: MCPConfig = JSON.parse(configText);
      
      if (config.mcpServers) {
        const newServers: MCPServer[] = Object.entries(config.mcpServers).map(
          ([name, serverConfig]) => ({
            id: `${name}-${Date.now()}`,
            name,
            command: serverConfig.command,
            args: serverConfig.args || [],
            env: serverConfig.env || {},
            cwd: serverConfig.cwd || '/home/project',
            status: 'stopped' as const,
            config: serverConfig,
          })
        );
        
        setServers(prev => [...prev, ...newServers]);
        setConfigText('');
        
        // Show success message
        alert(`Successfully added ${newServers.length} MCP server(s)`);
      } else {
        alert('Invalid MCP configuration. Expected mcpServers property.');
      }
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      alert('Failed to parse JSON. Please check the format.');
    } finally {
      setIsLoading(false);
    }
  };

  const startServer = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    try {
      // Note: This will only work when running as PNPM application
      // In WebContainer, this will fail gracefully
      const response = await fetch('/api/mcp/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: serverId,
          command: server.command,
          args: server.args,
          env: server.env,
          cwd: server.cwd,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setServers(prev => prev.map(s => 
          s.id === serverId 
            ? { ...s, status: 'running', pid: result.pid, port: result.port }
            : s
        ));
        addLog(serverId, `Server started successfully (PID: ${result.pid})`);
      } else {
        throw new Error('Failed to start server - MCP API not available in WebContainer');
      }
    } catch (error) {
      console.error('Failed to start server:', error);
      setServers(prev => prev.map(s => 
        s.id === serverId ? { ...s, status: 'error' } : s
      ));
      addLog(serverId, `Error: MCP servers only work when running as PNPM application outside WebContainer`);
    }
  };

  const stopServer = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server || !server.pid) return;

    try {
      const response = await fetch('/api/mcp/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: serverId, pid: server.pid }),
      });

      if (response.ok) {
        setServers(prev => prev.map(s => 
          s.id === serverId 
            ? { ...s, status: 'stopped', pid: undefined, port: undefined }
            : s
        ));
        addLog(serverId, 'Server stopped successfully');
      } else {
        throw new Error('Failed to stop server');
      }
    } catch (error) {
      console.error('Failed to stop server:', error);
      addLog(serverId, `Error stopping server: ${error}`);
    }
  };

  const removeServer = (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (server && server.status === 'running') {
      stopServer(serverId);
    }
    setServers(prev => prev.filter(s => s.id !== serverId));
    setLogs(prev => {
      const newLogs = { ...prev };
      delete newLogs[serverId];
      return newLogs;
    });
  };

  const addLog = (serverId: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => ({
      ...prev,
      [serverId]: [...(prev[serverId] || []), `[${timestamp}] ${message}`]
    }));
  };

  const exportConfig = () => {
    const config: MCPConfig = {
      mcpServers: servers.reduce((acc, server) => {
        acc[server.name] = {
          command: server.command,
          args: server.args,
          env: server.env,
          cwd: server.cwd,
        };
        return acc;
      }, {} as { [key: string]: any })
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mcp-servers-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: MCPServer['status']) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: MCPServer['status']) => {
    switch (status) {
      case 'running':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="p-4 border-b border-blue-200 bg-blue-50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
              <Terminal className="mr-2" size={20} />
              MCP Server Manager
            </h2>
            <p className="text-sm text-blue-600">
              Configure MCP servers for tool calling (requires PNPM runtime)
            </p>
          </div>
          <button
            onClick={exportConfig}
            className="px-4 py-2 bg-cyan-400 text-white rounded-lg hover:bg-cyan-500 flex items-center gap-2 text-sm shadow-md"
            disabled={servers.length === 0}
          >
            <Download className="w-4 h-4" />
            Export Config
          </button>
        </div>

        {/* Add Configuration Section */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-sm">
          <div className="p-4 border-b border-blue-200 bg-blue-25">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Add MCP Configuration</h3>
            <p className="text-xs text-blue-600">
              Paste your MCP server configuration JSON below
            </p>
          </div>
          
          <div className="p-4">
            <div className="relative">
              <textarea
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                placeholder={`{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"],
      "env": {},
      "working_directory": null,
      "start_on_launch": true
    }
  }
}`}
                className="w-full h-48 px-4 py-3 bg-gray-900 text-green-400 font-mono text-sm rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 resize-none overflow-hidden"
                style={{
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  lineHeight: '1.5'
                }}
              />
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={handleAddConfig}
                disabled={!configText.trim() || isLoading}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm shadow-md"
              >
                <Plus size={16} />
                <span>{isLoading ? 'Adding...' : 'Add'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Server List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {servers.length === 0 ? (
          <div className="text-center text-blue-500 mt-8">
            <Terminal size={48} className="mx-auto mb-4 text-blue-300" />
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              No MCP Servers Configured
            </h3>
            <p className="text-blue-600 text-sm">
              Paste a Claude Desktop MCP configuration above to get started.
            </p>
            <p className="text-xs text-blue-500 mt-2">
              MCP servers will be functional when running as PNPM application
            </p>
          </div>
        ) : (
          servers.map((server) => (
            <div
              key={server.id}
              className={`bg-white rounded-lg shadow-md border-2 ${getStatusColor(server.status)} p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(server.status)}
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <h3 className="font-medium text-blue-800">
                      {server.name}
                    </h3>
                    {server.port && (
                      <p className="text-sm text-green-600">
                        Running on port: {server.port}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {server.status === 'running' ? (
                    <button
                      onClick={() => stopServer(server.id)}
                      className="px-2 py-1 bg-red-400 text-white rounded-md hover:bg-red-500 flex items-center gap-1 text-xs shadow-md"
                    >
                      <Stop className="w-3 h-3" />
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => startServer(server.id)}
                      className="px-2 py-1 bg-green-400 text-white rounded-md hover:bg-green-500 flex items-center gap-1 text-xs shadow-md"
                    >
                      <Play className="w-3 h-3" />
                      Start
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedServer(
                      selectedServer === server.id ? null : server.id
                    )}
                    className="px-2 py-1 bg-blue-400 text-white rounded-md hover:bg-blue-500 flex items-center gap-1 text-xs shadow-md"
                  >
                    <FileText className="w-3 h-3" />
                    Logs
                  </button>
                  <button
                    onClick={() => removeServer(server.id)}
                    className="px-2 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 flex items-center gap-1 text-xs shadow-md"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              </div>

              {/* Server Details */}
              <div className="bg-blue-50 rounded-lg p-3 mb-3 space-y-2 overflow-hidden">
                <div>
                  <span className="font-medium text-blue-700">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    server.status === 'running' ? 'bg-green-100 text-green-800' :
                    server.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {server.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm overflow-hidden">
                  <span className="font-medium text-blue-700">Command:</span>
                  <div className="ml-2 text-blue-600 font-mono text-xs break-all bg-white rounded px-2 py-1 mt-1">
                    {server.command} {server.args?.join(' ')}
                  </div>
                </div>
                {server.pid && (
                  <div className="text-sm">
                    <span className="font-medium text-blue-700">PID:</span>
                    <span className="ml-2 text-blue-600">{server.pid}</span>
                  </div>
                )}
                <div className="text-sm overflow-hidden">
                  <span className="font-medium text-blue-700">Working Dir:</span>
                  <div className="ml-2 text-blue-600 font-mono text-xs break-all bg-white rounded px-2 py-1 mt-1">
                    {server.cwd}
                  </div>
                </div>
              </div>

              {/* Environment Variables */}
              {server.env && Object.keys(server.env).length > 0 && (
                <div className="mb-3">
                  <h4 className="font-medium text-blue-800 mb-2 text-sm">Environment Variables:</h4>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 overflow-hidden">
                    {Object.entries(server.env).map(([key, value]) => (
                      <div key={key} className="text-sm mb-2 last:mb-0 overflow-hidden">
                        <span className="font-mono font-medium text-blue-700">{key}:</span>
                        <div className="ml-2 text-blue-600 font-mono text-xs break-all bg-white rounded px-2 py-1 mt-1">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logs */}
              {selectedServer === server.id && (
                <div className="mt-3">
                  <h4 className="font-medium text-blue-800 mb-2 text-sm">Logs:</h4>
                  <div className="bg-gray-900 text-green-400 rounded-lg p-3 font-mono text-xs max-h-48 overflow-y-auto border border-blue-200">
                    {logs[server.id]?.length > 0 ? (
                      logs[server.id].map((log, index) => (
                        <div key={index} className="mb-1 break-all">{log}</div>
                      ))
                    ) : (
                      <div className="text-gray-500">No logs available</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};