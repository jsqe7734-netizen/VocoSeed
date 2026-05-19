import { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import type { Message } from '../data/types';

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface ChatBubbleProps {
  message: Message;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const [isTyping, setIsTyping] = useState(message.role === 'ai' && message.content.length < 50);
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const messageRef = useRef(message);

  // Reset state when message changes
  useEffect(() => {
    if (message.id !== messageRef.current.id) {
      messageRef.current = message;
      if (message.role === 'ai' && message.content) {
        setIsTyping(true);
        setDisplayedContent('');
        setCurrentIndex(0);
      }
    }
  }, [message.id, message.role, message.content]);

  // Typing animation
  useEffect(() => {
    if (!isTyping) return;

    if (currentIndex < message.content.length) {
      const timeout = setTimeout(() => {
        setDisplayedContent(prev => prev + message.content[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 30);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [isTyping, currentIndex, message.content]);

  const isUser = message.role === 'user';

  return (
    <div className={cn(
      'flex gap-3 animate-fade-in',
      isUser ? 'flex-row-reverse' : 'flex-row'
    )}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        isUser ? 'bg-primary' : 'bg-gradient-to-br from-secondary to-emerald-400'
      )}>
        {isUser ? (
          <span className="text-xs font-semibold">我</span>
        ) : (
          <Sparkles size={14} className="text-white" />
        )}
      </div>

      {/* Message bubble */}
      <div className={cn(
        'max-w-[75%] px-4 py-3 rounded-2xl',
        isUser
          ? 'bg-gradient-to-br from-primary to-indigo-600 text-white rounded-tr-md'
          : 'bg-surface border border-surface-light rounded-tl-md'
      )}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {displayedContent || message.content}
          {isTyping && (
            <span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse" />
          )}
        </p>
        {message.type === 'image' && message.imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img
              src={message.imageUrl}
              alt="Generated"
              className="max-w-full rounded-lg"
              loading="lazy"
            />
          </div>
        )}
        <span className={cn(
          'text-[10px] mt-1 block',
          isUser ? 'text-white/60' : 'text-slate-500'
        )}>
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-emerald-400 flex items-center justify-center flex-shrink-0">
        <Sparkles size={14} className="text-white" />
      </div>
      <div className="bg-surface border border-surface-light px-4 py-3 rounded-2xl rounded-tl-md">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
