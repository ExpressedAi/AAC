@@ .. @@
 import { Message, ChatThread } from '../types';
+import { dbService } from './database';

 class ChatStorageService {
   private static instance: ChatStorageService;

@@ .. @@
     return history;
   }

+  // Get learning context for main agent
+  async getLearningContextForMainAgent(): Promise<string> {
+    try {
+      const learningSummary = await dbService.getLearningSummary();
+      
+      if (!learningSummary) {
+        return '';
+      }
+      
+      return `\n\n${learningSummary}`;
+    } catch (error) {
+      console.error('Error getting learning contex  t
}:', error);
+      return '';
+    }
+  }

   private generateThreadTitle(messages: Message[]): string {