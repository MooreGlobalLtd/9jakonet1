import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Chat, Message, User } from '../types';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Send, UserCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { sendEmail } from '../lib/email';
import { isQuotaExhausted, markQuotaExhausted } from '../lib/quotaManager';

export default function Messages() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [chats, setChats] = useState<(Chat & { otherUser?: User })[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(searchParams.get('chat'));
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync URL parameter with state
  useEffect(() => {
    if (activeChat) {
      setSearchParams({ chat: activeChat });
    } else {
      setSearchParams({});
    }
  }, [activeChat, setSearchParams]);

  // Fetch user's chats
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.id),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatPromises = snapshot.docs.map(async (chatDoc) => {
        const chatData = { id: chatDoc.id, ...chatDoc.data() } as Chat;
        
        // Find the other participant's ID
        const otherUserId = chatData.participants.find(p => p !== user.id);
        let otherUser: User | undefined;
        
        if (otherUserId) {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            otherUser = { id: userDoc.id, ...userDoc.data() } as User;
          }
        }
        return { ...chatData, otherUser };
      });

      const resolvedChats = await Promise.all(chatPromises);
      setChats(resolvedChats);
    }, (err) => {
      console.warn('Chats listener notice:', err?.message || err);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'chats', activeChat, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (err) => {
      console.warn('Messages listener notice:', err?.message || err);
    });

    return () => unsubscribe();
  }, [activeChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeChat || !newMessage.trim()) return;

    if (isQuotaExhausted()) {
      alert("System quota limit reached for today. Messages cannot be sent at this time.");
      return;
    }

    try {
      const msgText = newMessage.trim();
      setNewMessage(''); // optimistic clear
      
      // Add message to subcollection
      await addDoc(collection(db, 'chats', activeChat, 'messages'), {
        chatId: activeChat,
        senderId: user.id,
        text: msgText,
        createdAt: Date.now()
      });

      // Update parent chat document
      await updateDoc(doc(db, 'chats', activeChat), {
        lastMessage: msgText,
        lastMessageTime: Date.now(),
        updatedAt: Date.now()
      });
      
      // Send Email Notification
      const activeChatDetails = chats.find(c => c.id === activeChat);
      if (activeChatDetails && activeChatDetails.otherUser && activeChatDetails.otherUser.email) {
        sendEmail({
          to: activeChatDetails.otherUser.email,
          subject: `New Message from ${user.displayName}`,
          html: `
            <h2>You have a new message!</h2>
            <p><strong>${user.displayName}</strong> sent you a message on 9jaKonet:</p>
            <blockquote style="border-left: 4px solid #10b981; padding-left: 16px; margin-left: 0; color: #475569;">
              "${msgText}"
            </blockquote>
            <br/>
            <p><a href="https://connect.mooregloballtd.online/messages?chat=${activeChat}">Log in to reply</a></p>
          `
        });
      }

    } catch (error: any) {
      if (error?.code === 'resource-exhausted' || error?.message?.includes('quota')) {
        markQuotaExhausted();
        alert("System quota limit reached for today. Messages cannot be sent at this time.");
      }
      console.error("Error sending message:", error);
    }
  };

  const activeChatDetails = chats.find(c => c.id === activeChat);

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 h-[calc(100vh-140px)]">
      <Card className="flex h-full overflow-hidden border-slate-200">
        
        {/* Chat List (Sidebar) */}
        <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col border-r border-slate-200 bg-slate-50`}>
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="text-xl font-bold text-slate-900">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No conversations yet.</div>
            ) : (
              chats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat.id)}
                  className={`w-full flex items-center gap-3 border-b border-slate-100 p-4 text-left transition-colors hover:bg-slate-100 ${activeChat === chat.id ? 'bg-emerald-50 hover:bg-emerald-50' : 'bg-white'}`}
                >
                  {chat.otherUser?.avatar ? (
                    <img src={chat.otherUser.avatar} className="h-12 w-12 rounded-full object-cover" alt="avatar" />
                  ) : (
                    <UserCircle className="h-12 w-12 text-slate-400" />
                  )}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-slate-900 truncate">{chat.otherUser?.displayName || 'Unknown User'}</h3>
                      {chat.lastMessageTime && (
                        <span className="text-xs text-slate-500">{new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">{chat.lastMessage || 'No messages yet'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${!activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-col bg-white`}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 border-b border-slate-200 p-4">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setActiveChat(null)}>
                  &larr; Back
                </Button>
                {activeChatDetails?.otherUser?.avatar ? (
                  <img src={activeChatDetails.otherUser.avatar} className="h-10 w-10 rounded-full" alt="avatar" />
                ) : (
                  <UserCircle className="h-10 w-10 text-slate-400" />
                )}
                <div>
                  <h3 className="font-semibold text-slate-900">{activeChatDetails?.otherUser?.displayName}</h3>
                  <p className="text-xs text-emerald-600 capitalize">{activeChatDetails?.otherUser?.role}</p>
                </div>
                
                {/* Job Offer Button */}
                {(user.role === 'customer' || user.role === 'admin') && activeChatDetails?.otherUser && (
                  <div className="ml-auto">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        // Quick fallback to simple inline UI since prompt is blocked
                        const jobForm = document.getElementById('quick-job-form');
                        if (jobForm) {
                           jobForm.classList.toggle('hidden');
                        }
                      }}
                      className="bg-slate-900 hover:bg-slate-800"
                    >
                      Create Job Offer
                    </Button>
                  </div>
                )}
              </div>

              {/* Inline Job Creation Form */}
              <div id="quick-job-form" className="hidden border-b border-slate-200 p-4 bg-emerald-50">
                <h4 className="text-sm font-semibold mb-2">Create New Job Offer</h4>
                <div className="flex gap-2">
                  <Input id="job-title-input" placeholder="Job Title (e.g. Fix AC)" className="flex-1 bg-white" />
                  <Input id="job-amount-input" type="number" min="100" placeholder="Amount (min ₦100)" className="w-36 bg-white" />
                  <Button 
                    size="sm"
                    onClick={() => {
                      const titleInput = document.getElementById('job-title-input') as HTMLInputElement;
                      const amountInput = document.getElementById('job-amount-input') as HTMLInputElement;
                      
                      const title = titleInput?.value;
                      const amount = parseInt(amountInput?.value || '0');
                      
                      if (!title) {
                        alert('Please enter a job title');
                        return;
                      }
                      if (!amount || amount < 100) {
                        alert('Amount must be at least ₦100 for Paystack to activate Bank Transfer, OPay, and all payment methods.');
                        return;
                      }

                      if (isQuotaExhausted()) {
                        alert("System quota limit reached for today. Job offers cannot be created right now.");
                        return;
                      }

                      // Create Escrow Job
                      addDoc(collection(db, 'jobs'), {
                        customerId: user.id,
                        customerName: user.displayName,
                        artisanId: activeChatDetails.otherUser!.id,
                        artisanName: activeChatDetails.otherUser!.displayName,
                        title,
                        amount,
                        status: 'pending_escrow',
                        createdAt: Date.now()
                      }).then(() => {
                        // Send Email Notification
                        if (activeChatDetails.otherUser?.email) {
                          sendEmail({
                            to: activeChatDetails.otherUser.email,
                            subject: `New Job Offer: ${title}`,
                            html: `
                              <h2>New Job Offer!</h2>
                              <p>Hi ${activeChatDetails.otherUser.displayName},</p>
                              <p><strong>${user.displayName}</strong> just sent you a new job offer for <strong>"${title}"</strong>.</p>
                              <p>The proposed amount is <strong>₦${amount.toLocaleString()}</strong>.</p>
                              <br/>
                              <p><a href="https://connect.mooregloballtd.online/jobs">Log in to view the offer</a> and wait for the escrow to be funded before starting work!</p>
                            `
                          });
                        }

                        // Send system message
                        addDoc(collection(db, 'chats', activeChat, 'messages'), {
                          chatId: activeChat,
                          senderId: user.id,
                          text: `[SYSTEM] Job Offer Created: "${title}" for ₦${amount.toLocaleString()}. The customer is currently funding the Escrow Vault.`,
                          createdAt: Date.now()
                        });
                        
                        // Hide form and clear
                        document.getElementById('quick-job-form')?.classList.add('hidden');
                        titleInput.value = '';
                        amountInput.value = '';
                      }).catch((err: any) => {
                        if (err?.code === 'resource-exhausted' || err?.message?.includes('quota')) {
                          markQuotaExhausted();
                          alert("System quota limit reached for today. Job offers cannot be created right now.");
                        } else {
                          console.error("Job creation failed", err);
                          alert("Failed to send job offer.");
                        }
                      });
                    }}
                  >
                    Send Offer
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-500 mt-10">Start the conversation!</div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderId === user.id;
                    const isSystem = msg.text.startsWith('[SYSTEM]');
                    
                    if (isSystem) {
                      const cleanText = msg.text.replace('[SYSTEM]', '').trim();
                      return (
                        <div key={msg.id} className="flex justify-center my-4">
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium px-4 py-2 rounded-xl text-center shadow-sm max-w-[85%]">
                            🤝 {cleanText}
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-sm'}`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                          <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-200 p-4 bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-50"
                  />
                  <Button type="submit" disabled={!newMessage.trim()} className="px-4">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
