import { MCPServer, MCPToolCall } from '../types';

export class MCPService {
  private static instance: MCPService;

  static getInstance(): MCPService {
    if (!MCPService.instance) {
      MCPService.instance = new MCPService();
    }
    return MCPService.instance;
  }

  async getAvailableTools(enabledServerIds: string[] = []): Promise<any[]> {
    try {
      // Get MCP servers from localStorage
      const savedServers = localStorage.getItem('mcp-servers');
      if (!savedServers) return [];

      const servers: MCPServer[] = JSON.parse(savedServers);
      const runningServers = servers.filter(s => 
        s.status === 'running' && 
        (enabledServerIds.length === 0 || enabledServerIds.includes(s.id))
      );

      const allTools = [];

      for (const server of runningServers) {
        try {
          // In a real PNPM environment, this would connect to the MCP server
          // For now, we'll simulate some common MCP tools
          const tools = await this.getServerTools(server);
          allTools.push(...tools.map(tool => ({
            ...tool,
            serverId: server.id,
            serverName: server.name
          })));
        } catch (error) {
          console.error(`Failed to get tools from server ${server.name}:`, error);
        }
      }

      return allTools;
    } catch (error) {
      console.error('Error getting available MCP tools:', error);
      return [];
    }
  }

  private async getServerTools(server: MCPServer): Promise<any[]> {
    // This is a simulation - in a real environment, this would use the MCP protocol
    // to list tools from the actual server
    
    // Simulate different tool sets based on server command/name
    if (server.command.includes('filesystem') || server.name.includes('filesystem')) {
      return [
        {
          name: 'read_file',
          description: 'Read the contents of a file',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to the file to read' }
            },
            required: ['path']
          }
        },
        {
          name: 'write_file',
          description: 'Write content to a file',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to the file to write' },
              content: { type: 'string', description: 'Content to write to the file' }
            },
            required: ['path', 'content']
          }
        },
        {
          name: 'list_directory',
          description: 'List contents of a directory',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to the directory to list' }
            },
            required: ['path']
          }
        }
      ];
    }

    if (server.command.includes('brave') || server.name.includes('search')) {
      return [
        {
          name: 'brave_search',
          description: 'Search the web using Brave Search',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              count: { type: 'number', description: 'Number of results to return', default: 10 }
            },
            required: ['query']
          }
        }
      ];
    }

    if (server.command.includes('github') || server.name.includes('github')) {
      return [
        {
          name: 'search_repositories',
          description: 'Search GitHub repositories',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              language: { type: 'string', description: 'Programming language filter' }
            },
            required: ['query']
          }
        },
        {
          name: 'get_repository_info',
          description: 'Get information about a GitHub repository',
          parameters: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner' },
              repo: { type: 'string', description: 'Repository name' }
            },
            required: ['owner', 'repo']
          }
        }
      ];
    }

    // Default tools for unknown servers
    return [
      {
        name: 'generic_tool',
        description: 'A generic tool provided by this MCP server',
        parameters: {
          type: 'object',
          properties: {
            input: { type: 'string', description: 'Input for the tool' }
          },
          required: ['input']
        }
      }
    ];
  }

  async callTool(serverId: string, toolName: string, args: any): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      // Get server info
      const savedServers = localStorage.getItem('mcp-servers');
      if (!savedServers) {
        return { success: false, error: 'No MCP servers configured' };
      }

      const servers: MCPServer[] = JSON.parse(savedServers);
      const server = servers.find(s => s.id === serverId);

      if (!server) {
        return { success: false, error: `Server ${serverId} not found` };
      }

      if (server.status !== 'running') {
        return { success: false, error: `Server ${server.name} is not running` };
      }

      // In a real PNPM environment, this would make an actual MCP call
      // For now, we'll simulate the tool execution
      const result = await this.simulateToolCall(server, toolName, args);
      
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown MCP tool error'
      };
    }
  }

  private async simulateToolCall(server: MCPServer, toolName: string, args: any): Promise<any> {
    // This simulates tool execution - in a real environment, this would use the MCP protocol
    
    switch (toolName) {
      case 'read_file':
        return {
          content: `Simulated file content from ${args.path}`,
          path: args.path,
          size: 1024
        };

      case 'write_file':
        return {
          success: true,
          path: args.path,
          bytesWritten: args.content.length
        };

      case 'list_directory':
        return {
          path: args.path,
          files: [
            { name: 'file1.txt', type: 'file', size: 1024 },
            { name: 'file2.js', type: 'file', size: 2048 },
            { name: 'subdirectory', type: 'directory' }
          ]
        };

      case 'brave_search':
        return {
          query: args.query,
          results: [
            {
              title: `Search result for "${args.query}"`,
              url: 'https://example.com/result1',
              snippet: 'This is a simulated search result snippet...'
            },
            {
              title: `Another result for "${args.query}"`,
              url: 'https://example.com/result2',
              snippet: 'This is another simulated search result...'
            }
          ]
        };

      case 'search_repositories':
        return {
          query: args.query,
          repositories: [
            {
              name: 'example-repo',
              owner: 'example-user',
              description: `Repository related to ${args.query}`,
              stars: 1234,
              language: args.language || 'JavaScript'
            }
          ]
        };

      case 'get_repository_info':
        return {
          name: args.repo,
          owner: args.owner,
          description: 'A simulated repository',
          stars: 5678,
          forks: 123,
          language: 'TypeScript',
          created_at: '2023-01-01T00:00:00Z'
        };

      default:
        return {
          toolName,
          args,
          result: 'Simulated tool execution completed',
          timestamp: new Date().toISOString()
        };
    }
  }

  async getServerStatus(serverId: string): Promise<MCPServer['status']> {
    try {
      const savedServers = localStorage.getItem('mcp-servers');
      if (!savedServers) return 'stopped';

      const servers: MCPServer[] = JSON.parse(savedServers);
      const server = servers.find(s => s.id === serverId);
      
      return server?.status || 'stopped';
    } catch (error) {
      console.error('Error getting server status:', error);
      return 'error';
    }
  }

  async listServers(): Promise<MCPServer[]> {
    try {
      const savedServers = localStorage.getItem('mcp-servers');
      return savedServers ? JSON.parse(savedServers) : [];
    } catch (error) {
      console.error('Error listing MCP servers:', error);
      return [];
    }
  }
}

export const mcpService = MCPService.getInstance();