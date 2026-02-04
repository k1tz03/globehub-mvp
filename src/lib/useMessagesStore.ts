"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { Message, Conversation } from "./types";

const MESSAGES_KEY = "globehub_messages_v1";
const CONVERSATIONS_KEY = "globehub_conversations_v1";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function safeParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

// Messages de démo
const demoMessages: Message[] = [
  {
    id: "msg_001",
    conversationId: "conv_001",
    senderId: "user_camille",
    senderHandle: "camille",
    text: "Salut ! Tu as vu le post sur la tour Eiffel ? 🗼",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "read",
    isDeleted: false,
    deletedFor: [],
  },
  {
    id: "msg_002",
    conversationId: "conv_001",
    senderId: "user_noah",
    senderHandle: "noah",
    text: "Oui c'est magnifique ! J'aimerais bien y aller cet été",
    createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    status: "read",
    isDeleted: false,
    deletedFor: [],
  },
  {
    id: "msg_003",
    conversationId: "conv_001",
    senderId: "user_camille",
    senderHandle: "camille",
    text: "On devrait organiser ça ! 🎉",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: "delivered",
    isDeleted: false,
    deletedFor: [],
  },
];

const demoConversations: Conversation[] = [
  {
    id: "conv_001",
    participants: ["camille", "noah"],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastMessageAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    lastMessage: "On devrait organiser ça ! 🎉",
    unreadCount: { camille: 0, noah: 1 },
    isBlocked: false,
  },
  {
    id: "conv_002",
    participants: ["emma", "noah"],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastMessageAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastMessage: "Super concert hier soir ! 🎵",
    unreadCount: { emma: 0, noah: 0 },
    isBlocked: false,
  },
];

