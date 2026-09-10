const fs = require('fs');
let file = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf-8');

// We need to fetch chats if user is logged in
if (!file.includes('unreadChatsCount')) {
  const imports = `import { useState, useEffect } from 'react';\nimport { collection, query, where, onSnapshot } from 'firebase/firestore';\nimport { db } from '../../lib/firebase';`;
  
  if (file.includes('import { useState } from \'react\';')) {
     file = file.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';\nimport { collection, query, where, onSnapshot } from 'firebase/firestore';\nimport { db } from '../../lib/firebase';");
  }

  const hookStr = `const { user, signOut } = useAuthStore();
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadChatsCount(0);
      return;
    }
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.lastSenderId && data.lastSenderId !== user.id && data.isRead === false) {
          count++;
        }
      });
      setUnreadChatsCount(count);
    });
    return () => unsubscribe();
  }, [user]);`;

  file = file.replace('const { user, signOut } = useAuthStore();', hookStr);

  // Replace Messages link with badge
  const linkDesktop = `<Link to="/messages" className="relative hover:text-emerald-600">
                Messages
                {unreadChatsCount > 0 && (
                  <span className="absolute -top-2 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadChatsCount}
                  </span>
                )}
              </Link>`;
  file = file.replace(/<Link to="\/messages" className="hover:text-emerald-600">Messages<\/Link>/g, linkDesktop);

  const linkMobile = `<Link to="/messages" onClick={closeMenu} className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between">
                <span>Messages</span>
                {unreadChatsCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadChatsCount}
                  </span>
                )}
              </Link>`;
  file = file.replace(/<Link to="\/messages" onClick=\{closeMenu\} className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50">\s*Messages\s*<\/Link>/g, linkMobile);

  fs.writeFileSync('src/components/layout/Navbar.tsx', file);
}
