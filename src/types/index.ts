@@ .. @@
 export interface BackgroundTask {
   id: string;
   agentId: string;
   prompt: string;
   capability?: string;
   status: 'pending' | 'running' | 'completed' | 'error';
   result?: string;
   error?: string;
   timestamp: Date;
+  rating?: number;
+  learningNotes?: string;
 }

 export interface MCPServer {
@@ .. @@
   arguments: any;
   result?: any;
   error?: string;
 }

+export interface AgentDailySummary {
+  agentId: string;
+  agentName: string;
+  date: string;
+  totalTasks: number;
+  completedTasks: number;
+  averageRating: number;
+  tasks: BackgroundTask[];
+  learningInsights: string[];
+}

+export interface AgentProfile {
+  agents: Agent[];
+  exportDate: Date;
+  version: string;
+  learningData?: {
+    totalRatings: number;
+    averageRating: number;
+    improvementRate: number;
+  };
+}