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

  async getLearningSummary(): Promise<string> {
    try {
      const ratedMessages = await this.getRatedResponses();
      
      if (ratedMessages.length === 0) {
        return '';
      }

      // Calculate basic statistics
      const ratings = ratedMessages.map(msg => msg.rating!);
      const totalRatings = ratings.length;
      const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / totalRatings;
      
      // Find high and low rated responses
      const highRatedMessages = ratedMessages.filter(msg => msg.rating! >= 4);
      const lowRatedMessages = ratedMessages.filter(msg => msg.rating! <= 2);
      
      // Calculate improvement trend
      const midpoint = Math.floor(ratings.length / 2);
      const firstHalf = ratings.slice(0, midpoint);
      const secondHalf = ratings.slice(midpoint);
      
      const firstHalfAvg = firstHalf.length > 0 ? 
        firstHalf.reduce((sum, r) => sum + r, 0) / firstHalf.length : 0;
      const secondHalfAvg = secondHalf.length > 0 ? 
        secondHalf.reduce((sum, r) => sum + r, 0) / secondHalf.length : 0;
      
      const improvementRate = firstHalf.length > 0 && secondHalf.length > 0 ? 
        ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

      // Build learning summary
      let summary = `LEARNING CONTEXT FROM USER FEEDBACK:\n`;
      summary += `==========================================\n\n`;
      
      summary += `Performance Overview:\n`;
      summary += `- Total rated responses: ${totalRatings}\n`;
      summary += `- Average rating: ${averageRating.toFixed(1)}/5.0\n`;
      summary += `- Performance trend: ${improvementRate > 0 ? 'improving' : improvementRate < 0 ? 'declining' : 'stable'} (${improvementRate.toFixed(1)}%)\n\n`;
      
      // Add examples of highly rated responses
      if (highRatedMessages.length > 0) {
        summary += `Examples of HIGHLY RATED responses (4+ stars):\n`;
        summary += `---------------------------------------------\n`;
        highRatedMessages.slice(0, 3).forEach((msg, index) => {
          const preview = msg.content.length > 200 ? 
            msg.content.substring(0, 200) + '...' : msg.content;
          summary += `${index + 1}. [Rating: ${msg.rating}/5] ${preview}\n\n`;
        });
      }
      
      // Add examples of poorly rated responses
      if (lowRatedMessages.length > 0) {
        summary += `Examples of POORLY RATED responses (2 stars or less):\n`;
        summary += `----------------------------------------------------\n`;
        lowRatedMessages.slice(0, 2).forEach((msg, index) => {
          const preview = msg.content.length > 200 ? 
            msg.content.substring(0, 200) + '...' : msg.content;
          summary += `${index + 1}. [Rating: ${msg.rating}/5] ${preview}\n\n`;
        });
      }
      
      summary += `LEARNING GUIDANCE:\n`;
      summary += `- Emulate the style and approach of highly rated responses\n`;
      summary += `- Avoid patterns found in poorly rated responses\n`;
      summary += `- Focus on being helpful, accurate, and comprehensive\n`;
      summary += `- Pay attention to user preferences shown through ratings\n\n`;
      
      return summary;
    } catch (error) {
      console.error('Error generating learning summary:', error);
      return '';
    }
  }

  async getAgentDailySummary(agentId: string, date: Date): Promise<any> {
    try {
      const tasks = await this.getBackgroundTasks();
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(task => {
        const taskDate = task.timestamp.toISOString().split('T')[0];
        return task.agentId === agentId && taskDate === dateStr;
      });
      
      const completedTasks = dayTasks.filter(task => task.status === 'completed');
      const ratedTasks = dayTasks.filter(task => task.rating);
      
      const averageRating = ratedTasks.length > 0 
        ? ratedTasks.reduce((sum, task) => sum + (task.rating || 0), 0) / ratedTasks.length
        : 0;
      
      return {
        date: dateStr,
        totalTasks: dayTasks.length,
        completedTasks: completedTasks.length,
        averageRating,
        tasks: dayTasks
      };
    } catch (error) {
      console.error('Error getting agent daily summary:', error);
      return null;
    }
  }
}

export const dbService = DatabaseService.getInstance();