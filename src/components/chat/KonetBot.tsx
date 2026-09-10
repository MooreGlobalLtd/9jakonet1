import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Minimize2, 
  RotateCcw, 
  ShieldCheck, 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  MessageSquareQuote,
  Clock
} from 'lucide-react';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { getSmartBotAnswer } from '../../lib/botEngine';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  text: "Hello! 👋 I'm **KonetBot**, your active 9jaKonet support assistant.\n\nI am here to guide you through anything on **9jaKonet** — including finding verified Nigerian artisans, how our Paystack Escrow locks your funds safely, the 6-digit email OTP release process, and how artisans withdraw their 90% net earnings.\n\nWhat would you like to know about 9jaKonet today?",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

const SUGGESTED_QUESTIONS = [
  "How does Paystack Escrow work?",
  "How do I hire a verified artisan?",
  "What documents do I need for KYC?",
  "How do I turn on location on my phone?",
  "How does the 6-digit OTP release work?",
  "How do artisans withdraw to Nigerian bank?",
  "What if I'm not satisfied with the job?"
];

export default function KonetBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      setShowNotificationBadge(false);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputText.trim();
    if (!message || isLoading) return;

    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: message,
      timestamp: userTimestamp
    };

    // Update UI immediately with user message
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // Build conversation history for API
      const historyPayload = updatedMessages.slice(-8).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          history: historyPayload
        })
      });

      let replyText: string | null = null;
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.reply && typeof data.reply === 'string' && data.reply.trim()) {
          replyText = data.reply.trim();
        }
      }

      // If server returned non-200 or empty, use smart local engine
      if (!replyText) {
        replyText = getSmartBotAnswer(message);
      }

      const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          text: replyText!,
          timestamp: botTimestamp
        }
      ]);
    } catch (err) {
      console.warn('Bot network or parsing exception, using smart client-side knowledge engine:', err);
      const fallbackReply = getSmartBotAnswer(message);
      const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          text: fallbackReply,
          timestamp: botTimestamp
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        ...INITIAL_MESSAGE,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Helper to parse simple markdown formatting into React nodes
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-sm leading-relaxed">
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={lineIdx} className="h-1" />;
          }

          // Header line (### or ##)
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={lineIdx} className="font-bold text-slate-900 pt-1 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 inline" />
                {trimmed.replace('### ', '')}
              </h4>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={lineIdx} className="font-bold text-slate-900 pt-1.5 text-sm">
                {trimmed.replace('## ', '')}
              </h3>
            );
          }

          // Bullet list items
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.substring(2);
            return (
              <div key={lineIdx} className="flex items-start gap-2 pl-1.5 my-0.5">
                <span className="text-emerald-600 font-bold leading-none mt-1">•</span>
                <span>{parseBold(content)}</span>
              </div>
            );
          }

          // Numbered list items (e.g. "1. ")
          const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (numberedMatch) {
            return (
              <div key={lineIdx} className="flex items-start gap-2 pl-1.5 my-0.5">
                <span className="font-bold text-emerald-700 bg-emerald-100 rounded-full h-4 w-4 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {numberedMatch[1]}
                </span>
                <span>{parseBold(numberedMatch[2])}</span>
              </div>
            );
          }

          // Normal paragraph line
          return (
            <p key={lineIdx}>
              {parseBold(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // Helper to replace **bold** with <strong> elements
  const parseBold = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <motion.div drag dragMomentum={false} id="konetbot-container" className="fixed bottom-5 right-5 z-50 flex flex-col items-end" style={{ touchAction: "none" }}>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <div className="relative group">
          {/* Active online pulse ring */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
          </span>

          {/* Invitation Speech Bubble */}
          {showNotificationBadge && (
            <div 
              onClick={() => setIsOpen(true)}
              className="hidden sm:flex absolute right-16 bottom-1 bg-white border border-emerald-200 shadow-xl rounded-2xl px-3.5 py-2 items-center gap-2 cursor-pointer hover:border-emerald-400 transition-all w-60 animate-bounce"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></div>
              <p className="text-xs font-medium text-slate-700 leading-snug">
                Questions about <span className="font-bold text-emerald-700">9jaKonet</span>? I'm active and ready!
              </p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotificationBadge(false);
                }} 
                className="text-slate-400 hover:text-slate-600 ml-auto"
                title="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <button
            id="konetbot-open-button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-3.5 rounded-full shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 border-2 border-emerald-500"
            aria-label="Open 9jaKonet AI Support Assistant"
          >
            <div className="relative">
              <Bot className="h-6 w-6 text-white" />
              <Sparkles className="h-3 w-3 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="font-bold text-sm tracking-wide pr-1">KonetBot</span>
            <span className="bg-emerald-900/60 text-[10px] text-emerald-200 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/40">
              Active
            </span>
          </button>
        </div>
      )}

      {/* Expanded Chat Drawer / Window */}
      {isOpen && (
        <div 
          id="konetbot-chat-window"
          className="w-[92vw] sm:w-[410px] h-[550px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white p-3.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative h-10 w-10 rounded-full bg-emerald-600 border-2 border-white/40 flex items-center justify-center shrink-0 shadow-inner">
                <Bot className="h-6 w-6 text-white" />
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white tracking-tight">KonetBot</h3>
                  <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-emerald-400/30">
                    Official AI
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200 flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  9jaKonet Support Specialist • Online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <button
                id="konetbot-reset-button"
                onClick={handleResetChat}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Restart conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                id="konetbot-minimize-button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Minimize chat"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Specialized Domain Scope Notice */}
          <div className="bg-amber-50 border-b border-amber-200/80 px-3 py-1.5 flex items-center gap-1.5 text-[11px] text-amber-900 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-700 shrink-0" />
            <span>Dedicated exclusively to answering questions about <strong>9jaKonet</strong>.</span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-sm ${
                    msg.role === 'user'
                      ? 'bg-emerald-700 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    renderFormattedText(msg.text)
                  )}

                  <div className={`mt-1 flex items-center gap-1 text-[10px] ${msg.role === 'user' ? 'text-emerald-200 justify-end' : 'text-slate-400 justify-start'}`}>
                    <Clock className="h-2.5 w-2.5" />
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="h-7 w-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium mr-1">KonetBot is typing</span>
                  <span className="h-1.5 w-1.5 bg-emerald-600 rounded-full animate-bounce"></span>
                  <span className="h-1.5 w-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-1.5 w-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ Suggestion Chips */}
          <div className="border-t border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-slate-400" />
              Suggested 9jaKonet Questions:
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  disabled={isLoading}
                  className="whitespace-nowrap text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors shrink-0 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                id="konetbot-input"
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about 9jaKonet, escrow, artisans..."
                disabled={isLoading}
                className="flex-1 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white focus:outline-none rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors disabled:opacity-60"
              />
              <Button
                id="konetbot-send-button"
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-3.5 py-2.5 h-auto shrink-0 shadow-sm disabled:opacity-50"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">
              KonetBot is an active AI assistant specialized strictly for 9jaKonet.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
