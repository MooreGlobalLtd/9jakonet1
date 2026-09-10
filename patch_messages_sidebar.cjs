const fs = require('fs');
let file = fs.readFileSync('src/pages/Messages.tsx', 'utf-8');

const oldLink = `<div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-slate-900 truncate">{chat.otherUser?.displayName || 'Unknown User'}</h3>
                      {chat.lastMessageTime && (
                        <span className="text-xs text-slate-500">{new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>`;

const newLink = `<div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-slate-900 truncate">{chat.otherUser?.displayName || 'Unknown User'}</h3>
                      <div className="flex items-center gap-2">
                        {chat.lastSenderId !== user.id && chat.isRead === false && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        )}
                        {chat.lastMessageTime && (
                          <span className="text-xs text-slate-500">{new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    </div>`;

file = file.replace(oldLink, newLink);

fs.writeFileSync('src/pages/Messages.tsx', file);
