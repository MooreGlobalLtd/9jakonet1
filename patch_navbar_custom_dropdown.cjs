const fs = require('fs');
let file = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf-8');

// Revert the popover imports
file = file.replace(/import \{ Popover, PopoverContent, PopoverTrigger \} from '\.\.\/ui\/popover';\n/, "");

// Revert the popover markup
const desktopNavTarget = `<Popover onOpenChange={(open) => { if (open) markNotifsAsRead(); }}>
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
              </Popover>`;

const customDropdownMarkup = `              <div className="relative group">
                <button 
                  onMouseEnter={markNotifsAsRead}
                  className="relative p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white"></span>
                  )}
                </button>
                
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right z-50">
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
                </div>
              </div>`;

file = file.replace(desktopNavTarget, customDropdownMarkup);
fs.writeFileSync('src/components/layout/Navbar.tsx', file);
