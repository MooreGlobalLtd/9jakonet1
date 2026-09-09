const fs = require('fs');
let file = fs.readFileSync('src/pages/Messages.tsx', 'utf-8');

// Update the [SYSTEM] rendering logic
const msgRender = `
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
                      <div key={msg.id} className={\`flex \${isMe ? 'justify-end' : 'justify-start'}\`}>
                        <div className={\`max-w-[75%] rounded-2xl px-4 py-2 \${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-sm'}\`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                          <p className={\`text-[10px] mt-1 text-right \${isMe ? 'text-emerald-200' : 'text-slate-400'}\`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })
`;

// Regex replace the old map loop
file = file.replace(/messages\.map\(msg => \{[\s\S]*?return \([\s\S]*?\}\)[\s\S]*?\}\)/, msgRender.trim());

// Also change the actual string that gets sent to be more professional:
file = file.replace(/\[SYSTEM\] I have created a new job offer: "\$\{title\}" for ₦\$\{amount\.toLocaleString\(\)\}\. I will fund the escrow now\./, '[SYSTEM] Job Offer Created: "${title}" for ₦${amount.toLocaleString()}. The customer is currently funding the Escrow Vault.');

fs.writeFileSync('src/pages/Messages.tsx', file);
console.log("Patched Messages.tsx");
