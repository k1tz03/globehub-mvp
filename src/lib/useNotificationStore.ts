"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const NOTIFICATIONS_KEY = "globehub_notifications_v1";
const SETTINGS_KEY = "globehub_notif_settings_v1";

export type NotificationType = "like" | "comment" | "follow" | "mention" | "milestone" | "featured";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  postId?: string;
  fromUser?: string;
  fromHandle?: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  likes: boolean;
  comments: boolean;
  follows: boolean;
  mentions: boolean;
  milestones: boolean;
  sound: boolean;
  pushEnabled: boolean;
}

const defaultSettings: NotificationSettings = {
  enabled: true,
  likes: true,
  comments: true,
  follows: true,
  mentions: true,
  milestones: true,
  sound: true,
  pushEnabled: false,
};

function safeParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function useNotificationStore(userHandle?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [newNotifications, setNewNotifications] = useState<Notification[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ready, setReady] = useState(false);

  // Charger les données
  useEffect(() => {
    if (!userHandle) {
      setReady(true);
      return;
    }

    const allNotifs = safeParse<Record<string, Notification[]>>(localStorage.getItem(NOTIFICATIONS_KEY)) || {};
    setNotifications(allNotifs[userHandle] || []);

    const allSettings = safeParse<Record<string, NotificationSettings>>(localStorage.getItem(SETTINGS_KEY)) || {};
    setSettings(allSettings[userHandle] || defaultSettings);

    // Créer l'élément audio pour les sons
    audioRef.current = new Audio("/notification.mp3");
    audioRef.current.volume = 0.3;

    setReady(true);
  }, [userHandle]);

  // Sauvegarder les notifications
  const saveNotifications = useCallback((notifs: Notification[]) => {
    if (!userHandle) return;
    const all = safeParse<Record<string, Notification[]>>(localStorage.getItem(NOTIFICATIONS_KEY)) || {};
    all[userHandle] = notifs;
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
    setNotifications(notifs);
  }, [userHandle]);

  // Sauvegarder les paramètres
  const saveSettings = useCallback((newSettings: NotificationSettings) => {
    if (!userHandle) return;
    const all = safeParse<Record<string, NotificationSettings>>(localStorage.getItem(SETTINGS_KEY)) || {};
    all[userHandle] = newSettings;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(all));
    setSettings(newSettings);
  }, [userHandle]);

  // Ajouter une notification
  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    extra?: { postId?: string; fromUser?: string; fromHandle?: string }
  ) => {
    if (!settings.enabled) return;

    // Vérifier les paramètres par type
    if (type === "like" && !settings.likes) return;
    if (type === "comment" && !settings.comments) return;
    if (type === "follow" && !settings.follows) return;
    if (type === "mention" && !settings.mentions) return;
    if (type === "milestone" && !settings.milestones) return;

    const notif: Notification = {
      id: `notif_${uid()}`,
      type,
      title,
      message,
      postId: extra?.postId,
      fromUser: extra?.fromUser,
      fromHandle: extra?.fromHandle,
      timestamp: new Date().toISOString(),
      read: false,
    };

    const newNotifs = [notif, ...notifications].slice(0, 100);
    saveNotifications(newNotifs);

    // Ajouter aux nouvelles notifications pour le toast
    setNewNotifications(prev => [notif, ...prev].slice(0, 5));

    // Jouer le son
    if (settings.sound && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    // Notification push si autorisé
    if (settings.pushEnabled && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: message,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: notif.id,
      });
    }

    return notif;
  }, [notifications, settings, saveNotifications]);

  // Supprimer une notification des "nouvelles" (pour le toast)
  const dismissNewNotification = useCallback((id: string) => {
    setNewNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Marquer comme lu
  const markAsRead = useCallback((id: string) => {
    const newNotifs = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(newNotifs);
  }, [notifications, saveNotifications]);

  // Marquer tout comme lu
  const markAllAsRead = useCallback(() => {
    const newNotifs = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(newNotifs);
  }, [notifications, saveNotifications]);

  // Supprimer une notification
  const deleteNotification = useCallback((id: string) => {
    const newNotifs = notifications.filter(n => n.id !== id);
    saveNotifications(newNotifs);
  }, [notifications, saveNotifications]);

  // Demander la permission push
  const requestPushPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      saveSettings({ ...settings, pushEnabled: true });
      return true;
    }
    return false;
  }, [settings, saveSettings]);

  // Compter les non-lus
  const unreadCount = notifications.filter(n => !n.read).length;

  // Helper pour créer des notifications de type spécifique
  const notifyLike = useCallback((fromUser: string, fromHandle: string, postId: string) => {
    addNotification("like", "Nouveau like ! ❤️", `${fromUser} a aimé ton post`, { fromUser, fromHandle, postId });
  }, [addNotification]);

  const notifyComment = useCallback((fromUser: string, fromHandle: string, postId: string, preview: string) => {
    addNotification("comment", "Nouveau commentaire ! 💬", `${fromUser}: "${preview.slice(0, 50)}..."`, { fromUser, fromHandle, postId });
  }, [addNotification]);

  const notifyFollow = useCallback((fromUser: string, fromHandle: string) => {
    addNotification("follow", "Nouveau follower ! 👤", `${fromUser} te suit maintenant`, { fromUser, fromHandle });
  }, [addNotification]);

  const notifyMention = useCallback((fromUser: string, fromHandle: string, postId: string) => {
    addNotification("mention", "Tu as été mentionné ! 📢", `${fromUser} t'a mentionné dans un post`, { fromUser, fromHandle, postId });
  }, [addNotification]);

  const notifyMilestone = useCallback((milestone: string, value: number) => {
    addNotification("milestone", `${milestone} atteint ! 🎉`, `Tu as atteint ${value} ${milestone.toLowerCase()}`, {});
  }, [addNotification]);

  const notifyFeatured = useCallback((postId: string) => {
    addNotification("featured", "Post mis en avant ! ⭐", "Ton post a été sélectionné par l'équipe GlobeHub", { postId });
  }, [addNotification]);

  return {
    notifications,
    newNotifications,
    settings,
    unreadCount,
    ready,
    addNotification,
    dismissNewNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    saveSettings,
    requestPushPermission,
    notifyLike,
    notifyComment,
    notifyFollow,
    notifyMention,
    notifyMilestone,
    notifyFeatured,
  };
}
