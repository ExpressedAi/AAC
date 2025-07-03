@@ .. @@
 import { MarkdownRenderer } from './MarkdownRenderer';
 import { BackgroundTask, Agent } from '../types';
 import { dbService } from '../services/database';
-import { chatService } from '../services/chat';
-import { agentCapabilitiesService } from '../services/agentCapabilities';
+import { taskManagementService } from '../services/taskManagementService';

 export const BackgroundTasks: React.FC = () => {
@@ .. @@
   const createTask = async () => {
-    if (!selectedAgent || isCreating) return;
-    if (taskType === 'general' && !taskPrompt.trim()) return;
-    if (taskType === 'capability' && (!selectedCapability || !capabilityInput.trim())) return;
+    if (!selectedAgent || isCreating) {
+      alert('Please select an agent');
+      return;
+    }
+    if (taskType === 'general' && !taskPrompt.trim()) {
+      alert('Please enter a task description');
+      return;
+    }
+    if (taskType === 'capability' && (!selectedCapability || !capabilityInput.trim())) {
+      alert('Please select a capability and provide input');
+      return;
+    }

     setIsCreating(true);
     
-    const agent = agents.find(a => a.id === selectedAgent);
-    if (!agent) return;
-
-    const task: BackgroundTask = {
-      id: Date.now().toString(),
-      agentId: selectedAgent,
-      prompt: taskType === 'general' ? taskPrompt : `Use ${selectedCapability} capability: ${capabilityInput}`,
-      capability: taskType === 'capability' ? selectedCapability : undefined,
-      status: 'pending',
-      timestamp: new Date()
-    };
-
     try {
-      await dbService.saveBackgroundTask(task);
-      
-      // Update task status to running
-      task.status = 'running';
-      await dbService.saveBackgroundTask(task);
-      
-      let response;
-      
-      if (taskType === 'capability' && selectedCapability) {
-        // Execute using capability
-        const capabilityResult = await agentCapabilitiesService.executeCapability(
-          agent,
-          selectedCapability,
-          capabilityInput,
-          'Please complete this task using your specialized capability.'
-        );
-        
-        if (capabilityResult.success) {
-          response = { content: JSON.stringify(capabilityResult.result, null, 2) };
-        } else {
-          response = { error: capabilityResult.error };
-        }
-      } else {
-        // Execute as general task
-        response = await chatService.sendBackgroundTask(agent.id, agent.prompt + '\n\nTask: ' + taskPrompt, agent.apiKey);
-      }
-      
-      // Update task with result
-      if (response.error) {
-        task.status = 'error';
-        task.error = response.error;
-      } else {
-        task.status = 'completed';
-        task.result = response.content;
-      }
-      
-      await dbService.saveBackgroundTask(task);
-      await loadTasks();
+      // Use the new task management service for parallel execution
+      await taskManagementService.initiateBackgroundTask(
+        selectedAgent,
+        taskType === 'general' ? taskPrompt : capabilityInput,
+        taskType,
+        selectedCapability,
+        capabilityInput
+      );
       
+      // Clear form
       setTaskPrompt('');
       setCapabilityInput('');
       setSelectedAgent('');
       setSelectedCapability('');
+      
+      // Refresh task list
+      await loadTasks();
+      
+      alert('Task initiated successfully! It will run in parallel.');
     } catch (error) {
       console.error('Error creating task:', error);
-      task.status = 'error';
-      task.error = error instanceof Error ? error.message : 'Unknown error';
-      await dbService.saveBackgroundTask(task);
-      await loadTasks();
+      alert(`Error creating task: ${error instanceof Error ? error.message : 'Unknown error'}`);
     } finally {
       setIsCreating(false);
     }
   };