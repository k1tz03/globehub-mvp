"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import type { Notification, NotificationType, NotificationSettings } from "@/lib/useNotificationStore";

// Icônes et couleurs par type
const NOTIF_ICONS: Record<NotificationType, { emoji: string; color: string; bg: string }> = {
  like: { emoji: "❤️", color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-950/50" },
  comment: { emoji: "💬", color: "text-sky-500", bg: "bg-sky-100 dark:bg-sky-950/50" },
  follow: { emoji: "👤", color: "text-fuchsia-500", bg: "bg-fuchsia-100 dark:bg-fuchsia-950/50" },
  mention: { emoji: "📢", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-950/50" },
  milestone: { emoji: "🎉", color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-950/50" },
  featured: { emoji: "⭐", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-950/50" },
};

// Toast de notification
interface NotificationToastProps {
  notification: Notification;
  onDismiss: () => void;
  onClick?: () => void;
}

export function NotificationToast({ notification, onDismiss, onClick }: NotificationToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const config = NOTIF_ICONS[notification.type];

  useEffect(() => {
    // Entrée
    setTimeout(() => setVisible(true), 10);

    // Auto-dismiss après 5s
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={clsx(
        "pointer-events-auto w-80 rounded-2xl bg-white p-4 shadow-2xl transition-all duration-300 dark:bg-neutral-900",
        visible && !exiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={clsx("flex h-10 w-10 items-center justify-center rounded-full text-lg", config.bg)}>
          {config.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{notification.title}</p>
          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{notification.message}</p>
          <p className="text-[10px] text-neutral-400 mt-1">À l&apos;instant</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Container de toasts
interface ToastContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function ToastContainer({ notifications, onDismiss, onNotificationClick }: ToastContainerProps) {
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 flex flex-col gap-3">
      {notifications.slice(0, 3).map(notif => (
        <NotificationToast
          key={notif.id}
          notification={notif}
          onDismiss={() => onDismiss(notif.id)}
          onClick={() => onNotificationClick?.(notif)}
        />
      ))}
    </div>
  );
}

// Cloche de notification
interface NotificationBellProps {
  count: number;
  onClick: () => void;
}

export function NotificationBell({ count, onClick }: NotificationBellProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 500);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return (
    <button
      onClick={onClick}
      className="relative rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
    >
      <svg
        className={clsx("h-6 w-6 transition-transform", animate && "animate-wiggle")}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {count > 0 && (
        <span className={clsx(
          "absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-fuchsia-500 px-1 text-xs font-bold text-white transition-transform",
          animate && "scale-125"
        )}>
          {count > 99 ? "99+" : count}
        </span>
      )}

      <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.3s ease-in-out;
        }
      `}</style>
    </button>
  );
}

// Panel de notifications
interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationPanel({
  open,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNotificationClick,
}: NotificationPanelProps) {
  if (!open) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const timeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return "À l'instant";
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    return `Il y a ${Math.floor(seconds / 86400)}j`;
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed right-4 top-16 z-50 w-96 max-h-[80vh] rounded-2xl bg-white shadow-2xl dark:bg-neutral-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-fuchsia-500 px-1.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={onMarkAllAsRead} className="text-xs text-fuchsia-500 hover:underline">
                Tout marquer lu
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Liste */}
        <div className="overflow-y-auto max-h-[calc(80vh-56px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <span className="text-4xl mb-2">🔔</span>
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            notifications.map(notif => {
              const config = NOTIF_ICONS[notif.type];
              return (
                <div
                  key={notif.id}
                  className={clsx(
                    "group flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border-b border-neutral-100 dark:border-neutral-800 last:border-0",
                    !notif.read && "bg-fuchsia-50/50 dark:bg-fuchsia-950/20"
                  )}
                  onClick={() => {
                    if (!notif.read) onMarkAsRead(notif.id);
                    onNotificationClick?.(notif);
                  }}
                >
                  <div className={clsx("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg", config.bg)}>
                    {config.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={clsx("text-sm", !notif.read && "font-semibold")}>{notif.title}</p>
                      {!notif.read && <span className="h-2 w-2 rounded-full bg-fuchsia-500" />}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-neutral-400 mt-1">{timeAgo(notif.timestamp)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(notif.id);
                    }}
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-opacity"
                  >
                    <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

// Paramètres des notifications
interface NotificationSettingsProps {
  settings: NotificationSettings;
  onSave: (settings: NotificationSettings) => void;
  onRequestPush: () => Promise<boolean>;
}

export function NotificationSettingsPanel({ settings, onSave, onRequestPush }: NotificationSettingsProps) {
  const [pushRequesting, setPushRequesting] = useState(false);

  const toggle = (key: keyof NotificationSettings) => {
    onSave({ ...settings, [key]: !settings[key] });
  };

  const handlePushRequest = async () => {
    setPushRequesting(true);
    await onRequestPush();
    setPushRequesting(false);
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Notifications</h4>

      {/* Master toggle */}
      <label className="flex items-center justify-between">
        <span className="text-sm">Activer les notifications</span>
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={() => toggle("enabled")}
          className="h-5 w-10 appearance-none rounded-full bg-neutral-300 transition-colors checked:bg-fuchsia-500 relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-5"
        />
      </label>

      {settings.enabled && (
        <>
          <div className="h-px bg-neutral-200 dark:bg-neutral-700" />

          {/* Types */}
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm">❤️ Likes</span>
              <input type="checkbox" checked={settings.likes} onChange={() => toggle("likes")} className="h-5 w-10 appearance-none rounded-full bg-neutral-300 transition-colors checked:bg-fuchsia-500 relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-5" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm">💬 Commentaires</span>
              <input type="checkbox" checked={settings.comments} onChange={() => toggle("comments")} className="h-5 w-10 appearance-none rounded-full bg-neutral-300 transition-colors checked:bg-fuchsia-500 relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-5" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm">👤 Nouveaux followers</span>
              <input type="checkbox" checked={settings.follows} onChange={() => toggle("follows")} className="h-5 w-10 appearance-none rounded-full bg-neutral-300 transition-colors checked:bg-fuchsia-500 relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-5" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm">📢 Mentions</span>
              <input type="checkbox" checked={settings.mentions} onChange={() => toggle("mentions")} className="h-5 w-10 appearance-none rounded-full bg-neutral-300 transition-colors checked:bg-fuchsia-500 relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-5" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm">🎉 Milestones</span>
              <input type="checkbox" checked={settings.milestones} onChange={() => toggle("milestones")} className="h-5 w-10 appearance-none rounded-full bg-neutral-300 transition-colors checked:bg-fuchsia-500 relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-5" />
            </label>
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-700" />

          {/* Son et Push */}
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm">🔊 Son</span>
              <input type="checkbox" checked={settings.sound} onChange={() => toggle("sound")} className="h-5 w-10 appearance-none rounded-full bg-neutral-300 transition-colors checked:bg-fuchsia-500 relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-5" />
            </label>

            <div className="flex items-center justify-between">
              <span className="text-sm">📱 Notifications push</span>
              {settings.pushEnabled ? (
                <span className="text-xs text-emerald-500">Activé ✓</span>
              ) : (
                <button
                  onClick={handlePushRequest}
                  disabled={pushRequesting}
                  className="text-xs text-fuchsia-500 hover:underline disabled:opacity-50"
                >
                  {pushRequesting ? "..." : "Activer"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
