const fs = require('fs');
let file = fs.readFileSync('src/pages/Messages.tsx', 'utf-8');

// Modify the updateDoc for the chat parent
const oldUpdate = `await updateDoc(doc(db, 'chats', activeChat), {
        lastMessage: msgText,
        lastMessageTime: Date.now(),
        updatedAt: Date.now()
      });`;

const newUpdate = `const chatRef = doc(db, 'chats', activeChat);
      await updateDoc(chatRef, {
        lastMessage: msgText,
        lastMessageTime: Date.now(),
        updatedAt: Date.now(),
        // Simple unread trick: store the ID of the last sender and a flag
        lastSenderId: user.id,
        isRead: false
      });`;

file = file.replace(oldUpdate, newUpdate);

// Now, when the user opens a chat or receives a message in an active chat, mark it as read
const markReadLogic = `
  useEffect(() => {
    if (!activeChat || !user) return;
    
    // Mark as read if the current user is not the last sender
    const currentChat = chats.find(c => c.id === activeChat);
    if (currentChat && currentChat.lastSenderId !== user.id && currentChat.isRead === false) {
      updateDoc(doc(db, 'chats', activeChat), {
        isRead: true
      }).catch(console.error);
    }
  }, [activeChat, chats, user]);
`;

// Insert after the useEffect that fetches messages
file = file.replace(/return \(\) => unsubscribe\(\);\n  }, \[activeChat\]\);/g, "return () => unsubscribe();\n  }, [activeChat]);\n" + markReadLogic);

fs.writeFileSync('src/pages/Messages.tsx', file);