export function useMessagesStore(currentUserHandle?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [ready, setReady] = useState(false);

  // Charger les données
  useEffect(() => {
    const savedMessages = safeParse<Message[]>(localStorage.getItem(MESSAGES_KEY));
    const savedConversations = safeParse<Conversation[]>(localStorage.getItem(CONVERSATIONS_KEY));

    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(demoMessages));
      setMessages(demoMessages);
    }

    if (savedConversations && savedConversations.length > 0) {
      setConversations(savedConversations);
    } else {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(demoConversations));
      setConversations(demoConversations);
    }

    setReady(true);
  }, []);

  // Sauvegarder
  const saveMessages = useCallback((newMessages: Message[]) => {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(newMessages));
    setMessages(newMessages);
  }, []);

  const saveConversations = useCallback((newConversations: Conversation[]) => {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(newConversations));
    setConversations(newConversations);
  }, []);

  // Obtenir ou créer une conversation
  const getOrCreateConversation = useCallback((otherHandle: string): Conversation | null => {
    if (!currentUserHandle || otherHandle === currentUserHandle) return null;

    // Chercher une conversation existante
    const existing = conversations.find(
      (c) => c.participants.includes(currentUserHandle) && c.participants.includes(otherHandle)
    );
    
    if (existing) return existing;

    // Créer une nouvelle conversation
    const newConv: Conversation = {
      id: `conv_${uid()}`,
      participants: [currentUserHandle, otherHandle].sort(),
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      unreadCount: { [currentUserHandle]: 0, [otherHandle]: 0 },
      isBlocked: false,
    };

    const newConversations = [...conversations, newConv];
    saveConversations(newConversations);
    return newConv;
  }, [currentUserHandle, conversations, saveConversations]);

  // Envoyer un message
  const sendMessage = useCallback((conversationId: string, text: string): Message | null => {
    if (!currentUserHandle || !text.trim()) return null;

    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return null;

    // Vérifier si bloqué
    if (conv.isBlocked) return null;

    const newMessage: Message = {
      id: `msg_${uid()}`,
      conversationId,
      senderId: `user_${currentUserHandle}`,
      senderHandle: currentUserHandle,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      status: "sent",
      isDeleted: false,
      deletedFor: [],
    };

    const newMessages = [...messages, newMessage];
    saveMessages(newMessages);

    // Mettre à jour la conversation
    const otherHandle = conv.participants.find((p) => p !== currentUserHandle);
    const newConversations = conversations.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          lastMessageAt: newMessage.createdAt,
          lastMessage: newMessage.text,
          unreadCount: {
            ...c.unreadCount,
            [otherHandle!]: (c.unreadCount[otherHandle!] || 0) + 1,
          },
        };
      }
      return c;
    });
    saveConversations(newConversations);

    return newMessage;
  }, [currentUserHandle, messages, conversations, saveMessages, saveConversations]);

  // Éditer un message
  const editMessage = useCallback((messageId: string, newText: string) => {
    if (!currentUserHandle || !newText.trim()) return;

    const newMessages = messages.map((m) => {
      if (m.id === messageId && m.senderHandle === currentUserHandle) {
        return {
          ...m,
          text: newText.trim(),
          editedAt: new Date().toISOString(),
        };
      }
      return m;
    });
    saveMessages(newMessages);
  }, [currentUserHandle, messages, saveMessages]);

  // Supprimer un message (soft delete pour soi ou pour tous si sender)
  const deleteMessage = useCallback((messageId: string, forEveryone: boolean = false) => {
    if (!currentUserHandle) return;

    const newMessages = messages.map((m) => {
      if (m.id === messageId) {
        if (forEveryone && m.senderHandle === currentUserHandle) {
          return { ...m, isDeleted: true, text: "[Message supprimé]" };
        } else {
          return { ...m, deletedFor: [...m.deletedFor, currentUserHandle] };
        }
      }
      return m;
    });
    saveMessages(newMessages);
  }, [currentUserHandle, messages, saveMessages]);

  // Marquer comme lu
  const markAsRead = useCallback((conversationId: string) => {
    if (!currentUserHandle) return;

    // Marquer les messages comme lus
    const newMessages = messages.map((m) => {
      if (m.conversationId === conversationId && m.senderHandle !== currentUserHandle) {
        return { ...m, status: "read" as const };
      }
      return m;
    });
    saveMessages(newMessages);

    // Reset unread count
    const newConversations = conversations.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          unreadCount: { ...c.unreadCount, [currentUserHandle]: 0 },
        };
      }
      return c;
    });
    saveConversations(newConversations);
  }, [currentUserHandle, messages, conversations, saveMessages, saveConversations]);

  // Bloquer/débloquer une conversation
  const toggleBlockConversation = useCallback((conversationId: string) => {
    if (!currentUserHandle) return;

    const newConversations = conversations.map((c) => {
      if (c.id === conversationId) {
        const isCurrentlyBlocked = c.isBlocked && c.blockedBy === currentUserHandle;
        return {
          ...c,
          isBlocked: !isCurrentlyBlocked,
          blockedBy: isCurrentlyBlocked ? undefined : currentUserHandle,
        };
      }
      return c;
    });
    saveConversations(newConversations);
  }, [currentUserHandle, conversations, saveConversations]);

  // Supprimer une conversation (pour soi)
  const deleteConversation = useCallback((conversationId: string) => {
    if (!currentUserHandle) return;

    // Supprimer les messages de la conversation pour cet utilisateur
    const newMessages = messages.map((m) => {
      if (m.conversationId === conversationId) {
        return { ...m, deletedFor: [...m.deletedFor, currentUserHandle] };
      }
      return m;
    });
    saveMessages(newMessages);
  }, [currentUserHandle, messages, saveMessages]);

  // Conversations de l'utilisateur
  const userConversations = useMemo(() => {
    if (!currentUserHandle) return [];
    return conversations
      .filter((c) => c.participants.includes(currentUserHandle))
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [currentUserHandle, conversations]);

  // Messages d'une conversation
  const getConversationMessages = useCallback((conversationId: string) => {
    if (!currentUserHandle) return [];
    return messages
      .filter(
        (m) =>
          m.conversationId === conversationId &&
          !m.deletedFor.includes(currentUserHandle)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [currentUserHandle, messages]);

  // Nombre total de messages non lus
  const totalUnread = useMemo(() => {
    if (!currentUserHandle) return 0;
    return userConversations.reduce(
      (sum, c) => sum + (c.unreadCount[currentUserHandle] || 0),
      0
    );
  }, [currentUserHandle, userConversations]);

  return {
    conversations: userConversations,
    totalUnread,
    ready,
    getOrCreateConversation,
    getConversationMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    toggleBlockConversation,
    deleteConversation,
  };
}
