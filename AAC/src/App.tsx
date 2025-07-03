import React, { useState, useEffect } from 'react';
import { MessageCircle, Settings, Clock, TrendingUp, User, Terminal, Send, Star, Calendar } from 'lucide-react';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { Message, ChatThread, Agent } from './types';
import { chatService } from './services/chat';
import { chatStorageService } from './services/chatStorage';
import { ChatThreads } from './components/ChatThreads';
import { BackgroundTasks } from './components/BackgroundTasks';
import { LearningPanel } from './components/LearningPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { MainAgentConfig } from './components/MainAgentConfig';
import { MCPServerManager } from './components/MCPServerManager';
import { MessageBubble } from './components/MessageBubble';
import { LearningCalendar } from './components/LearningCalendar.tsx';

type ActivePanel = 'chat' | 'threads' | 'tasks' | 'learning' | 'calendar' | 'settings' | 'main-agent' | 'mcp';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>('chat');
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [autoSaveCleanup, setAutoSaveCleanup] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Load the most recent thread on startup
    const threads = chatStorageService.getAllThreads();
    if (threads.length > 0) {
      const mostRecent = threads[0];
      setMessages(mostRecent.messages);
      setCurrentThreadId(mostRecent.id);
    }
  }, []);

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

  const handleRateMessage = async (messageId: string, rating: number) => {
    const updatedMessages = messages.map(msg =>
      msg.id === messageId ? { ...msg, rating } : msg
    );
    setMessages(updatedMessages);

    // Save rated message to localStorage for learning
    try {
      const ratedMessages = JSON.parse(localStorage.getItem('rated-messages') || '[]');
      const ratedMessage = updatedMessages.find(msg => msg.id === messageId);
      if (ratedMessage) {
        const existingIndex = ratedMessages.findIndex((m: Message) => m.id === messageId);
        if (existingIndex >= 0) {
          ratedMessages[existingIndex] = ratedMessage;
        } else {
          ratedMessages.push(ratedMessage);
        }
        localStorage.setItem('rated-messages', JSON.stringify(ratedMessages));
      }
    } catch (error) {
      console.error('Error saving rated message:', error);
    }

    // Update thread
    if (currentThreadId) {
      chatStorageService.saveCurrentThread(updatedMessages, currentThreadId);
    }
  };

  const handleThreadSelect = (thread: ChatThread) => {
    setMessages(thread.messages);
    setCurrentThreadId(thread.id);
    setActivePanel('chat');
  };

  const handleNewThread = () => {
    setMessages([]);
    setCurrentThreadId(null);
    setActivePanel('chat');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderSidebarButton = (
    panel: ActivePanel,
    icon: React.ReactNode,
    label: string
  ) => (
    <button
      onClick={() => setActivePanel(panel)}
      className={`w-full p-3 rounded-lg transition-all duration-200 flex items-center justify-center group ${
        activePanel === panel
          ? 'bg-blue-500 text-white shadow-lg'
          : 'text-blue-600 hover:bg-blue-100'
      }`}
      title={label}
    >
      {icon}
    </button>
  );

  const renderActivePanel = () => {
    switch (activePanel) {
      case 'threads':
        return (
          <ChatThreads
            currentThreadId={currentThreadId}
            onThreadSelect={handleThreadSelect}
            onNewThread={handleNewThread}
          />
        );
      case 'tasks':
        return <BackgroundTasks />;
      case 'learning':
        return <LearningPanel />;
      case 'calendar':
        return <LearningCalendar />;
      case 'settings':
        return <SettingsPanel />;
      case 'main-agent':
        return <MainAgentConfig />;
      case 'mcp':
        return <MCPServerManager />;
      default:
        return (
          <div className="h-full flex flex-col bg-gradient-to-b from-blue-50 to-white">
            {/* Chat Header */}
            <div className="p-4 border-b border-blue-200 bg-blue-50">
              <h2 className="text-lg font-semibold text-blue-800">
                Advanced Agentic Chat
              </h2>
              <p className="text-sm text-blue-600">
                Chat with AI using reasoning and vision capabilities
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="text-center text-blue-500 mt-8">
                  <MessageCircle size={48} className="mx-auto mb-4 text-blue-300" />
                  <p>Start a conversation with the AI</p>
                  <p className="text-xs mt-2">
                    Features reasoning, vision, and advanced capabilities
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="mb-4">
                    {message.role === 'assistant' ? (
                      <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <MessageCircle size={12} className="text-white" />
                            </div>
                            <span className="text-sm font-medium text-blue-800">AI Assistant</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-blue-500">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                            {message.rating && (
                              <div className="flex items-center space-x-1">
                                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-blue-500">{message.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <MarkdownRenderer content={message.content} />
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            {message.rating ? (
                              <div className="flex items-center space-x-1">
                                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-blue-500">{message.rating}</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => handleRateMessage(message.id, i + 1)}
                                    className="hover:scale-110 transition-transform"
                                  >
                                    <Star
                                      size={14}
                                      className={`${
                                        i < (message.rating || 0)
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300 hover:text-yellow-400'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <div className="bg-blue-500 text-white rounded-lg p-4 max-w-[80%]">
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <div className="text-xs text-blue-100 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="text-sm text-blue-600 ml-2">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-md"
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-2 shadow-lg">
        {renderSidebarButton('chat', <MessageCircle size={20} />, 'Chat')}
        {renderSidebarButton('threads', <MessageCircle size={20} />, 'Chat Threads')}
        {renderSidebarButton('tasks', <Clock size={20} />, 'Background Tasks')}
        {renderSidebarButton('learning', <TrendingUp size={20} />, 'Learning Analytics')}
        {renderSidebarButton('calendar', <Calendar size={20} />, 'Learning Calendar')}
        {renderSidebarButton('main-agent', <User size={20} />, 'Main Agent Config')}
        {renderSidebarButton('settings', <Settings size={20} />, 'Agent Settings')}
        {renderSidebarButton('mcp', <Terminal size={20} />, 'MCP Servers')}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {renderActivePanel()}
      </div>
    </div>
  );
}

export default App;