import { Agent, AgentCapability, WebSearchConfig, WebScrapingConfig } from '../types';
import { searchService } from './search';
import { chatService } from './chat';
import { mcpService } from './mcp';

export class AgentCapabilitiesService {
  private static instance: AgentCapabilitiesService;

  static getInstance(): AgentCapabilitiesService {
    if (!AgentCapabilitiesService.instance) {
      AgentCapabilitiesService.instance = new AgentCapabilitiesService();
    }
    return AgentCapabilitiesService.instance;
  }

  getAvailableCapabilities(): AgentCapability[] {
    return [
      {
        id: 'web_search',
        name: 'Web Search',
        description: 'Search the web using Tavily API with configurable depth and results',
        enabled: false,
        config: {
          searchDepth: 'advanced',
          maxResults: 10,
          includeImages: false,
          includeAnswer: true
        }
      },
      {
        id: 'web_scraping',
        name: 'Web Scraping',
        description: 'Scrape and extract content from websites using Firecrawl',
        enabled: false,
        config: {
          contentFormats: ['markdown'],
          onlyMainContent: true,
          timeout: 30000,
          includeTags: ['article', 'main', 'content'],
          excludeTags: ['nav', 'footer', 'sidebar']
        }
      },
      {
        id: 'html_generation',
        name: 'HTML Generation',
        description: 'Generate clean, semantic HTML code for web pages',
        enabled: false,
        config: {
          includeCSS: true,
          responsive: true,
          accessibility: true
        }
      },
      {
        id: 'code_generation',
        name: 'Code Generation',
        description: 'Generate code in various programming languages',
        enabled: false,
        config: {
          languages: ['javascript', 'python', 'html', 'css', 'react'],
          includeComments: true,
          codeStyle: 'clean'
        }
      },
      {
        id: 'data_analysis',
        name: 'Data Analysis',
        description: 'Analyze data, create reports, and generate insights',
        enabled: false,
        config: {
          outputFormat: 'markdown',
          includeCharts: false,
          statisticalAnalysis: true
        }
      },
      {
        id: 'content_creation',
        name: 'Content Creation',
        description: 'Create articles, blogs, documentation, and marketing content',
        enabled: false,
        config: {
          tone: 'professional',
          length: 'medium',
          includeOutline: true
        }
      },
      {
        id: 'research',
        name: 'Research Assistant',
        description: 'Conduct comprehensive research on topics with citations',
        enabled: false,
        config: {
          includeCitations: true,
          researchDepth: 'comprehensive',
          factCheck: true
        }
      },
      {
        id: 'batch_processing',
        name: 'Batch Processing',
        description: 'Process multiple items or URLs in parallel',
        enabled: false,
        config: {
          maxConcurrent: 5,
          retryAttempts: 3,
          timeout: 60000
        }
      }
    ];
  }

  async getAllAvailableCapabilities(): Promise<AgentCapability[]> {
    const baseCapabilities = this.getAvailableCapabilities();
    
    try {
      // Get MCP tools and convert them to capabilities
      const mcpTools = await mcpService.getAvailableTools();
      const mcpCapabilities: AgentCapability[] = mcpTools.map(tool => ({
        id: `mcp_${tool.serverId}_${tool.name}`,
        name: `${tool.name} (${tool.serverName})`,
        description: tool.description,
        enabled: false,
        config: {
          serverId: tool.serverId,
          toolName: tool.name,
          parameters: tool.parameters
        }
      }));

      return [...baseCapabilities, ...mcpCapabilities];
    } catch (error) {
      console.error('Error loading MCP capabilities:', error);
      return baseCapabilities;
    }
  }

