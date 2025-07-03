@@ .. @@
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
+
+  async getLearningSummary(): Promise<string> {
+    try {
+      const ratedMessages = await this.getRatedResponses();
+      
+      if (ratedMessages.length === 0) {
+        return '';
+      }
+
+      // Calculate basic statistics
+      const ratings = ratedMessages.map(msg => msg.rating!);
+      const totalRatings = ratings.length;
+      const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / totalRatings;
+      
+      // Find high and low rated responses
+      const highRatedMessages = ratedMessages.filter(msg => msg.rating! >= 4);
+      const lowRatedMessages = ratedMessages.filter(msg => msg.rating! <= 2);
+      
+      // Calculate improvement trend
+      const midpoint = Math.floor(ratings.length / 2);
+      const firstHalf = ratings.slice(0, midpoint);
+      const secondHalf = ratings.slice(midpoint);
+      
+      const firstHalfAvg = firstHalf.length > 0 ? 
+        firstHalf.reduce((sum, r) => sum + r, 0) / firstHalf.length : 0;
+      const secondHalfAvg = secondHalf.length > 0 ? 
+        secondHalf.reduce((sum, r) => sum + r, 0) / secondHalf.length : 0;
+      
+      const improvementRate = firstHalf.length > 0 && secondHalf.length > 0 ? 
+        ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
+
+      // Build learning summary
+      let summary = `LEARNING CONTEXT FROM USER FEEDBACK:\n`;
+      summary += `==========================================\n\n`;
+      
+      summary += `Performance Overview:\n`;
+      summary += `- Total rated responses: ${totalRatings}\n`;
+      summary += `- Average rating: ${averageRating.toFixed(1)}/5.0\n`;
+      summary += `- Performance trend: ${improvementRate > 0 ? 'improving' : improvementRate < 0 ? 'declining' : 'stable'} (${improvementRate.toFixed(1)}%)\n\n`;
+      
+      // Add examples of highly rated responses
+      if (highRatedMessages.length > 0) {
+        summary += `Examples of HIGHLY RATED responses (4+ stars):\n`;
+        summary += `---------------------------------------------\n`;
+        highRatedMessages.slice(0, 3).forEach((msg, index) => {
+          const preview = msg.content.length > 200 ? 
+            msg.content.substring(0, 200) + '...' : msg.content;
+          summary += `${index + 1}. [Rating: ${msg.rating}/5] ${preview}\n\n`;
+        });
+      }
+      
+      // Add examples of poorly rated responses
+      if (lowRatedMessages.length > 0) {
+        summary += `Examples of POORLY RATED responses (2 stars or less):\n`;
+        summary += `----------------------------------------------------\n`;
+        lowRatedMessages.slice(0, 2).forEach((msg, index) => {
+          const preview = msg.content.length > 200 ? 
+            msg.content.substring(0, 200) + '...' : msg.content;
+          summary += `${index + 1}. [Rating: ${msg.rating}/5] ${preview}\n\n`;
+        });
+      }
+      
+      summary += `LEARNING GUIDANCE:\n`;
+      summary += `- Emulate the style and approach of highly rated responses\n`;
+      summary += `- Avoid patterns found in poorly rated responses\n`;
+      summary += `- Focus on being helpful, accurate, and comprehensive\n`;
+      summary += `- Pay attention to user preferences shown through ratings\n\n`;
+      
+      return summary;
+    } catch (error) {
+      console.error('Error generating learning summary:', error);
+      return '';
+    }
+  }
 }