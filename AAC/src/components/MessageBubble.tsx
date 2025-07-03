import React from 'react';
import { User, Bot, Star } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Message } from '../types';
import { StarRating } from './StarRating';

interface MessageBubbleProps {
  message: Message;
  onRate?: (messageId: string, rating: number) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRate }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-blue-500' : 'bg-gray-500'
          }`}>
            {isUser ? (
              <User size={16} className="text-white" />
            ) : (
              <Bot size={16} className="text-white" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-2 rounded-lg ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="text-sm">
                <MarkdownRenderer content={message.content} className="prose-sm prose-invert" />
              </div>
            )}
          </div>

          {/* Timestamp and Rating */}
          <div className={`flex items-center mt-1 space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <span className="text-xs text-gray-500">
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>

            {/* Rating for assistant messages */}
            {!isUser && onRate && (
              <div className="flex items-center space-x-1">
                <StarRating
                  rating={message.rating || 0}
                  onRatingChange={(rating) => onRate(message.id, rating)}
                  size="sm"
                />
              </div>
            )}

            {/* Show rating if already rated */}
            {!isUser && message.rating && !onRate && (
              <div className="flex items-center space-x-1">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-gray-500">{message.rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};