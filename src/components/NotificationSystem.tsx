"use client";

import { useState, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { timeAgo } from "@/lib/time";
import type { Notification, NotificationType } from "@/lib/types";

// Icônes et couleurs par type de notification
const NOTIFICATION_CONFIG: Record<NotificationType, { icon: string; color: string; bgColor: string }> = {
  like: { icon: "❤️", color: "text-rose-500", bgColor: "bg-rose-100 dark:bg-rose-950/50" },
  comment: { icon: "💬", color: "text-sky-500", bgColor: "bg-sky-100 dark:bg-sky-950/50" },
  follow: { icon: "👤", color: "text-fuchsia-500", bgColor: "bg-fuchsia-100 dark:bg-fuchsia-950/50" },
  mention: { icon: "📢", color: "text-amber-500", bgColor: "bg-amber-100 dark:bg-amber-950/50" },
  message: { icon: "✉️", color: "text-emerald-500", bgColor: "bg-emerald-100 dark:bg-emerald-950/50" },
  report_resolved: { icon: "✅", color: "text-teal-500", bgColor: "bg-teal-100 dark:bg-teal-950/50" },
  post_featured: { icon: "⭐", color: "text-amber-500", bgColor: "bg-amber-100 dark:bg-amber-950/50" },
  account_warning: { icon: "⚠️", color: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-950/50" },
};

// === Toast Notification ===
interface ToastProps {
  notification: Notification;
  onClose: () => void;
  onClick?: () => void;
}

export function NotificationToast({ notification, onClose, onClick }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const config = NOTIFICATION_CONFIG[notification.type];

  useEffect(() => {
    // Entrée
    setTimeout(() => setIsVisible(true), 10);
    
    // Sortie automatique après 5s
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(exitTimer);
  }, [onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={clsx(
        "pointer-events-auto flex w-80 max-w-sm items-start gap-3 rounded-2xl bg-white p-4 shadow-2xl transition-all duration-300 dark:bg-neutral-900",
        isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
      onClick={onClick}
    >
      {/* Icône */}
      <div className={clsx(
        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg",
        config.bgColor
      )}>
        {config.icon}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{notification.title}</p>
        <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{notification.message}</p>
        <p className="mt-1 text-[10px] text-neutral-400">{timeAgo(notification.createdAt)}</p>
      </div>

      {/* Bouton fermer */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className="flex-shrink-0 rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// === Container de Toasts ===
interface ToastContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function ToastContainer({ notifications, onDismiss, onNotificationClick }: ToastContainerProps) {
  // Afficher max 3 toasts en même temps
  const visibleToasts = notifications.slice(0, 3);

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 flex flex-col gap-3">
      {visibleToasts.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => onDismiss(notification.id)}
          onClick={() => onNotificationClick?.(notification)}
        />
      ))}
    </div>
  );
}

// === Panneau de notifications ===
interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNotificationClick,
}: NotificationPanelProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-4 top-16 z-50 w-96 max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
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
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-fuchsia-500 hover:underline"
              >
                Tout marquer comme lu
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Liste */}
        <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <span className="mb-2 text-4xl">🔔</span>
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {notifications.map((notification) => {
                const config = NOTIFICATION_CONFIG[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={clsx(
                      "group flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                      !notification.read && "bg-fuchsia-50/50 dark:bg-fuchsia-950/20"
                    )}
                    onClick={() => {
                      if (!notification.read) onMarkAsRead(notification.id);
                      onNotificationClick?.(notification);
                    }}
                  >
                    {/* Icône */}
                    <div className={clsx(
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg",
                      config.bgColor
                    )}>
                      {config.icon}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={clsx(
                          "text-sm",
                          !notification.read && "font-semibold"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-fuchsia-500" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[10px] text-neutral-400">
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification.id);
                      }}
                      className="flex-shrink-0 rounded-lg p-1 opacity-0 transition-opacity hover:bg-neutral-200 group-hover:opacity-100 dark:hover:bg-neutral-700"
                    >
                      <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// === Bouton de notification avec badge ===
interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

export function NotificationBell({ unreadCount, onClick }: NotificationBellProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  return (
    <button
      onClick={onClick}
      className="relative rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      <svg 
        className={clsx(
          "h-6 w-6 transition-transform",
          isAnimating && "animate-wiggle"
        )} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      
      {unreadCount > 0 && (
        <span className={clsx(
          "absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-fuchsia-500 px-1 text-xs font-bold text-white transition-transform",
          isAnimating && "scale-125"
        )}>
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