  async executeCapability(
    agent: Agent, 
    capabilityId: string, 
    input: any, 
    additionalPrompt?: string
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    const capability = agent.capabilities.find(cap => cap.id === capabilityId && cap.enabled);
    
    if (!capability) {
      return { success: false, error: `Capability ${capabilityId} not found or not enabled` };
    }

    try {
      // Handle MCP capabilities
      if (capabilityId.startsWith('mcp_')) {
        return await this.executeMCPCapability(agent, capability, input, additionalPrompt);
      }

      // Handle base capabilities
      switch (capabilityId) {
        case 'web_search':
          return await this.executeWebSearch(agent, input, capability.config, additionalPrompt);
        
        case 'web_scraping':
          return await this.executeWebScraping(agent, input, capability.config, additionalPrompt);
        
        case 'html_generation':
          return await this.executeHtmlGeneration(agent, input, capability.config, additionalPrompt);
        
        case 'code_generation':
          return await this.executeCodeGeneration(agent, input, capability.config, additionalPrompt);
        
        case 'data_analysis':
          return await this.executeDataAnalysis(agent, input, capability.config, additionalPrompt);
        
        case 'content_creation':
          return await this.executeContentCreation(agent, input, capability.config, additionalPrompt);
        
        case 'research':
          return await this.executeResearch(agent, input, capability.config, additionalPrompt);
        
        case 'batch_processing':
          return await this.executeBatchProcessing(agent, input, capability.config, additionalPrompt);
        
        default:
          return { success: false, error: `Unknown capability: ${capabilityId}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async executeMCPCapability(
    agent: Agent,
    capability: AgentCapability,
    input: any,
    additionalPrompt?: string
  ) {
    try {
      const { serverId, toolName } = capability.config;
      
      // Call the MCP tool directly
      const result = await mcpService.callTool(serverId, toolName, input);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      // If additional prompt is provided, process the result with the agent
      if (additionalPrompt) {
        const prompt = `${agent.prompt}

${additionalPrompt}

MCP Tool Result from ${toolName}:
${JSON.stringify(result.result, null, 2)}

Please analyze this result and provide a helpful response.`;

        const response = await chatService.sendMessage(prompt, agent.prompt, agent.apiKey);
        
        return {
          success: !response.error,
          result: {
            mcpResult: result.result,
            analysis: response.content,
            toolName
          },
          error: response.error
        };
      }

      return {
        success: true,
        result: result.result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown MCP error'
      };
    }
  }

  private async executeWebSearch(
    agent: Agent, 
    query: string, 
    config: WebSearchConfig,
    additionalPrompt?: string
  ) {
    const searchResults = await searchService.searchWeb(query, config);
    
    const prompt = `${agent.prompt}

${additionalPrompt || ''}

You have been asked to search for: "${query}"

Here are the search results:
${searchResults.map((result, index) => `
${index + 1}. ${result.title}
URL: ${result.url}
Content: ${result.content}
${result.score ? `Relevance Score: ${result.score}` : ''}
`).join('\n')}

Please analyze these results and provide a comprehensive summary with key insights.`;

    const response = await chatService.sendMessage(prompt, agent.prompt, agent.apiKey);
    
    return {
      success: !response.error,
      result: {
        searchResults,
        analysis: response.content,
        query
      },
      error: response.error
    };
  }

  private async executeWebScraping(
    agent: Agent, 
    urls: string | string[], 
    config: any,
    additionalPrompt?: string
  ) {
    const urlList = Array.isArray(urls) ? urls : [urls];
    const scrapedContent = await searchService.batchCrawl(urlList, config);
    
    const prompt = `${agent.prompt}

${additionalPrompt || ''}

You have been asked to scrape and analyze the following URLs:
${urlList.join(', ')}

Here is the scraped content:
${scrapedContent.map((item, index) => `
URL ${index + 1}: ${item.url}
Content:
${item.content}
---
`).join('\n')}

Please analyze this content and extract key information, insights, or perform the requested task.`;

    const response = await chatService.sendMessage(prompt, agent.prompt, agent.apiKey);
    
    return {
      success: !response.error,
      result: {
        scrapedContent,
        analysis: response.content,
        urls: urlList
      },
      error: response.error
    };
  }

  private async executeHtmlGeneration(
    agent: Agent, 
    requirements: string, 
    config: any,
    additionalPrompt?: string
  ) {
    const prompt = `${agent.prompt}

${additionalPrompt || ''}

You are an expert HTML/CSS developer. Generate clean, semantic HTML code based on these requirements:

Requirements: ${requirements}

Configuration:
- Include CSS: ${config.includeCSS}
- Responsive Design: ${config.responsive}
- Accessibility Features: ${config.accessibility}

Please provide:
1. Complete HTML structure
2. Embedded CSS styles (if requested)
3. Brief explanation of the implementation
4. Any accessibility features included

Make sure the code is production-ready and follows best practices.`;

    const response = await chatService.sendMessage(prompt, agent.prompt, agent.apiKey);
    
    return {
      success: !response.error,
      result: {
        htmlCode: response.content,
        requirements,
        config
      },
      error: response.error
    };
  }

  private async executeCodeGeneration(
    agent: Agent, 
    requirements: string, 
    config: any,
    additionalPrompt?: string
  ) {
    const prompt = `${agent.prompt}

${additionalPrompt || ''}

You are an expert software developer. Generate clean, efficient code based on these requirements:

Requirements: ${requirements}

Configuration:
- Languages: ${config.languages.join(', ')}
- Include Comments: ${config.includeComments}
- Code Style: ${config.codeStyle}

Please provide:
1. Complete, working code
2. Clear comments explaining the logic
3. Usage examples if applicable
4. Any dependencies or setup instructions

Make sure the code follows best practices and is production-ready.`;

    const response = await chatService.sendMessage(prompt, agent.prompt, agent.apiKey);
    
    return {
      success: !response.error,
      result: {
        code: response.content,
        requirements,
        config
      },
      error: response.error
    };
  }

  private async executeDataAnalysis(
    agent: Agent, 
    data: string, 
    config: any,
    additionalPrompt?: string
  ) {
    const prompt = `${agent.prompt}

${additionalPrompt || ''}

You are a data analysis expert. Analyze the following data and provide insights:

Data: ${data}

Configuration:
- Output Format: ${config.outputFormat}
- Include Charts: ${config.includeCharts}
- Statistical Analysis: ${config.statisticalAnalysis}

Please provide:
1. Data summary and overview
2. Key insights and patterns
3. Statistical analysis (if requested)
4. Recommendations based on findings
5. Visual representations (if charts requested)

Present your analysis in a clear, professional format.`;

    const response = await chatService.sendMessage(prompt, agent.prompt, agent.apiKey);
    
    return {
      success: !response.error,
      result: {
        analysis: response.content,
        data,
        config
      },
      error: response.error
    };
  }

  private async executeContentCreation(
    agent: Agent, 
    topic: string, 
    config: any,
    additionalPrompt?: string
  ) {
    const prompt = `${agent.prompt}

${additionalPrompt || ''}

You are a professional content creator. Create high-quality content on the following topic:

Topic: ${topic}

Configuration:
- Tone: ${config.tone}
- Length: ${config.length}
- Include Outline: ${config.includeOutline}

Please provide:
1. Content outline (if requested)
2. Complete, well-structured content
3. Engaging introduction and conclusion
4. Proper formatting and structure
5. SEO-friendly elements if applicable

Make sure the content is original, engaging, and valuable to readers.`;

    const response = await chatService.sendMessage(prompt, agent.prompt, agent.apiKey);
    
    return {
      success: !response.error,
      result: {
        content: response.content,
        topic,
        config
      },
      error: response.error
    };
  }

  private async executeResearch(
    agent: Agent, 
    topic: string, 
    config: any,
    additionalPrompt?: string
  ) {
    // First, search for information
    const searchResults = await searchService.searchWeb(topic, {
      searchDepth: config.researchDepth,
      maxResults: 15,
      includeAnswer: true
    });

    const prompt = `${agent.prompt}

${additionalPrompt || ''}

You are a research expert. Conduct comprehensive research on the following topic:

Topic: ${topic}

Search Results:
${searchResults.map((result, index) => `
${index + 1}. ${result.title}
URL: ${result.url}
Content: ${result.content}
`).join('\n')}

Configuration:
- Include Citations: ${config.includeCitations}
- Research Depth: ${config.researchDepth}
- Fact Check: ${config.factCheck}

Please provide:
1. Executive summary
2. Detailed research findings
3. Multiple perspectives on the topic
4. Citations and sources (if requested)
5. Fact-checked information
6. Conclusions and recommendations

Present your research in a professional, academic format.`;

    const response = await chatService.sendMessage(prompt, agent.prompt, agent.apiKey);
    
    return {
      success: !response.error,
      result: {
        research: response.content,
        sources: searchResults,
        topic,
        config
      },
      error: response.error
    };
  }

  private async executeBatchProcessing(
    agent: Agent, 
    items: any[], 
    config: any,
    additionalPrompt?: string
  ) {
    const prompt = `${agent.prompt}

${additionalPrompt || ''}

You are processing multiple items in batch. Here are the items to process:

${items.map((item, index) => `
Item ${index + 1}: ${typeof item === 'string' ? item : JSON.stringify(item)}
`).join('\n')}

Configuration:
- Max Concurrent: ${config.maxConcurrent}
- Retry Attempts: ${config.retryAttempts}
- Timeout: ${config.timeout}ms

Please process each item according to the instructions and provide results for each.`;

    const response = await chatService.sendMessage(prompt, agent.prompt, agent.apiKey);
    
    return {
      success: !response.error,
      result: {
        processedItems: response.content,
        originalItems: items,
        config
      },
      error: response.error
    };
  }
}

export const agentCapabilitiesService = AgentCapabilitiesService.getInstance();