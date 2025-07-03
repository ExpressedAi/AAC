@@ .. @@
 import { chatStorageService } from './services/chatStorage';
 import { ChatThreads } from './components/ChatThreads';
 import { BackgroundTasks } from './components/BackgroundTasks';
 import { LearningPanel } from './components/LearningPanel';
 import { SettingsPanel } from './components/SettingsPanel';
 import { MainAgentConfig } from './components/MainAgentConfig';
 import { MCPServerManager } from './components/MCPServerManager';
 import { MessageBubble } from './components/MessageBubble';
+import { taskManagementService } from './services/taskManagementService';

 type ActivePanel = 'chat' | 'threads' | 'tasks' | 'learning' | 'settings' | 'main-agent' | 'mcp';

 function App() {
   const [messages, setMessages] = useState<Message[]>([]);
   const [inputMessage, setInputMessage] = useState('');
   const [isLoading, setIsLoading] = useState(false);
+  const [isDeploying, setIsDeploying] = useState(false);
   const [activePanel, setActivePanel] = useState<ActivePanel>('chat');
   const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
   const [autoSaveCleanup, setAutoSaveCleanup] = useState<(() => void) | null>(null);
+  const [backgroundAgents, setBackgroundAgents] = useState<Agent[]>([]);

   useEffect(() => {
     // Load the most recent thread on startup
     const threads = chatStorageService.getAllThreads();
     if (threads.length > 0) {
       const mostRecent = threads[0];
       setMessages(mostRecent.messages);
       setCurrentThreadId(mostRecent.id);
     }
+    
+    // Load background agents
+    loadBackgroundAgents();
   }, []);

+  const loadBackgroundAgents = () => {
+    const activeAgents = taskManagementService.getActiveAgents();
+    setBackgroundAgents(activeAgents);
+  };
+
   useEffect(() => {
     // Setup auto-save for current thread
     if (autoSaveCleanup) {
       autoSaveCleanup();
     }

     if (currentThreadId && messages.length > 0) {
       const cleanup = chatStorageService.enableAutoSave(messages, currentThreadId);
       setAutoSaveCleanup(() => cleanup);
     }
   }, [messages, currentThreadId]);

+  const handleDeployAsTask = async () => {
+    if (!inputMessage.trim() || isDeploying) return;
+
+    // Find an active background agent
+    const activeAgents = taskManagementService.getActiveAgents();
+    if (activeAgents.length === 0) {
+      alert('No active background agents available. Please configure and activate agents in the Settings panel.');
+      return;
+    }
+
+    // Use the first active agent for simplicity
+    const selectedAgent = activeAgents[0];
+    
+    setIsDeploying(true);
+    
+    try {
+      const taskId = await taskManagementService.initiateBackgroundTask(
+        selectedAgent.id,
+        inputMessage,
+        'general'
+      );
+      
+      // Clear the input
+      setInputMessage('');
+      
+      // Show success message
+      alert(`Task deployed successfully to ${selectedAgent.name}! Task ID: ${taskId}`);
+      
+      // Optionally switch to tasks panel to see the progress
+      // setActivePanel('tasks');
+    } catch (error) {
+      console.error('Error deploying task:', error);
+      alert(`Error deploying task: ${error instanceof Error ? error.message : 'Unknown error'}`);
+    } finally {
+      setIsDeploying(false);
+    }
+  };

   const handleSendMessage = async () => {
     if (!inputMessage.trim() || isLoading) return;

     const userMessage: Message = {
       id: Date.now().toString(),
       content: inputMessage,
       role: 'user',
       timestamp: new Date()
     };

     const newMessages = [...messages, userMessage];
     setMessages(newMessages);
     setInputMessage('');
     setIsLoading(true);

     try {
       // Get conversation context for the main agent
       const conversationHistory = chatStorageService.getFullConversationHistory(newMessages);
       const contextualPrompt = `${conversationHistory}\n\nUser: ${inputMessage}`;
       
       const response = await chatService.sendMessage(contextualPrompt, undefined, undefined, true);
       
       const assistantMessage: Message = {
         id: (Date.now() + 1).toString(),
         content: response.content,
         role: 'assistant',
         timestamp: new Date()
       };

       const finalMessages = [...newMessages, assistantMessage];
       setMessages(finalMessages);

       // Save or update thread
       const threadId = currentThreadId || chatStorageService.saveCurrentThread(finalMessages);
       if (!currentThreadId) {
         setCurrentThreadId(threadId);
       } else {
         chatStorageService.saveCurrentThread(finalMessages, threadId);
       }
     } catch (error) {
       console.error('Error sending message:', error);
     } finally {
       setIsLoading(false);
     }
   };

@@ .. @@
             {/* Input */}
             <div className="p-4 border-t border-blue-200 bg-blue-50">
               <div className="flex space-x-3">
                 <textarea
                   value={inputMessage}
                   onChange={(e) => setInputMessage(e.target.value)}
                   onKeyPress={handleKeyPress}
                   placeholder="Type your message... (Shift+Enter for new line)"
                   className="flex-1 px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 resize-none bg-white shadow-sm"
                   rows={3}
                   disabled={isLoading || isDeploying}
                 />
-                <button
-                  onClick={handleSendMessage}
-                  disabled={!inputMessage.trim() || isLoading}
-                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-md"
-                >
-                  <Send size={16} />
-                  <span>Send</span>
-                </button>
+                <div className="flex flex-col space-y-2">
+                  <button
+                    onClick={handleSendMessage}
+                    disabled={!inputMessage.trim() || isLoading || isDeploying}
+                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-md"
+                  >
+                    <Send size={16} />
+                    <span>Send</span>
+                  </button>
+                  <button
+                    onClick={handleDeployAsTask}
+                    disabled={!inputMessage.trim() || isLoading || isDeploying || backgroundAgents.length === 0}
+                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-md text-sm"
+                    title={backgroundAgents.length === 0 ? 'No active background agents' : `Deploy to ${backgroundAgents[0]?.name || 'background agent'}`}
+                  >
+                    <Clock size={14} />
+                    <span>{isDeploying ? 'Deploying...' : 'Deploy as Task'}</span>
+                  </button>
+                </div>
               </div>
+              {backgroundAgents.length > 0 && (
+                <div className="mt-2 text-xs text-blue-600">
+                  Ready to deploy to: {backgroundAgents.map(agent => agent.name).join(', ')}
+                </div>
+              )}
             </div>
           </div>
         );