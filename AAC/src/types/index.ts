export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  rating?: number;
  embedding?: number[];
  memoryType?: 'semantic' | 'procedural' | 'episodic';
}

export interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  prompt: string;
  apiKey: string;
  model: string;
  isActive: boolean;
  capabilities: AgentCapability[];
  specialization?: AgentSpecialization;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  config?: any;
}

export type AgentSpecialization = 
  | 'web_search'
  | 'web_scraping' 
  | 'content_crawling'
  | 'html_generation'
  | 'data_analysis'
  | 'code_generation'
  | 'research'
  | 'content_creation'
  | 'general';

export interface WebSearchConfig {
  searchDepth: 'basic' | 'advanced';
  maxResults: number;
  includeImages: boolean;
  includeAnswer: boolean;
}

export interface WebScrapingConfig {
  contentFormats: string[];
  onlyMainContent: boolean;
  timeout: number;
  includeTags: string[];
  excludeTags: string[];
}

export interface MemoryEntry {
  id: string;
  content: string;
  type: 'semantic' | 'procedural' | 'episodic';
  embedding: number[];
  timestamp: Date;
  source: string;
  similarity?: number;
}

export interface ChatResponse {
  content: string;
  error?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  error?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface BackgroundTask {
  id: string;
  agentId: string;
  prompt: string;
  capability?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: string;
  error?: string;
  timestamp: Date;
}

export interface MCPServer {
  id: string;
  name: string;
  command: string;
  args?: string[];
  env?: { [key: string]: string };
  cwd?: string;
  status: 'stopped' | 'running' | 'error';
  pid?: number;
  port?: number;
  config: any;
}

export interface MCPConfig {
  mcpServers?: {
    [key: string]: {
      command: string;
      args?: string[];
      env?: { [key: string]: string };
      cwd?: string;
    };
  };
}

export interface MCPToolCall {
  id: string;
  serverId: string;
  toolName: string;
  arguments: any;
  result?: any;
  error?: string;
}