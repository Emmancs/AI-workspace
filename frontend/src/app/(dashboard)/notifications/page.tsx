'use client';

import * as React from 'react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const load = React.useCallback(async () => {
    try {
      const result = await apiFetch('/notifications');
      setNotifications(result.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function markRead(id: string) {
    await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
    await load();
  }

  async function markAllRead() {
    await apiFetch('/notifications/read-all', { method: 'POST' });
    await load();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Notifications</h1><p className="text-sm text-slate-400 mt-1">Workspace events that need your attention.</p></div><Button variant="outline" onClick={markAllRead}>Mark all read</Button></div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {loading ? <p className="text-slate-400">Loading notifications...</p> : notifications.length === 0 ? <Card><p className="text-sm text-slate-400">You have no notifications.</p></Card> : notifications.map((notification) => (
        <Card key={notification.id} className={notification.isRead ? 'opacity-70' : ''}>
          <div className="flex items-start justify-between gap-4"><div><button className="font-medium text-left text-white hover:text-brand-300" onClick={async () => { if (!notification.isRead) await markRead(notification.id); if (notification.link) router.push(notification.link); }}>{notification.title}</button><p className="text-sm text-slate-400 mt-1">{notification.content}</p><p className="text-xs text-slate-500 mt-2">{new Date(notification.createdAt).toLocaleString()}</p></div>{!notification.isRead && <Button size="sm" variant="ghost" onClick={() => markRead(notification.id)}>Mark read</Button>}</div>
        </Card>
      ))}
    </div>
  );
}
