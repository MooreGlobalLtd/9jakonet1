import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { SupportTicket, SupportMessage } from '../types';

/**
 * Creates or retrieves an active live support ticket for a visitor/user.
 */
export async function requestLiveSupport(params: {
  userId?: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  userRole?: string;
  initialMessage?: string;
}): Promise<string> {
  try {
    const ticketsCol = collection(db, 'support_chats');
    const now = Date.now();

    // 1. Check if user already has an open ticket that is waiting or active
    if (params.userId) {
      const qExisting = query(
        ticketsCol,
        where('userId', '==', params.userId),
        where('status', 'in', ['waiting', 'agent_active']),
        limit(1)
      );
      const existingSnap = await getDocs(qExisting);
      if (!existingSnap.empty) {
        const existingDoc = existingSnap.docs[0];
        const existingId = existingDoc.id;
        
        // Post the new message into the existing ticket
        if (params.initialMessage) {
          await sendLiveMessage({
            ticketId: existingId,
            senderRole: 'user',
            senderId: params.userId,
            senderName: params.userName,
            text: params.initialMessage
          });
        }
        return existingId;
      }
    }

    // 2. Create new support ticket document
    const newTicketRef = doc(ticketsCol);
    const ticketId = newTicketRef.id;

    const initialText = params.initialMessage || 'Visitor requested a live support specialist.';

    const ticketData: SupportTicket = {
      id: ticketId,
      userId: params.userId || undefined,
      userName: params.userName || 'Guest Visitor',
      userEmail: params.userEmail || '',
      userPhone: params.userPhone || '',
      userRole: params.userRole || 'visitor',
      status: 'waiting',
      createdAt: now,
      updatedAt: now,
      lastMessage: initialText,
      lastSenderRole: 'user',
      unreadByAdmin: true,
      unreadByUser: false
    };

    await setDoc(newTicketRef, ticketData);

    // 3. Add initial welcome & user message in subcollection
    const messagesCol = collection(db, 'support_chats', ticketId, 'messages');
    
    // System message
    await addDoc(messagesCol, {
      ticketId,
      senderRole: 'system',
      senderName: '9jaKonet System',
      text: 'Support request received. Connecting you to an active 9jaKonet agent...',
      timestamp: now
    });

    // User message
    if (params.initialMessage) {
      await addDoc(messagesCol, {
        ticketId,
        senderRole: 'user',
        senderId: params.userId || undefined,
        senderName: params.userName || 'Visitor',
        text: params.initialMessage,
        timestamp: now + 50
      });
    }

    // 4. Alert Admin via Firestore notifications collection
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: 'ADMIN',
        title: '🎧 Live Support Request!',
        body: `${params.userName} (${params.userRole || 'Visitor'}) needs assistance: "${initialText.slice(0, 70)}"`,
        link: '/admin',
        type: 'support_request',
        read: false,
        createdAt: now
      });

      // Also invoke server push endpoint to trigger phones
      fetch('/api/push/send-to-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🎧 Live Support Request on 9jaKonet',
          body: `${params.userName} is waiting for an agent on KonetBot.`,
          link: '/admin',
          tag: 'support-alert'
        })
      }).catch(() => {});
    } catch (e) {
      console.warn('Failed to notify admin of support request:', e);
    }

    return ticketId;
  } catch (error) {
    console.error('Error creating support ticket:', error);
    throw error;
  }
}

/**
 * Sends a message in an existing support ticket session
 */
export async function sendLiveMessage(params: {
  ticketId: string;
  senderRole: 'user' | 'agent' | 'bot' | 'system';
  senderId?: string;
  senderName: string;
  text: string;
}): Promise<void> {
  const { ticketId, senderRole, senderId, senderName, text } = params;
  const now = Date.now();

  try {
    const messagesCol = collection(db, 'support_chats', ticketId, 'messages');
    await addDoc(messagesCol, {
      ticketId,
      senderRole,
      senderId: senderId || null,
      senderName,
      text,
      timestamp: now
    });

    // Update parent ticket metadata
    const ticketRef = doc(db, 'support_chats', ticketId);
    await updateDoc(ticketRef, {
      lastMessage: text,
      lastSenderRole: senderRole,
      updatedAt: now,
      unreadByAdmin: senderRole === 'user',
      unreadByUser: senderRole === 'agent'
    });
  } catch (error) {
    console.error('Error sending support message:', error);
    throw error;
  }
}

/**
 * Assigns an admin/agent to an active ticket and marks it agent_active
 */
