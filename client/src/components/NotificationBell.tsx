import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../utils/api';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      // Silent fail on background poll
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative text-xl p-2 rounded-full hover:bg-gray-100"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-lg border border-gray-100 z-20 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-sm">Notifications</p>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-brand-700 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            {loading && notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 text-sm border-b border-gray-50 ${!n.read ? 'bg-brand-50' : ''}`}>
                  <p className="text-gray-800">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('en-KE')}</p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
