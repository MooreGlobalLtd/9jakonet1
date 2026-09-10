const fs = require('fs');
let file = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf-8');

if (!file.includes("Bell")) {
    file = file.replace(/ShieldAlert \} from 'lucide-react';/, "ShieldAlert, Bell, CheckCircle2 } from 'lucide-react';");
}

if (!file.includes("import { Popover")) {
    file = file.replace(/import \{ Button \} from '\.\.\/ui\/button';/, "import { Button } from '../ui/button';\nimport { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';");
}

// Add state for notifications
const stateTarget = `  const [unreadChatsCount, setUnreadChatsCount] = useState(0);`;

const stateReplacement = `  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [notifications, setNotifications] = useState<{id: string, text: string, time: number, isRead: boolean, link: string}[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);`;

if (!file.includes("const [notifications")) {
    file = file.replace(stateTarget, stateReplacement);
}

const effectTarget = `  useEffect(() => {
    if (!user) {
      setUnreadChatsCount(0);
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.id)
    );`;

const effectReplacement = `  useEffect(() => {
    if (!user) {
      setUnreadChatsCount(0);
      setNotifications([]);
      setUnreadNotifCount(0);
      return;
    }

    // 1. Unread Chats
    const qChats = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.id)
    );

    const unsubscribeChats = onSnapshot(qChats, (snapshot) => {
      let count = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.lastSenderId && data.lastSenderId !== user.id && data.isRead === false) {
          count++;
        }
      });
      setUnreadChatsCount(count);
    });

    // 2. Real-time Notifications (Escrows)
    const fieldQuery = user.role === 'customer' ? 'customerId' : 'artisanId';
    const qEscrows = query(collection(db, 'escrows'), where(fieldQuery, '==', user.id));
    
    const unsubscribeEscrows = onSnapshot(qEscrows, (snapshot) => {
       const notifs: any[] = [];
       snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'pending_escrow') {
             notifs.push({
               id: doc.id + '_pending',
               text: user.role === 'customer' ? \`Fund escrow for \${data.title}\` : \`Customer created escrow for \${data.title}\`,
               time: data.createdAt,
               isRead: false,
               link: '/jobs'
             });
          }
          if (data.status === 'in_progress' && user.role === 'artisan') {
             notifs.push({
               id: doc.id + '_progress',
               text: \`Escrow funded for \${data.title}! You can start working.\`,
               time: data.createdAt + 1000,
               isRead: false,
               link: '/jobs'
             });
          }
          if (data.status === 'completed') {
             notifs.push({
               id: doc.id + '_completed',
               text: \`Job \${data.title} marked completed. Funds released.\`,
               time: data.createdAt + 2000,
               isRead: false,
               link: '/wallet'
             });
          }
       });
       
       // Sort by time descending
       notifs.sort((a, b) => b.time - a.time);
       setNotifications(notifs.slice(0, 5));
       setUnreadNotifCount(notifs.filter(n => !n.isRead).length);
    });

    return () => {
      unsubscribeChats();
      unsubscribeEscrows();
    };
  }, [user]);

  const markNotifsAsRead = () => {
     setUnreadNotifCount(0);
     setNotifications(prev => prev.map(n => ({...n, isRead: true})));
  };`;

file = file.replace(/  useEffect\(\(\) => \{[\s\S]*?return \(\) => unsubscribe\(\);\n  \}, \[user\]\);/, effectReplacement);

// Render Bell Desktop
const desktopNavTarget = `              <Link to="/wallet" className="flex items-center rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-200 transition-colors">`;

const desktopNavReplacement = `              <Popover onOpenChange={(open) => { if (open) markNotifsAsRead(); }}>
                <PopoverTrigger asChild>
                  <button className="relative p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition-colors">
                    <Bell className="h-5 w-5" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white"></span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 mr-4 mt-2 border-slate-200 shadow-lg rounded-xl overflow-hidden" align="end">
                  <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    <span className="text-xs text-slate-500">{notifications.length} Recent</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-500">
                        <Bell className="h-8 w-8 mx-auto text-slate-300 mb-2 opacity-50" />
                        No new notifications
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {notifications.map((notif) => (
                          <Link 
                            key={notif.id} 
                            to={notif.link}
                            className={\`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors flex gap-3 items-start \${notif.isRead ? 'opacity-70' : 'bg-emerald-50/30'}\`}
                          >
                            <div className="mt-0.5 rounded-full bg-emerald-100 p-1.5 shrink-0">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800 leading-snug">{notif.text}</p>
                              <p className="text-xs text-slate-400 mt-1">{new Date(notif.time).toLocaleDateString()}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                    <Link to="/dashboard" className="block text-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 p-2">
                      View Dashboard
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>

              <Link to="/wallet" className="flex items-center rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-200 transition-colors">`;

file = file.replace(desktopNavTarget, desktopNavReplacement);

fs.writeFileSync('src/components/layout/Navbar.tsx', file);
