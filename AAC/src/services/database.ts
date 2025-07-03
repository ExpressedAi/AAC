import { Message, BackgroundTask, MemoryEntry } from '../types';

class DatabaseService {
  private static instance: DatabaseService;

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Background Tasks
  async saveBackgroundTask(task: BackgroundTask): Promise<void> {
    try {
      const tasks = await this.getBackgroundTasks();
      const existingIndex = tasks.findIndex(t => t.id === task.id);
      
      if (existingIndex >= 0) {
        tasks[existingIndex] = task;
      } else {
        tasks.push(task);
      }
      
      localStorage.setItem('background-tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving background task:', error);
    }
  }

  async getBackgroundTasks(): Promise<BackgroundTask[]> {
    try {
      const tasksData = localStorage.getItem('background-tasks');
      if (!tasksData) return [];
      
      const tasks = JSON.parse(tasksData);
      return tasks.map((task: any) => ({
        ...task,
        timestamp: new Date(task.timestamp)
      }));
    } catch (error) {
      console.error('Error loading background tasks:', error);
      return [];
    }
  }

  // Rated Responses for Learning
  async getRatedResponses(): Promise<Message[]> {
    try {
      const messagesData = localStorage.getItem('rated-messages');
      if (!messagesData) return [];
      
      const messages = JSON.parse(messagesData);
      return messages
        .filter((msg: any) => msg.rating !== undefined)
        .map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
    } catch (error) {
      console.error('Error loading rated responses:', error);
      return [];
    }
  }

  async saveRatedMessage(message: Message): Promise<void> {
    try {
      const messages = await this.getRatedResponses();
      const existingIndex = messages.findIndex(m => m.id === message.id);
      
      if (existingIndex >= 0) {
        messages[existingIndex] = message;
      } else {
        messages.push(message);
      }
      
      localStorage.setItem('rated-messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving rated message:', error);
    }
  }

  // Memory Entries
  async saveMemoryEntry(entry: MemoryEntry): Promise<void> {
    try {
      const memories = await this.getMemoryEntries();
      memories.push(entry);
      localStorage.setItem('memory-entries', JSON.stringify(memories));
    } catch (error) {
      console.error('Error saving memory entry:', error);
    }
  }

  async getMemoryEntries(): Promise<MemoryEntry[]> {
    try {
      const memoriesData = localStorage.getItem('memory-entries');
      if (!memoriesData) return [];
      
      const memories = JSON.parse(memoriesData);
      return memories.map((memory: any) => ({
        ...memory,
        timestamp: new Date(memory.timestamp)
      }));
    } catch (error) {
      console.error('Error loading memory entries:', error);
      return [];
    }
  }

  async searchMemories(query: string, limit = 10): Promise<MemoryEntry[]> {
    try {
      const memories = await this.getMemoryEntries();
      
      // Simple text search - in a real app you'd use vector similarity
      const filtered = memories.filter(memory =>
        memory.content.toLowerCase().includes(query.toLowerCase())
      );
      
      return filtered.slice(0, limit);
    } catch (error) {
      console.error('Error searching memories:', error);
      return [];
    }
  }
}

export const dbService = DatabaseService.getInstance();