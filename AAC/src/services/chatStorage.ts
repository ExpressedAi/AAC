import { Message, ChatThread } from '../types';

class ChatStorageService {
  private static instance: ChatStorageService;

  static getInstance(): ChatStorageService {
    if (!ChatStorageService.instance) {
      ChatStorageService.instance = new ChatStorageService();
    }
    return ChatStorageService.instance;
  }

  // Save current chat thread
  saveCurrentThread(messages: Message[], threadId?: string): string {
    const id = threadId || `thread-${Date.now()}`;
    const thread: ChatThread = {
      id,
      title: this.generateThreadTitle(messages),
      messages,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to localStorage
    localStorage.setItem(`chat-thread-${id}`, JSON.stringify(thread));
    
    // Update thread list
    this.updateThreadList(thread);
    
    return id;
  }

  // Load a specific thread
  loadThread(threadId: string): ChatThread | null {
    try {
      const threadData = localStorage.getItem(`chat-thread-${threadId}`);
      if (!threadData) return null;
      
      const thread = JSON.parse(threadData);
      return {
        ...thread,
        createdAt: new Date(thread.createdAt),
        updatedAt: new Date(thread.updatedAt),
        messages: thread.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      };
    } catch (error) {
      console.error('Error loading thread:', error);
      return null;
    }
  }

  // Get all chat threads
  getAllThreads(): ChatThread[] {
    try {
      const threadsData = localStorage.getItem('chat-threads-list');
      if (!threadsData) return [];
      
      const threadsList = JSON.parse(threadsData);
      return threadsList
        .map((thread: any) => ({
          ...thread,
          createdAt: new Date(thread.createdAt),
          updatedAt: new Date(thread.updatedAt),
          messages: thread.messages ? thread.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })) : []
        }))
        .sort((a: ChatThread, b: ChatThread) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error loading threads list:', error);
      return [];
    }
  }

  // Delete a thread
  deleteThread(threadId: string): void {
    localStorage.removeItem(`chat-thread-${threadId}`);
    
    // Update thread list
    const threads = this.getAllThreads().filter(t => t.id !== threadId);
    localStorage.setItem('chat-threads-list', JSON.stringify(threads));
  }

  // Generate conversation context for background agents
  generateContextSummary(messages: Message[], maxTokens = 2000): string {
    if (messages.length === 0) return '';

    // Get recent messages (last 10 exchanges)
    const recentMessages = messages.slice(-20);
    
    let context = "CONVERSATION CONTEXT:\n";
    context += "===================\n\n";
    
    // Add conversation summary
    const userMessages = recentMessages.filter(m => m.role === 'user');
    const assistantMessages = recentMessages.filter(m => m.role === 'assistant');
    
    context += `Recent conversation with ${userMessages.length} user messages and ${assistantMessages.length} assistant responses.\n\n`;
    
    // Add key topics discussed
    const topics = this.extractTopics(recentMessages);
    if (topics.length > 0) {
      context += "Key topics discussed:\n";
      topics.forEach(topic => context += `- ${topic}\n`);
      context += "\n";
    }
    
    // Add recent message history
    context += "Recent message history:\n";
    context += "----------------------\n";
    
    recentMessages.forEach((msg, index) => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      const preview = msg.content.length > 150 ? 
        msg.content.substring(0, 150) + '...' : 
        msg.content;
      context += `${role}: ${preview}\n\n`;
    });
    
    // Truncate if too long
    if (context.length > maxTokens * 4) { // Rough token estimation
      context = context.substring(0, maxTokens * 4) + "\n\n[Context truncated...]";
    }
    
    return context;
  }

  // Get full conversation history for main agent (no limits)
  getFullConversationHistory(messages: Message[]): string {
    if (messages.length === 0) return '';

    let history = "FULL CONVERSATION HISTORY:\n";
    history += "==========================\n\n";
    
    messages.forEach((msg, index) => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      const timestamp = msg.timestamp.toLocaleString();
      history += `[${timestamp}] ${role}:\n${msg.content}\n\n`;
      
      if (msg.rating) {
        history += `[Rating: ${msg.rating}/5]\n\n`;
      }
    });
    
    return history;
  }

  private generateThreadTitle(messages: Message[]): string {
    if (messages.length === 0) return 'New Chat';
    
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) return 'New Chat';
    
    // Extract first few words as title
    const words = firstUserMessage.content.split(' ').slice(0, 6);
    let title = words.join(' ');
    
    if (firstUserMessage.content.split(' ').length > 6) {
      title += '...';
    }
    
    return title || 'New Chat';
  }

  private updateThreadList(thread: ChatThread): void {
    const threads = this.getAllThreads();
    const existingIndex = threads.findIndex(t => t.id === thread.id);
    
    if (existingIndex >= 0) {
      threads[existingIndex] = thread;
    } else {
      threads.unshift(thread);
    }
    
    // Keep only last 100 threads
    const limitedThreads = threads.slice(0, 100);
    localStorage.setItem('chat-threads-list', JSON.stringify(limitedThreads));
  }

  private extractTopics(messages: Message[]): string[] {
    const topics: string[] = [];
    const content = messages.map(m => m.content).join(' ').toLowerCase();
    
    // Simple keyword extraction
    const keywords = [
      'code', 'programming', 'javascript', 'python', 'react', 'web development',
      'ai', 'machine learning', 'data', 'analysis', 'research', 'writing',
      'design', 'business', 'marketing', 'strategy', 'planning', 'project'
    ];
    
    keywords.forEach(keyword => {
      if (content.includes(keyword)) {
        topics.push(keyword);
      }
    });
    
    return topics.slice(0, 5); // Limit to 5 topics
  }

  // Auto-save functionality
  enableAutoSave(messages: Message[], threadId: string, intervalMs = 30000): () => void {
    const interval = setInterval(() => {
      if (messages.length > 0) {
        this.saveCurrentThread(messages, threadId);
      }
    }, intervalMs);
    
    return () => clearInterval(interval);
  }

  // Export/Import functionality
  exportThread(threadId: string): string | null {
    const thread = this.loadThread(threadId);
    if (!thread) return null;
    
    return JSON.stringify(thread, null, 2);
  }

  importThread(threadData: string): boolean {
    try {
      const thread = JSON.parse(threadData);
      this.saveCurrentThread(thread.messages, thread.id);
      return true;
    } catch (error) {
      console.error('Error importing thread:', error);
      return false;
    }
  }
}

export const chatStorageService = ChatStorageService.getInstance();