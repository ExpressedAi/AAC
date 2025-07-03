import { ChatResponse } from '../types';

const OPENROUTER_API_KEY = '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';

class ChatService {
  async sendMessage(message: string, systemPrompt?: string, apiKey?: string, useMainAgent = false): Promise<ChatResponse> {
    const key = apiKey || OPENROUTER_API_KEY;
    
    // Get main agent config if using main agent
    let model = 'google/gemini-2.5-pro-preview';
    let enhancedSystemPrompt = systemPrompt;
    
    if (useMainAgent) {
      try {
        const mainAgentConfig = localStorage.getItem('main-agent-config');
        if (mainAgentConfig) {
          const config = JSON.parse(mainAgentConfig);
          model = config.model || 'google/gemini-2.5-pro-preview';
          
          // Enhance system prompt with main agent configuration
          enhancedSystemPrompt = config.prompt;
          
          if (config.reasoningEnabled) {
            enhancedSystemPrompt += '\n\nIMPORTANT: Use step-by-step reasoning for complex problems. Show your thinking process clearly.';
          }
          
          if (config.visionEnabled) {
            enhancedSystemPrompt += '\n\nIMPORTANT: You have vision capabilities. When images are provided, analyze them thoroughly and describe what you see.';
          }
          
          if (config.capabilities && config.capabilities.length > 0) {
            enhancedSystemPrompt += `\n\nAvailable capabilities: ${config.capabilities.join(', ')}. Use these when appropriate for the user's request.`;
          }
        }
      } catch (error) {
        console.error('Error loading main agent config:', error);
      }
    }
    
    try {
      const messages = [];
      
      if (enhancedSystemPrompt) {
        messages.push({
          role: 'system',
          content: enhancedSystemPrompt
        });
      }
      
      messages.push({
        role: 'user',
        content: message
      });

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        error: undefined
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendBackgroundTask(agentId: string, prompt: string, apiKey: string): Promise<ChatResponse> {
    return this.sendMessage(prompt, undefined, apiKey);
  }
}

export const chatService = new ChatService();