export async function assignAgentToTicket(
  ticketId: string, 
  agentId: string, 
  agentName: string
): Promise<void> {
  const now = Date.now();
  try {
    const ticketRef = doc(db, 'support_chats', ticketId);
    await updateDoc(ticketRef, {
      status: 'agent_active',
      assignedAgentId: agentId,
      assignedAgentName: agentName,
      unreadByAdmin: false,
      updatedAt: now
    });

    // Post system announcement
    const messagesCol = collection(db, 'support_chats', ticketId, 'messages');
    await addDoc(messagesCol, {
      ticketId,
      senderRole: 'system',
      senderName: '9jaKonet Support',
      text: `🎧 ${agentName} has joined the conversation to assist you.`,
      timestamp: now
    });
  } catch (error) {
    console.error('Error assigning agent to ticket:', error);
    throw error;
  }
}

/**
 * Marks a ticket as resolved/closed
 */
export async function closeSupportTicket(
  ticketId: string, 
  closedByName: string = 'Support'
): Promise<void> {
  const now = Date.now();
  try {
    const ticketRef = doc(db, 'support_chats', ticketId);
    await updateDoc(ticketRef, {
      status: 'resolved',
      updatedAt: now,
      unreadByAdmin: false,
      unreadByUser: false
    });

    // Post resolution notice
    const messagesCol = collection(db, 'support_chats', ticketId, 'messages');
    await addDoc(messagesCol, {
      ticketId,
      senderRole: 'system',
      senderName: '9jaKonet Support',
      text: `✅ This support session was closed by ${closedByName}. If you have more questions, feel free to start a new chat anytime!`,
      timestamp: now
    });
  } catch (error) {
    console.error('Error closing support ticket:', error);
    throw error;
  }
}

/**
 * Real-time listener for messages in a ticket
 */
export function subscribeToTicketMessages(
  ticketId: string, 
  callback: (messages: SupportMessage[]) => void
): () => void {
  const messagesCol = collection(db, 'support_chats', ticketId, 'messages');
  const q = query(messagesCol, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const list: SupportMessage[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SupportMessage));
    callback(list);
  }, (err) => {
    console.warn('Error subscribing to ticket messages:', err);
  });
}

/**
 * Real-time listener for all tickets (for the Admin console)
 */
export function subscribeToSupportTickets(
  callback: (tickets: SupportTicket[]) => void
): () => void {
  const ticketsCol = collection(db, 'support_chats');
  const q = query(ticketsCol, orderBy('updatedAt', 'desc'), limit(50));

  return onSnapshot(q, (snapshot) => {
    const list: SupportTicket[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SupportTicket));
    callback(list);
  }, (err) => {
    console.warn('Error subscribing to support tickets:', err);
  });
}

/**
 * Appoints a user as an authorized Live Support Agent
 */
export async function appointUserAsSupportAgent(params: {
  userId: string;
  userName: string;
  userEmail: string;
  appointedByName: string;
}): Promise<void> {
  const userRef = doc(db, 'users', params.userId);
  const now = Date.now();

  await updateDoc(userRef, {
    isSupportAgent: true,
    role: 'support_agent',
    supportAgentApprovedAt: now,
    supportAgentApprovedBy: params.appointedByName
  });

  // Notify the user in app
  const notifRef = collection(db, 'notifications');
  await addDoc(notifRef, {
    userId: params.userId,
    title: '🎧 Appointed as Live Support Agent!',
    body: `Hello ${params.userName}, you have been appointed as an official 9jaKonet Live Support Agent by ${params.appointedByName}. You can now answer customer chats directly at the Live Support Desk.`,
    createdAt: now,
    isRead: false,
    link: '/support-desk'
  });
}

/**
 * Revokes Live Support Agent privileges from a user
 */
export async function revokeUserSupportAgent(params: {
  userId: string;
  fallbackRole: 'customer' | 'artisan';
  revokedByName: string;
}): Promise<void> {
  const userRef = doc(db, 'users', params.userId);
  const now = Date.now();

  await updateDoc(userRef, {
    isSupportAgent: false,
    role: params.fallbackRole
  });

  // Notify user
  const notifRef = collection(db, 'notifications');
  await addDoc(notifRef, {
    userId: params.userId,
    title: 'Support Agent Access Concluded',
    body: `Your Live Support Agent access on 9jaKonet has been updated by ${params.revokedByName}. Your account has returned to ${params.fallbackRole} role.`,
    createdAt: now,
    isRead: false,
    link: '/dashboard'
  });
}
