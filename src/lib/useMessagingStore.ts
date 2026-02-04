"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { Message, Conversation, Report, ReportReason } from "./types";

const CONVERSATIONS_KEY = "globehub_conversations_v1";
const MESSAGES_KEY = "globehub_messages_v1";

function safeParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function useMessagingStore(currentUserHandle?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ready, setReady] = useState(false);

  // Charger les données
  useEffect(() => {
    const savedConversations = safeParse<Conversation[]>(localStorage.getItem(CONVERSATIONS_KEY));
    if (savedConversations) {
      setConversations(savedConversations);
    }

    const savedMessages = safeParse<Message[]>(localStorage.getItem(MESSAGES_KEY));
    if (savedMessages) {
      setMessages(savedMessages);
    }

    setReady(true);
  }, []);

  // Sauvegarder les conversations
  const saveConversations = useCallback((newConversations: Conversation[]) => {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(newConversations));
    setConversations(newConversations);
  }, []);

  // Sauvegarder les messages
  const saveMessages = useCallback((newMessages: Message[]) => {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(newMessages));
    setMessages(newMessages);
  }, []);

  // Créer ou obtenir une conversation
  const getOrCreateConversation = useCallback((participantHandle: string): Conversation | null => {
    if (!currentUserHandle || participantHandle === currentUserHandle) return null;

    // Chercher une conversation existante
    const existing = conversations.find(
      (c) =>
        c.participants.includes(currentUserHandle) &&
        c.participants.includes(participantHandle) &&
        c.participants.length === 2
    );

    if (existing) return existing;

    // Créer une nouvelle conversation
    const newConversation: Conversation = {
      id: `conv_${uid()}`,
      participants: [currentUserHandle, participantHandle],
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      unreadCount: { [currentUserHandle]: 0, [participantHandle]: 0 },
      isBlocked: false,
    };

    const newConversations = [...conversations, newConversation];
    saveConversations(newConversations);

    return newConversation;
  }, [currentUserHandle, conversations, saveConversations]);

  // Envoyer un message
  const sendMessage = useCallback((conversationId: string, text: string): Message | null => {
    if (!currentUserHandle || !text.trim()) return null;

    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return null;

    // Vérifier si bloqué
    if (conversation.isBlocked) return null;

    const newMessage: Message = {
      id: `msg_${uid()}`,
      conversationId,
      senderId: currentUserHandle,
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
    const otherParticipant = conversation.participants.find((p) => p !== currentUserHandle);
    const newConversations = conversations.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          lastMessageAt: newMessage.createdAt,
          lastMessage: newMessage.text.slice(0, 50),
          unreadCount: {
            ...c.unreadCount,
            [otherParticipant ?? ""]: (c.unreadCount[otherParticipant ?? ""] ?? 0) + 1,
          },
        };
      }
      return c;
    });
    saveConversations(newConversations);

    return newMessage;
  }, [currentUserHandle, conversations, messages, saveConversations, saveMessages]);

  // Éditer un message
  const editMessage = useCallback((messageId: string, newText: string) => {
    if (!currentUserHandle || !newText.trim()) return;

    const newMessages = messages.map((m) => {
      if (m.id === messageId && m.senderHandle === currentUserHandle && !m.isDeleted) {
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

  // Supprimer un message (pour soi uniquement ou pour tous si c'est le sender)
  const deleteMessage = useCallback((messageId: string, forEveryone: boolean = false) => {
    if (!currentUserHandle) return;

    const newMessages = messages.map((m) => {
      if (m.id === messageId) {
        if (forEveryone && m.senderHandle === currentUserHandle) {
          return { ...m, isDeleted: true, text: "Message supprimé" };
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

    // Réinitialiser le compteur
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
  }, [currentUserHandle, conversations, messages, saveConversations, saveMessages]);

  // Bloquer un utilisateur dans une conversation
  const blockUser = useCallback((conversationId: string) => {
    if (!currentUserHandle) return;

    const newConversations = conversations.map((c) => {
      if (c.id === conversationId) {
        return { ...c, isBlocked: true, blockedBy: currentUserHandle };
      }
      return c;
    });
    saveConversations(newConversations);
  }, [currentUserHandle, conversations, saveConversations]);

  // Débloquer
  const unblockUser = useCallback((conversationId: string) => {
    if (!currentUserHandle) return;

    const newConversations = conversations.map((c) => {
      if (c.id === conversationId && c.blockedBy === currentUserHandle) {
        return { ...c, isBlocked: false, blockedBy: undefined };
      }
      return c;
    });
    saveConversations(newConversations);
  }, [currentUserHandle, conversations, saveConversations]);

  // Supprimer une conversation (pour soi)
  const deleteConversation = useCallback((conversationId: string) => {
    if (!currentUserHandle) return;

    // On ne supprime pas vraiment, on supprime les messages pour l'utilisateur
    const newMessages = messages.map((m) => {
      if (m.conversationId === conversationId) {
        return { ...m, deletedFor: [...m.deletedFor, currentUserHandle] };
      }
      return m;
    });
    saveMessages(newMessages);
  }, [currentUserHandle, messages, saveMessages]);

  // Obtenir les messages d'une conversation
  const getConversationMessages = useCallback((conversationId: string): Message[] => {
    if (!currentUserHandle) return [];

    return messages
      .filter(
        (m) =>
          m.conversationId === conversationId &&
          !m.deletedFor.includes(currentUserHandle)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [currentUserHandle, messages]);

  // Conversations de l'utilisateur courant
  const userConversations = useMemo(() => {
    if (!currentUserHandle) return [];

    return conversations
      .filter((c) => c.participants.includes(currentUserHandle))
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [currentUserHandle, conversations]);

  // Nombre total de messages non lus
  const totalUnread = useMemo(() => {
    if (!currentUserHandle) return 0;

    return userConversations.reduce((sum, c) => sum + (c.unreadCount[currentUserHandle] ?? 0), 0);
  }, [currentUserHandle, userConversations]);

  // Retourner toutes les conversations
  const getConversations = useCallback(() => {
    return userConversations;
  }, [userConversations]);

  return {
    conversations: userConversations,
    totalUnread,
    ready,
    getOrCreateConversation,
    getConversations,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    blockUser,
    unblockUser,
    deleteConversation,
    getConversationMessages,
  };
}
