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
  Clock, 
  GripHorizontal,
  Headphones,
  Phone,
  ArrowRight,
  MessageCircle,
  Radio,
  UserCheck
} from 'lucide-react';
import { Button } from '../ui/button';
import { motion, useDragControls } from 'framer-motion';
import { getSmartBotAnswer } from '../../lib/botEngine';
import { useAuthStore } from '../../store/authStore';
import { 
  requestLiveSupport, 
  sendLiveMessage, 
  subscribeToTicketMessages, 
  closeSupportTicket 
} from '../../lib/supportService';
import { formatWhatsAppUrl } from '../../lib/notifications';
import { SupportMessage } from '../../types';
import { toast } from 'sonner';

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

// Keywords that indicate intent to reach a human support representative
const LIVE_AGENT_KEYWORDS = [
  'agent', 'live agent', 'human', 'talk to human', 'real person', 
  'support person', 'customer care', 'representative', 'talk to someone',
  'speak to agent', 'speak to human', 'admin', 'call center'
];

export default function KonetBot() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  
  // Modes: 'bot' (automated) vs 'live_support' (talking with real agent)
  const [chatMode, setChatMode] = useState<'bot' | 'live_support'>('bot');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [isConnectingAgent, setIsConnectingAgent] = useState(false);
  const [liveMessages, setLiveMessages] = useState<SupportMessage[]>([]);
  const [assignedAgentName, setAssignedAgentName] = useState<string | null>(null);
  const [ticketStatus, setTicketStatus] = useState<'waiting' | 'agent_active' | 'resolved'>('waiting');

  // Bot mode state
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragControls = useDragControls();

  // 1. Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, liveMessages, isOpen, isLoading, chatMode]);

  // 2. Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      setShowNotificationBadge(false);
    }
  }, [isOpen]);

  // 3. Check for existing active ticket on mount
  useEffect(() => {
    const savedTicketId = localStorage.getItem('konetbot_active_ticket_id');
    if (savedTicketId) {
      setActiveTicketId(savedTicketId);
      setChatMode('live_support');
    }
  }, []);

  // 4. Subscribe to live support messages when in live_support mode
  useEffect(() => {
    if (chatMode !== 'live_support' || !activeTicketId) return;

    const unsubscribe = subscribeToTicketMessages(activeTicketId, (incoming) => {
      setLiveMessages(incoming);

      // Check if an agent has replied
      const agentMsg = incoming.find(m => m.senderRole === 'agent');
      if (agentMsg) {
        setAssignedAgentName(agentMsg.senderName);
        setTicketStatus('agent_active');
      }

      // Check if closed
      const lastSysMsg = [...incoming].reverse().find(m => m.senderRole === 'system');
      if (lastSysMsg && lastSysMsg.text.toLowerCase().includes('closed')) {
        setTicketStatus('resolved');
      }
    });

    return () => unsubscribe();
  }, [chatMode, activeTicketId]);

  // Hand-off: Connect to Live Support Specialist
  const handleConnectLiveAgent = async (initialQuery?: string) => {
    setIsConnectingAgent(true);
    try {
      const userRole = user?.role || 'visitor';
      const userName = user?.displayName || `Visitor #${Math.floor(1000 + Math.random() * 9000)}`;
      const userEmail = user?.email || '';
      const userPhone = user?.phone || user?.phoneNumber || '';

      const seedMessage = initialQuery || (messages.length > 1 ? messages[messages.length - 1].text : undefined);

      const ticketId = await requestLiveSupport({
        userId: user?.id,
        userName,
        userEmail,
        userPhone,
        userRole,
        initialMessage: seedMessage
      });

      setActiveTicketId(ticketId);
      setChatMode('live_support');
      setTicketStatus('waiting');
      localStorage.setItem('konetbot_active_ticket_id', ticketId);
      toast.success('Live Support requested! An agent will respond shortly.');
    } catch (err: any) {
      console.error('Failed to request live support:', err);
      toast.error('Could not connect to live desk right now. Please try again.');
    } finally {
      setIsConnectingAgent(false);
    }
  };

  // Exit live chat & return to automated bot
  const handleReturnToBot = () => {
    if (activeTicketId && ticketStatus !== 'resolved') {
      closeSupportTicket(activeTicketId, user?.displayName || 'User').catch(() => {});
    }
    setChatMode('bot');
    setActiveTicketId(null);
    localStorage.removeItem('konetbot_active_ticket_id');
    toast.info('Returned to automated KonetBot AI.');
  };

  // Send message handler (works for both bot & live support)
  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputText.trim();
    if (!message || isLoading || isConnectingAgent) return;

    // A. If in LIVE SUPPORT MODE: dispatch directly to support ticket
    if (chatMode === 'live_support' && activeTicketId) {
      setInputText('');
      try {
        await sendLiveMessage({
          ticketId: activeTicketId,
          senderRole: 'user',
          senderId: user?.id,
          senderName: user?.displayName || 'Visitor',
          text: message
        });
      } catch (err) {
        toast.error('Failed to deliver message to support agent.');
      }
      return;
    }

    // B. Check if user is asking for a live agent in bot mode
    const isAskingForAgent = LIVE_AGENT_KEYWORDS.some(k => message.toLowerCase().includes(k));
    if (isAskingForAgent) {
      setInputText('');
      const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text: message, timestamp: userTimestamp },
        { 
          id: `bot-${Date.now() + 1}`, 
          role: 'assistant', 
          text: "I understand you'd like to speak with a real person. 🎧 Connecting you to a **9jaKonet Support Specialist** right now...", 
          timestamp: userTimestamp 
        }
      ]);
      handleConnectLiveAgent(message);
      return;
    }

    // C. Regular Automated Bot Mode
    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: message,
      timestamp: userTimestamp
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
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
    if (chatMode === 'live_support') {
      handleReturnToBot();
    } else {
      setMessages([
        {
          ...INITIAL_MESSAGE,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
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

          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.substring(2);
            return (
              <div key={lineIdx} className="flex items-start gap-2 pl-1.5 my-0.5">
                <span className="text-emerald-600 font-bold leading-none mt-1">•</span>
                <span>{parseBold(content)}</span>
              </div>
            );
          }

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

          return (
            <p key={lineIdx}>
              {parseBold(line)}
            </p>
          );
        })}
      </div>
    );
  };

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
    <motion.div
      id="konetbot-container"
      drag
      dragMomentum={false}
      dragElastic={0.08}
      dragConstraints={{
        top: typeof window !== 'undefined' ? -window.innerHeight + 120 : -600,
        bottom: 0,
        left: typeof window !== 'undefined' ? -window.innerWidth + 90 : -350,
        right: 0
      }}
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end pointer-events-none"
    >
      {/* Floating Launcher Button */}
      {!isOpen && (
        <div className="relative group pointer-events-auto cursor-grab active:cursor-grabbing">
          <span className="absolute -top-1 -right-1 flex h-4 w-4 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
          </span>

          {showNotificationBadge && (
            <div 
              onClick={() => setIsOpen(true)}
              className="hidden sm:flex absolute right-16 bottom-1 bg-white border border-emerald-200 shadow-xl rounded-2xl px-3.5 py-2 items-center gap-2 cursor-pointer hover:border-emerald-400 transition-all w-64 animate-in fade-in slide-in-from-right-2 duration-300 pointer-events-auto"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></div>
              <p className="text-xs font-medium text-slate-700 leading-snug">
                Questions about <span className="font-bold text-emerald-700">9jaKonet</span> or need <span className="font-bold text-emerald-700">Live Support</span>?
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

          <div
            id="konetbot-open-button"
            onClick={() => setIsOpen(true)}
            role="button"
            tabIndex={0}
            className="flex items-center gap-2.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-3.5 rounded-full shadow-2xl transition-transform duration-200 transform hover:scale-105 active:scale-95 border-2 border-emerald-500 select-none"
            aria-label="Open 9jaKonet Support Assistant"
          >
            <div className="relative">
              {chatMode === 'live_support' ? (
                <Headphones className="h-6 w-6 text-white animate-pulse" />
              ) : (
                <Bot className="h-6 w-6 text-white" />
              )}
              <Sparkles className="h-3 w-3 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="font-bold text-sm tracking-wide pr-1">
              {chatMode === 'live_support' ? 'Live Support' : 'KonetBot'}
            </span>
            <span className="bg-emerald-900/60 text-[10px] text-emerald-200 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/40">
              {chatMode === 'live_support' ? 'Live Desk' : 'Active'}
            </span>
          </div>
        </div>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div 
          id="konetbot-chat-window"
          className="w-[92vw] sm:w-[410px] h-[550px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 pointer-events-auto"
        >
          {/* Header */}
          <div className={`text-white p-3.5 flex items-center justify-between shadow-md cursor-grab active:cursor-grabbing select-none transition-colors ${
            chatMode === 'live_support' 
              ? 'bg-gradient-to-r from-slate-950 via-emerald-900 to-slate-900' 
              : 'bg-gradient-to-r from-emerald-800 to-slate-900'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="relative h-10 w-10 rounded-full bg-emerald-600 border-2 border-white/40 flex items-center justify-center shrink-0 shadow-inner">
                {chatMode === 'live_support' ? (
                  <Headphones className="h-5 w-5 text-white" />
                ) : (
                  <Bot className="h-6 w-6 text-white" />
                )}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white tracking-tight">
                    {chatMode === 'live_support' ? '9jaKonet Live Support' : 'KonetBot'}
                  </h3>
                  {chatMode === 'live_support' ? (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                      ticketStatus === 'agent_active' 
                        ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/30' 
                        : 'bg-amber-500/30 text-amber-300 border-amber-400/30 animate-pulse'
                    }`}>
                      {ticketStatus === 'agent_active' ? 'Agent Joined' : 'Connecting...'}
                    </span>
                  ) : (
                    <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-emerald-400/30">
                      Official AI
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-200 flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {chatMode === 'live_support'
                    ? (assignedAgentName ? `Chatting with ${assignedAgentName}` : 'Support Desk Queue • Online')
                    : '9jaKonet Support Specialist • Online'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <div className="text-slate-400 p-1 mr-0.5" title="Drag to move chat anywhere">
                <GripHorizontal className="h-4 w-4 opacity-70" />
              </div>

              {chatMode === 'live_support' ? (
                <button
                  onClick={handleReturnToBot}
                  className="px-2 py-1 text-[11px] font-semibold bg-white/10 hover:bg-white/20 rounded-md text-emerald-200 hover:text-white transition-colors cursor-pointer mr-1"
                  title="Switch back to AI Bot"
                >
                  AI Mode
                </button>
              ) : (
                <button
                  id="konetbot-reset-button"
                  onClick={handleResetChat}
                  className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Restart conversation"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}

              <button
                id="konetbot-minimize-button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Minimize chat"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mode Switcher / Banner Bar */}
          {chatMode === 'bot' ? (
            <div className="bg-emerald-50 border-b border-emerald-200/80 px-3 py-2 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-900 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                <span className="text-[11px]">Instant answers about <strong>9jaKonet</strong>.</span>
              </div>

              <Button
                size="sm"
                onClick={() => handleConnectLiveAgent()}
                disabled={isConnectingAgent}
                className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] h-7 px-2.5 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Headphones className="h-3.5 w-3.5 text-emerald-400" />
                <span>Talk to Human</span>
              </Button>
            </div>
          ) : (
            <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 flex items-center justify-between gap-2 text-xs text-amber-900">
              <div className="flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-amber-700 animate-pulse shrink-0" />
                <span className="text-[11px] font-semibold">
                  {ticketStatus === 'agent_active' 
                    ? `Live chat active with ${assignedAgentName || 'Agent'}` 
                    : 'Connecting to support specialist...'}
                </span>
              </div>
              <button
                onClick={handleReturnToBot}
                className="text-[10px] text-amber-800 hover:text-amber-950 underline font-medium cursor-pointer"
              >
                End Live Chat
              </button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {chatMode === 'bot' ? (
              // Automated Bot Messages
              <>
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
              </>
            ) : (
              // Live Agent Messages
              <>
                {liveMessages.map((msg) => {
                  const isUser = msg.senderRole === 'user';
                  const isAgent = msg.senderRole === 'agent';
                  const isSystem = msg.senderRole === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-1.5">
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-medium px-3 py-1 rounded-full text-center max-w-[85%] shadow-2xs">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {isAgent && (
                        <div className="h-7 w-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                          <Headphones className="h-4 w-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-sm ${
                          isUser
                            ? 'bg-emerald-700 text-white rounded-tr-none'
                            : 'bg-white border border-emerald-300 text-slate-800 rounded-tl-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-[10px] font-bold ${isUser ? 'text-emerald-100' : 'text-emerald-800'}`}>
                            {isUser ? 'You' : (msg.senderName || 'Support Agent')}
                          </span>
                          <span className={`text-[9px] ${isUser ? 'text-emerald-200' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Waiting State Notice & WhatsApp Fallback */}
                {ticketStatus === 'waiting' && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-2 mt-2">
                    <div className="flex items-center gap-2 text-slate-800 text-xs font-semibold">
                      <Clock className="h-4 w-4 text-amber-600 animate-spin" />
                      <span>An agent is reviewing your inquiry...</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Average response time is 1–2 minutes. You can also chat with our dedicated WhatsApp Helpdesk immediately:
                    </p>
                    <a
                      href={formatWhatsAppUrl('08000000000', 'Hello 9jaKonet Support, I requested live assistance on the website.')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
                    >
                      <Phone className="h-3 w-3" />
                      <span>Direct WhatsApp Support</span>
                    </a>
                  </div>
                )}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ Suggestion Chips (Only in automated bot mode) */}
          {chatMode === 'bot' && (
            <div className="border-t border-slate-200 bg-white px-3 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3 text-slate-400" />
                  Quick Topics:
                </p>
                <button
                  type="button"
                  onClick={() => handleConnectLiveAgent()}
                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Headphones className="h-3 w-3" /> Speak with Agent
                </button>
              </div>
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
          )}

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
                placeholder={
                  chatMode === 'live_support'
                    ? 'Type message to 9jaKonet Live Agent...'
                    : 'Ask KonetBot or type "talk to agent"...'
                }
                disabled={isLoading || isConnectingAgent}
                className="flex-1 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white focus:outline-none rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors disabled:opacity-60"
              />
              <Button
                id="konetbot-send-button"
                type="submit"
                disabled={isLoading || isConnectingAgent || !inputText.trim()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-3.5 py-2.5 h-auto shrink-0 shadow-sm disabled:opacity-50"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">
              {chatMode === 'live_support' 
                ? '🟢 Connected to 9jaKonet Live Support Desk' 
                : 'KonetBot AI • Click "Talk to Human" anytime for personal assistance'}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
