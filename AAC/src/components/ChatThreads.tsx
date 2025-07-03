import React, { useState, useEffect } from 'react';
import { MessageCircle, Plus, Trash2, Download, Upload, Search, Calendar } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ChatThread } from '../types';
import { chatStorageService } from '../services/chatStorage';

interface ChatThreadsProps {
  currentThreadId?: string;
  onThreadSelect: (thread: ChatThread) => void;
  onNewThread: () => void;
}

export const ChatThreads: React.FC<ChatThreadsProps> = ({
  currentThreadId,
  onThreadSelect,
  onNewThread
}) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = () => {
    const allThreads = chatStorageService.getAllThreads();
    setThreads(allThreads);
  };

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.messages.some(msg => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleDeleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat thread?')) {
      chatStorageService.deleteThread(threadId);
      loadThreads();
    }
  };

  const handleExportThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const exportData = chatStorageService.exportThread(threadId);
    if (exportData) {
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-thread-${threadId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImportThread = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (chatStorageService.importThread(content)) {
        loadThreads();
        alert('Thread imported successfully!');
      } else {
        alert('Failed to import thread. Please check the file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="p-4 border-b border-blue-200 bg-blue-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-blue-800 flex items-center">
            <MessageCircle size={20} className="mr-2" />
            Chat Threads
          </h2>
          <div className="flex items-center space-x-2">
            <label className="cursor-pointer p-2 text-blue-500 hover:text-blue-700 transition-colors">
              <Upload size={16} />
              <input
                type="file"
                accept=".json"
                onChange={handleImportThread}
                className="hidden"
              />
            </label>
            <button
              onClick={onNewThread}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm shadow-md"
            >
              <Plus size={16} />
              <span>New Chat</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-300 bg-white shadow-sm text-sm"
          />
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredThreads.length === 0 ? (
          <div className="text-center text-blue-500 mt-8">
            <MessageCircle size={48} className="mx-auto mb-4 text-blue-300" />
            <p>{searchQuery ? 'No matching conversations found' : 'No chat threads yet'}</p>
            <p className="text-xs mt-2">Start a new conversation to create your first thread</p>
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => onThreadSelect(thread)}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                currentThreadId === thread.id
                  ? 'bg-blue-100 border-blue-300 shadow-md'
                  : 'bg-white border-blue-200 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-blue-800 text-sm line-clamp-2">
                  {thread.title}
                </h3>
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={(e) => handleExportThread(thread.id, e)}
                    className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
                    title="Export thread"
                  >
                    <Download size={12} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteThread(thread.id, e)}
                    className="p-1 text-blue-400 hover:text-red-500 transition-colors"
                    title="Delete thread"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div className="text-xs text-blue-600 mb-2">
                {thread.messages.length} messages
              </div>

              {/* Preview of last message */}
              {thread.messages.length > 0 && (
                <div className="text-xs text-blue-500 line-clamp-2 mb-2">
                  <MarkdownRenderer 
                    content={
                      thread.messages[thread.messages.length - 1].content.substring(0, 100) +
                      (thread.messages[thread.messages.length - 1].content.length > 100 ? '...' : '')
                    }
                    className="prose-xs"
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-blue-400">
                <div className="flex items-center space-x-1">
                  <Calendar size={10} />
                  <span>{formatDate(thread.updatedAt)}</span>
                </div>
                <span>{formatDate(thread.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};