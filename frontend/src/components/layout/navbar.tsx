'use client';

import * as React from 'react';
import { Search, Bell, Plus, Menu } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavbarProps {
  onToggleMobileDrawer?: () => void;
  onOpenSearch?: () => void;
}

export function Navbar({ onToggleMobileDrawer, onOpenSearch }: NavbarProps) {
  const { activeWorkspace } = useAuth();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (!activeWorkspace?.id) return;
    const refresh = () => Promise.all([
      apiFetch<{ count: number }>('/notifications/unread-count'),
      apiFetch<{ items: any[] }>('/notifications'),
    ]).then(([count, list]) => {
      setUnreadCount(count.count);
      setNotifications(list.items.slice(0, 8));
    }).catch(() => undefined);
    void refresh();
    const interval = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(interval);
  }, [activeWorkspace?.id]);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-dark-900/60 backdrop-blur-xl px-4 lg:px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Left Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button 
          onClick={onToggleMobileDrawer}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:border-slate-700 cursor-pointer transition-all shadow-inner group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            <span className="text-xs">Search projects, docs, tasks, or ask AI...</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-400">⌘</kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-400">K</kbd>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Presence Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>4 Active Now</span>
        </div>

        {/* Notifications */}
        <div className="relative">
        <button onClick={() => setNotificationsOpen((open) => !open)} aria-label="Notifications" className="relative p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-brand-500 text-[9px] text-white flex items-center justify-center">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </button>
        {notificationsOpen && <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-slate-700 bg-dark-900 p-2 shadow-2xl">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm font-semibold text-white">Notifications</span>
            <button className="text-xs text-brand-300" onClick={() => apiFetch('/notifications/read-all', { method: 'POST' }).then(() => { setUnreadCount(0); setNotifications((items) => items.map((item) => ({ ...item, isRead: true }))); })}>Mark all read</button>
          </div>
          {notifications.length === 0 ? <p className="p-3 text-xs text-slate-400">No notifications.</p> : notifications.map((item) => <button key={item.id} className={`block w-full rounded-lg p-2 text-left hover:bg-slate-800 ${item.isRead ? 'opacity-70' : ''}`} onClick={async () => { if (!item.isRead) { await apiFetch(`/notifications/${item.id}/read`, { method: 'PATCH' }); setUnreadCount((count) => Math.max(0, count - 1)); } setNotificationsOpen(false); if (item.link) router.push(item.link); }}>
            <div className="text-xs font-medium text-white">{item.title}</div><div className="mt-1 text-xs text-slate-400">{item.content}</div>
          </button>)}
          <Link href="/notifications" onClick={() => setNotificationsOpen(false)} className="block p-2 text-center text-xs text-brand-300">View all notifications</Link>
        </div>}
        </div>

        {/* Action Button */}
        <Button variant="gradient" size="sm" className="hidden sm:flex">
          <Plus className="w-4 h-4" />
          <span>New Entity</span>
        </Button>
      </div>
    </header>
  );
}
