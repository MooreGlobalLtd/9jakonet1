import React, { useState, useEffect, useRef } from 'react';
import { 
  SupportTicket, 
  SupportMessage, 
  User 
} from '../../types';
import { 
  subscribeToSupportTickets, 
  subscribeToTicketMessages, 
  sendLiveMessage, 
  assignAgentToTicket, 
  closeSupportTicket 
} from '../../lib/supportService';
import { 
  Headphones, 
  Clock, 
  CheckCircle2, 
  Send, 
  User as UserIcon, 
  MessageSquare, 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Check, 
  Sparkles, 
  AlertTriangle,
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';
import { Button } from '../ui/button';
import { formatDateTime } from '../../lib/utils';
import { formatWhatsAppUrl } from '../../lib/notifications';
import { toast } from 'sonner';

interface LiveSupportDeskProps {
  currentUser?: User | null;
}

export default function LiveSupportDesk({ currentUser }: LiveSupportDeskProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'agent_active' | 'resolved'>('all');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const agentDisplayName = currentUser?.displayName || 'Support Agent';

  const quickResponses = [
    { label: '👋 Greeting', text: `Hello! Welcome to 9jaKonet Support. My name is ${agentDisplayName}, how may I assist you today?` },
    { label: '🔒 Escrow Safety', text: 'On 9jaKonet, your funds are safely held in Paystack Escrow. The artisan is only paid after you verify the job and provide the 6-digit OTP code.' },
    { label: '🏦 Artisan Payout', text: 'Artisans receive their 90% net earnings immediately into their verified Nigerian bank account once the job is approved by the client.' },
    { label: '🔑 OTP Code Help', text: 'Please check your registered email inbox or spam folder for your 6-digit release code.' },
    { label: '✅ Resolution', text: 'I have looked into this and sorted it out for you. Is there anything else you need assistance with today?' }
  ];

  // 1. Subscribe to all support tickets
  useEffect(() => {
    const unsubscribe = subscribeToSupportTickets((loadedTickets) => {
      setTickets(loadedTickets);
      // Auto select first waiting or active ticket if none selected
      if (!selectedTicketId && loadedTickets.length > 0) {
        const waitingOne = loadedTickets.find(t => t.status === 'waiting') || loadedTickets[0];
        setSelectedTicketId(waitingOne.id);
      }
    });

    return () => unsubscribe();
  }, [selectedTicketId]);

  // 2. Subscribe to messages of the currently selected ticket
  useEffect(() => {
    if (!selectedTicketId) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToTicketMessages(selectedTicketId, (loadedMessages) => {
      setMessages(loadedMessages);
    });

    return () => unsubscribe();
  }, [selectedTicketId]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.userName?.toLowerCase().includes(q);
      const matchMsg = t.lastMessage?.toLowerCase().includes(q);
      const matchEmail = t.userEmail?.toLowerCase().includes(q);
      const matchPhone = t.userPhone?.toLowerCase().includes(q);
      return matchName || matchMsg || matchEmail || matchPhone;
    }
    return true;
  });

  const waitingCount = tickets.filter(t => t.status === 'waiting').length;
  const activeCount = tickets.filter(t => t.status === 'agent_active').length;

  const handleSendMessage = async (customText?: string) => {
    const text = customText || inputText.trim();
    if (!text || !selectedTicketId || isSending) return;

    setIsSending(true);
    try {
      const agentName = currentUser?.displayName || 'Support Lead';
      const agentId = currentUser?.id || 'admin-agent';

      // If ticket is still waiting, also auto-assign agent
      if (selectedTicket && selectedTicket.status === 'waiting') {
        await assignAgentToTicket(selectedTicketId, agentId, agentName);
      }

      await sendLiveMessage({
        ticketId: selectedTicketId,
        senderRole: 'agent',
        senderId: agentId,
        senderName: agentName,
        text
      });

      setInputText('');
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err: any) {
      toast.error('Failed to send response: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!selectedTicketId) return;
    try {
      const agentName = currentUser?.displayName || 'Support Lead';
      const agentId = currentUser?.id || 'admin-agent';
      await assignAgentToTicket(selectedTicketId, agentId, agentName);
      toast.success(`You joined the chat with ${selectedTicket?.userName}`);
    } catch (e: any) {
      toast.error('Error joining chat: ' + e.message);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicketId) return;
    try {
      const agentName = currentUser?.displayName || 'Support';
      await closeSupportTicket(selectedTicketId, agentName);
      toast.success('Support session marked as resolved.');
    } catch (e: any) {
      toast.error('Error resolving ticket: ' + e.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[750px] max-h-[82vh]">
      {/* Top Banner / Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-white">Live Support Desk</h2>
              <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Directly communicate with users and artisans chatting through KonetBot.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs text-slate-400">Waiting:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${waitingCount > 0 ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-700 text-slate-300'}`}>
              {waitingCount}
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs text-slate-400">Active:</span>
            <span className="text-xs font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs text-slate-400">Total:</span>
            <span className="text-xs font-bold text-white px-1">
              {tickets.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace: Left Queue + Right Chat */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Ticket Queue */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/70 shrink-0">
          {/* Search and Filters */}
          <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visitor, phone, or message..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All ({tickets.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('waiting')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${statusFilter === 'waiting' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'}`}
              >
                Waiting ({waitingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('agent_active')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${statusFilter === 'agent_active' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'}`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('resolved')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${statusFilter === 'resolved' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Resolved
              </button>
            </div>
          </div>

          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-1">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">No support tickets found</p>
                <p className="text-[11px] text-slate-400 mt-1">Visitors requesting an agent on KonetBot will show up here automatically.</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = ticket.id === selectedTicketId;
                const isWaiting = ticket.status === 'waiting';
                const isActive = ticket.status === 'agent_active';

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected 
                        ? 'bg-emerald-50/80 border-emerald-300 shadow-sm' 
                        : 'bg-white hover:bg-slate-50 border-slate-200/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {ticket.userName || 'Visitor'}
                        </span>
                        {ticket.userRole && (
                          <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                            ticket.userRole === 'artisan' ? 'bg-amber-100 text-amber-800' :
                            ticket.userRole === 'customer' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {ticket.userRole}
                          </span>
                        )}
                      </div>

                      {/* Status Pill */}
                      {isWaiting && (
                        <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-pulse">
                          <Clock className="h-2.5 w-2.5" />
                          Waiting
                        </span>
                      )}
                      {isActive && (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] px-1.5 py-0.5 rounded-full shrink-0">
                          Active
                        </span>
                      )}
                      {ticket.status === 'resolved' && (
                        <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full shrink-0">
                          Resolved
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-snug">
                      {ticket.lastMessage || 'Requested live support...'}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100/60 text-[10px] text-slate-400">
                      <span>{formatDateTime(ticket.updatedAt || ticket.createdAt)}</span>
                      {ticket.unreadByAdmin && (
                        <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block animate-ping"></span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Chat Window */}
        <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Active Ticket Header */}
              <div className="bg-white border-b border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    {selectedTicket.userName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">
                        {selectedTicket.userName}
                      </h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        selectedTicket.userRole === 'artisan' ? 'bg-amber-100 text-amber-800' :
                        selectedTicket.userRole === 'customer' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {selectedTicket.userRole || 'Visitor'}
                      </span>
                      {selectedTicket.status === 'waiting' && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-300">
                          Needs Agent
                        </span>
                      )}
                      {selectedTicket.status === 'agent_active' && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
                          Handled by {selectedTicket.assignedAgentName || 'Agent'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                      {selectedTicket.userEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {selectedTicket.userEmail}
                        </span>
                      )}
                      {selectedTicket.userPhone && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {selectedTicket.userPhone}
                        </span>
                      )}
                      <span>
                        Started: {formatDateTime(selectedTicket.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* WhatsApp contact button if phone available */}
                  {selectedTicket.userPhone && (
                    <a
                      href={formatWhatsAppUrl(selectedTicket.userPhone, `Hello ${selectedTicket.userName}, this is 9jaKonet Support regarding your live chat inquiry.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                      title="Open WhatsApp chat with this customer"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {selectedTicket.status === 'waiting' && (
                    <Button
                      onClick={handleAssignToMe}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Join &amp; Take Chat</span>
                    </Button>
                  )}

                  {selectedTicket.status === 'agent_active' && (
                    <Button
                      onClick={handleCloseTicket}
                      variant="outline"
                      className="text-xs h-8 px-3 border-slate-300 hover:bg-slate-100 flex items-center gap-1.5 text-slate-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Resolve &amp; Close</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/50">
                {messages.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-xs">No messages recorded in this conversation yet.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAgent = msg.senderRole === 'agent';
                    const isSystem = msg.senderRole === 'system';
                    const isUser = msg.senderRole === 'user' || msg.senderRole === 'bot';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center my-2">
                          <span className="bg-amber-100/80 text-amber-900 border border-amber-300/80 text-[11px] font-medium px-3 py-1 rounded-full text-center max-w-md shadow-2xs">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 ${isAgent ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isAgent && (
                          <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                            {msg.senderName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}

                        <div className={`max-w-[75%] rounded-2xl p-3 shadow-xs text-xs ${
                          isAgent 
                            ? 'bg-emerald-700 text-white rounded-tr-none' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                        }`}>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`font-bold text-[11px] ${isAgent ? 'text-emerald-100' : 'text-slate-900'}`}>
                              {isAgent ? (currentUser?.displayName || 'Support Lead') : msg.senderName}
                            </span>
                            <span className={`text-[10px] ${isAgent ? 'text-emerald-200' : 'text-slate-400'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        </div>

                        {isAgent && (
                          <div className="h-8 w-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                            <Headphones className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Canned Quick Responses */}
              <div className="border-t border-slate-200 bg-white px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" /> Quick Reply:
                </span>
                {quickResponses.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(qr.text)}
                    disabled={isSending || selectedTicket.status === 'resolved'}
                    className="whitespace-nowrap text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors shrink-0 disabled:opacity-50"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>

              {/* Reply Input Bar */}
              <div className="p-3 bg-white border-t border-slate-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      selectedTicket.status === 'resolved' 
                        ? 'This session is closed. Click "Join & Take Chat" or send a message to re-open.' 
                        : 'Type your message to the customer (they receive it live in KonetBot)...'
                    }
                    className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 transition-colors"
                  />
                  <Button
                    type="submit"
                    disabled={isSending || !inputText.trim()}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-4 py-2.5 h-auto shrink-0 shadow-xs flex items-center gap-1.5 text-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Reply</span>
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Headphones className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-sm text-slate-700">No Chat Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Select an active visitor conversation from the left queue to start responding live.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
