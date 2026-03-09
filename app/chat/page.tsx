'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { MessageSquare, Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/classUtils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi Birger! I'm Lisa, your AI assistant for mission control. I can help you with tasks, projects, team coordination, and more. What would you like to work on today?",
  timestamp: new Date().toISOString(),
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
      });

      const data = await res.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: data.timestamp,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  };

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-primary/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-linear-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-linear-text mb-0.5">Chat with Lisa</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-linear-textMuted text-sm">Online - Ready to assist</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 mb-4 pr-2 scrollbar-thin">
        {messages.map((message) => {
          const isUser = message.role === 'user';

          return (
            <div
              key={message.id}
              className={cn('flex gap-3', isUser && 'flex-row-reverse')}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-semibold',
                  isUser
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                )}
              >
                {isUser ? 'B' : 'L'}
              </div>

              {/* Message Bubble */}
              <div
                className={cn(
                  'max-w-[70%] flex flex-col',
                  isUser ? 'items-end' : 'items-start'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-linear-textMuted">
                    {isUser ? 'You' : 'Lisa'}
                  </span>
                  <span className="text-xs text-linear-textMuted/50">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div
                  className={cn(
                    'glass rounded-xl px-4 py-3 text-sm leading-relaxed',
                    isUser
                      ? 'bg-linear-surface text-linear-text'
                      : 'bg-linear-primary/10 text-linear-text border border-linear-primary/20'
                  )}
                >
                  {message.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return (
                            <strong key={j} className="font-semibold">
                              {part.slice(2, -2)}
                            </strong>
                          );
                        }
                        return <span key={j}>{part}</span>;
                      })}
                      {i < message.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 text-sm font-semibold">
              L
            </div>
            <div className="glass rounded-xl px-4 py-3 bg-linear-primary/10 border border-linear-primary/20">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-linear-primary/60 animate-bounce [animation-delay:0ms]" />
                <div className="w-2 h-2 rounded-full bg-linear-primary/60 animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 rounded-full bg-linear-primary/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass rounded-xl border border-linear-border bg-linear-surface p-3">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message Lisa..."
            rows={1}
            className="flex-1 bg-transparent text-linear-text placeholder-linear-textMuted/50 text-sm resize-none outline-none min-h-[36px] max-h-[160px] py-2"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className={cn(
              'p-2 rounded-lg transition-all flex-shrink-0',
              input.trim() && !isTyping
                ? 'bg-linear-primary text-white hover:bg-linear-primary/80'
                : 'text-linear-textMuted/30 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 text-xs text-linear-textMuted/40">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
