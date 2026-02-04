"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/useAuthStore";
import { useMessagesStore } from "@/lib/useMessagesStore";
import { useReportsStore } from "@/lib/useReportsStore";
import { timeAgo } from "@/lib/time";
import type { ReportReason } from "@/lib/types";

type ViewMode = "inbox" | "archived" | "blocked" | "requests";
type MessageFilter = "all" | "unread" | "attachments";

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, users, ready: authReady, getUserByHandle, toggleBlock } = useAuthStore();
  const {
    conversations,
    totalUnread,
    ready: messagesReady,
    getOrCreateConversation,
    getConversationMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    toggleBlockConversation,
    deleteConversation,
  } = useMessagesStore(currentUser?.handle);
  const { createReport } = useReportsStore();

  // États principaux
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("inbox");
  const [messageFilter, setMessageFilter] = useState<MessageFilter>("all");
  
  // États UI
  const [showOptions, setShowOptions] = useState<string | null>(null);
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [reportTarget, setReportTarget] = useState<{ type: "message" | "user"; id: string; text?: string } | null>(null);
  const [reportReason, setReportReason] = useState<string>("");
  const [reportDetails, setReportDetails] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isMobileConvOpen, setIsMobileConvOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle URL param for direct conversation
  useEffect(() => {
    const withHandle = searchParams.get("with");
    if (withHandle && currentUser && messagesReady) {
      const conv = getOrCreateConversation(withHandle);
      if (conv) {
        setSelectedConvId(conv.id);
        setIsMobileConvOpen(true);
      }
    }
  }, [searchParams, currentUser, messagesReady, getOrCreateConversation]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConvId, conversations]);

  // Mark as read when selecting conversation
  useEffect(() => {
    if (selectedConvId) {
      markAsRead(selectedConvId);
    }
  }, [selectedConvId, markAsRead]);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Get current conversation and messages
  const selectedConv = useMemo(() => {
    return conversations.find((c) => c.id === selectedConvId) || null;
  }, [conversations, selectedConvId]);

  const messages = useMemo(() => {
    if (!selectedConvId) return [];
    return getConversationMessages(selectedConvId);
  }, [selectedConvId, getConversationMessages]);

  const otherHandle = useMemo(() => {
    if (!selectedConv || !currentUser) return null;
    return selectedConv.participants.find((p) => p !== currentUser.handle) || null;
  }, [selectedConv, currentUser]);

  const otherUser = useMemo(() => {
    if (!otherHandle) return null;
    return getUserByHandle(otherHandle);
  }, [otherHandle, getUserByHandle]);

  // Filter conversations based on view mode and search
  const filteredConversations = useMemo(() => {
    let result = conversations;
    
    // Filter by view mode
    if (viewMode === "blocked") {
      result = result.filter((conv) => conv.isBlocked);
    } else {
      result = result.filter((conv) => !conv.isBlocked);
    }

    // Filter by message filter
    if (messageFilter === "unread" && currentUser) {
      result = result.filter((conv) => (conv.unreadCount[currentUser.handle] || 0) > 0);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((conv) => {
        const other = conv.participants.find((p) => p !== currentUser?.handle);
        const user = other ? getUserByHandle(other) : null;
        return (
          user?.username.toLowerCase().includes(q) ||
          user?.handle.toLowerCase().includes(q) ||
          conv.lastMessage?.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [conversations, viewMode, messageFilter, searchQuery, currentUser, getUserByHandle]);

  // Users for new conversation
  const availableUsers = useMemo(() => {
    if (!currentUser || !userSearchQuery) return [];
    const q = userSearchQuery.toLowerCase();
    const blocked = currentUser.blockedUsers || [];
    return users
      .filter((u) => 
        u.handle !== currentUser.handle &&
        !blocked.includes(u.handle) &&
        (u.username.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [users, currentUser, userSearchQuery]);

  // Handlers
  const handleSend = useCallback(() => {
    if (!newMessage.trim() || !selectedConvId) return;
    sendMessage(selectedConvId, newMessage);
    setNewMessage("");
    inputRef.current?.focus();
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [newMessage, selectedConvId, sendMessage]);

  const handleEdit = useCallback((msgId: string) => {
    if (!editText.trim()) return;
    editMessage(msgId, editText);
    setEditingId(null);
    setEditText("");
    setToast({ message: "Message modifié", type: "success" });
  }, [editText, editMessage]);

  const handleDelete = useCallback((msgId: string, forEveryone: boolean) => {
    deleteMessage(msgId, forEveryone);
    setShowDeleteConfirm(null);
    setToast({ message: forEveryone ? "Message supprimé pour tous" : "Message supprimé", type: "success" });
  }, [deleteMessage]);

  const handleBlockUser = useCallback(() => {
    if (!otherHandle) return;
    toggleBlock(otherHandle);
    if (selectedConvId) {
      toggleBlockConversation(selectedConvId);
    }
    setShowOptions(null);
    setToast({ message: selectedConv?.isBlocked ? "Utilisateur débloqué" : "Utilisateur bloqué", type: "success" });
  }, [otherHandle, selectedConvId, selectedConv?.isBlocked, toggleBlock, toggleBlockConversation]);

  const handleReport = useCallback(() => {
    if (!reportTarget || !reportReason) return;
    
    createReport({
      category: reportTarget.type === "message" ? "message" : "user",
      targetId: reportTarget.id,
      reporterId: currentUser?.id || "",
      reporterHandle: currentUser?.handle || "",
      reason: reportReason as ReportReason,
      details: reportDetails,
    });
    
    setShowReportModal(false);
    setReportTarget(null);
    setReportReason("");
    setReportDetails("");
    setToast({ message: "Signalement envoyé", type: "success" });
  }, [reportTarget, reportReason, reportDetails, currentUser, createReport]);

  const handleStartConversation = useCallback((handle: string) => {
    const conv = getOrCreateConversation(handle);
    if (conv) {
      setSelectedConvId(conv.id);
      setShowNewConvModal(false);
      setUserSearchQuery("");
      setIsMobileConvOpen(true);
    }
  }, [getOrCreateConversation]);

  const handleDeleteConversation = useCallback(() => {
    if (!selectedConvId) return;
    deleteConversation(selectedConvId);
    setSelectedConvId(null);
    setShowOptions(null);
    setIsMobileConvOpen(false);
    setToast({ message: "Conversation supprimée", type: "success" });
  }, [selectedConvId, deleteConversation]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Loading
  if (!authReady || !messagesReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent" />
          <p className="text-sm text-neutral-500">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-neutral-900">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-4 text-xl font-bold">Connexion requise</h1>
          <p className="mt-2 text-sm text-neutral-500">Connectez-vous pour accéder à vos messages.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-xl bg-fuchsia-500 px-6 py-3 text-sm font-medium text-white"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-100 dark:bg-neutral-950">
      {/* Toast notification */}
      {toast && (
        <div className={clsx(
          "fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl px-6 py-3 text-sm font-medium text-white shadow-lg transition-all",
          toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"
        )}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">Messages</h1>
              {totalUnread > 0 && (
                <p className="text-xs text-fuchsia-500">{totalUnread} non lu{totalUnread > 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowNewConvModal(true)}
            className="flex items-center gap-2 rounded-xl bg-fuchsia-500 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Nouveau message</span>
          </button>
        </div>
      </header>

      <div className="mx-auto flex flex-1 w-full max-w-6xl overflow-hidden">
        {/* Sidebar - Conversations List */}
        <div className={clsx(
          "flex flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900",
          "w-full sm:w-80 lg:w-96 flex-shrink-0",
          isMobileConvOpen && "hidden sm:flex"
        )}>
          {/* Search & Filters */}
          <div className="border-b border-neutral-100 p-4 dark:border-neutral-800">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une conversation..."
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            
            {/* View mode tabs */}
            <div className="mt-3 flex gap-1">
              {[
                { key: "inbox" as const, label: "Boîte de réception", icon: "📥" },
                { key: "blocked" as const, label: "Bloqués", icon: "🚫" },
              ].map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setViewMode(mode.key)}
                  className={clsx(
                    "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    viewMode === mode.key
                      ? "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-400"
                      : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                >
                  {mode.icon} {mode.label}
                </button>
              ))}
            </div>

            {/* Message filter */}
            <div className="mt-2 flex gap-1">
              {[
                { key: "all" as const, label: "Tous" },
                { key: "unread" as const, label: "Non lus" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setMessageFilter(filter.key)}
                  className={clsx(
                    "rounded-full px-3 py-1 text-xs transition-colors",
                    messageFilter === filter.key
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <span className="text-4xl">
                  {viewMode === "blocked" ? "🚫" : searchQuery ? "🔍" : "💬"}
                </span>
                <p className="mt-2 text-sm text-neutral-500">
                  {viewMode === "blocked" 
                    ? "Aucune conversation bloquée" 
                    : searchQuery 
                      ? "Aucun résultat" 
                      : "Aucune conversation"}
                </p>
                {viewMode === "inbox" && !searchQuery && (
                  <button
                    onClick={() => setShowNewConvModal(true)}
                    className="mt-4 rounded-xl bg-fuchsia-500 px-4 py-2 text-sm font-medium text-white"
                  >
                    Démarrer une conversation
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredConversations.map((conv) => {
                  const other = conv.participants.find((p) => p !== currentUser.handle);
                  const user = other ? getUserByHandle(other) : null;
                  const unread = conv.unreadCount[currentUser.handle] || 0;
                  const isSelected = conv.id === selectedConvId;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedConvId(conv.id);
                        setIsMobileConvOpen(true);
                      }}
                      className={clsx(
                        "flex w-full items-center gap-3 p-4 text-left transition-colors",
                        isSelected 
                          ? "bg-fuchsia-50 dark:bg-fuchsia-950/30" 
                          : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className={clsx(
                          "flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold",
                          isSelected 
                            ? "bg-fuchsia-500 text-white" 
                            : "bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20"
                        )}>
                          {user?.avatar ? (
                            <img src={user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            user?.username.charAt(0) || "?"
                          )}
                        </div>
                        {conv.isBlocked && (
                          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs">
                            🚫
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={clsx("font-medium truncate", unread > 0 && "text-fuchsia-600")}>
                            {user?.username || other}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {timeAgo(conv.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className={clsx(
                            "truncate text-sm",
                            unread > 0 ? "font-medium text-neutral-900 dark:text-white" : "text-neutral-500"
                          )}>
                            {conv.lastMessage || "Aucun message"}
                          </p>
                          {unread > 0 && (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-fuchsia-500 px-1.5 text-xs font-bold text-white">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className={clsx(
          "flex flex-1 flex-col bg-white dark:bg-neutral-900",
          !isMobileConvOpen && "hidden sm:flex"
        )}>
          {selectedConv && otherUser ? (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  {/* Mobile back button */}
                  <button
                    onClick={() => setIsMobileConvOpen(false)}
                    className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:hidden"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 font-bold">
                    {otherUser.avatar ? (
                      <img src={otherUser.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      otherUser.username.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{otherUser.username}</p>
                    <p className="text-xs text-neutral-500">@{otherUser.handle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/u/${otherUser.handle}`)}
                    className="rounded-lg px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Voir profil
                  </button>
                  
                  {/* Options menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowOptions(showOptions === "header" ? null : "header")}
                      className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    {showOptions === "header" && (
                      <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-xl bg-white p-2 shadow-xl dark:bg-neutral-800">
                        <button
                          onClick={handleBlockUser}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        >
                          <span>{selectedConv.isBlocked ? "🔓" : "🚫"}</span>
                          {selectedConv.isBlocked ? "Débloquer" : "Bloquer"} {otherUser.username}
                        </button>
                        <button
                          onClick={() => {
                            setReportTarget({ type: "user", id: otherUser.id });
                            setShowReportModal(true);
                            setShowOptions(null);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        >
                          <span>🚩</span>
                          Signaler {otherUser.username}
                        </button>
                        <hr className="my-2 border-neutral-100 dark:border-neutral-700" />
                        <button
                          onClick={handleDeleteConversation}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <span>🗑️</span>
                          Supprimer la conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Blocked warning */}
              {selectedConv.isBlocked && (
                <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
                  <span>🚫 Cette conversation est bloquée. </span>
                  <button onClick={handleBlockUser} className="underline hover:no-underline">
                    Débloquer
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 220px)" }}>
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <span className="text-5xl">👋</span>
                    <p className="mt-4 text-lg font-medium">Démarrez la conversation</p>
                    <p className="text-sm text-neutral-500">Envoyez un message à {otherUser.username}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, index) => {
                      const isOwn = msg.senderHandle === currentUser.handle;
                      const showDate = index === 0 || 
                        new Date(messages[index - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                      return (
                        <div key={msg.id}>
                          {/* Date separator */}
                          {showDate && (
                            <div className="my-4 flex items-center justify-center">
                              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-500 dark:bg-neutral-800">
                                {new Date(msg.createdAt).toLocaleDateString("fr-FR", { 
                                  weekday: "long", 
                                  day: "numeric", 
                                  month: "long" 
                                })}
                              </span>
                            </div>
                          )}

                          <div className={clsx("flex", isOwn ? "justify-end" : "justify-start")}>
                            <div className="group relative max-w-[75%]">
                              {/* Edit mode */}
                              {editingId === msg.id ? (
                                <div className="flex flex-col gap-2">
                                  <textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full rounded-xl border border-neutral-200 px-4 py-2 text-sm outline-none focus:border-fuchsia-400 dark:border-neutral-700 dark:bg-neutral-800"
                                    rows={2}
                                    autoFocus
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="rounded-lg px-3 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                    >
                                      Annuler
                                    </button>
                                    <button
                                      onClick={() => handleEdit(msg.id)}
                                      className="rounded-lg bg-fuchsia-500 px-3 py-1 text-sm text-white"
                                    >
                                      Enregistrer
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Message bubble */}
                                  <div
                                    className={clsx(
                                      "rounded-2xl px-4 py-2.5",
                                      isOwn
                                        ? "bg-fuchsia-500 text-white"
                                        : "bg-neutral-100 dark:bg-neutral-800",
                                      msg.isDeleted && "italic opacity-60"
                                    )}
                                  >
                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                  </div>

                                  {/* Message meta */}
                                  <div className={clsx(
                                    "mt-1 flex items-center gap-2 text-xs text-neutral-400",
                                    isOwn ? "justify-end" : "justify-start"
                                  )}>
                                    <span>{new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                                    {msg.editedAt && <span className="italic">(modifié)</span>}
                                    {isOwn && (
                                      <span>
                                        {msg.status === "read" ? "✓✓" : msg.status === "delivered" ? "✓" : "○"}
                                      </span>
                                    )}
                                  </div>

                                  {/* Message options (on hover for own messages) */}
                                  {!msg.isDeleted && (
                                    <div className={clsx(
                                      "absolute top-0 hidden group-hover:flex",
                                      isOwn ? "-left-2" : "-right-2"
                                    )}>
                                      <div className="relative">
                                        <button
                                          onClick={() => setShowOptions(showOptions === msg.id ? null : msg.id)}
                                          className="rounded-full bg-white p-1.5 shadow dark:bg-neutral-700"
                                        >
                                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
                                          </svg>
                                        </button>
                                        {showOptions === msg.id && (
                                          <div className={clsx(
                                            "absolute top-full z-30 mt-1 w-44 rounded-xl bg-white p-1 shadow-xl dark:bg-neutral-800",
                                            isOwn ? "right-0" : "left-0"
                                          )}>
                                            {isOwn && (
                                              <>
                                                <button
                                                  onClick={() => {
                                                    setEditingId(msg.id);
                                                    setEditText(msg.text);
                                                    setShowOptions(null);
                                                  }}
                                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                                >
                                                  ✏️ Modifier
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setShowDeleteConfirm(msg.id);
                                                    setShowOptions(null);
                                                  }}
                                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                >
                                                  🗑️ Supprimer
                                                </button>
                                              </>
                                            )}
                                            {!isOwn && (
                                              <button
                                                onClick={() => {
                                                  setReportTarget({ type: "message", id: msg.id, text: msg.text });
                                                  setShowReportModal(true);
                                                  setShowOptions(null);
                                                }}
                                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                              >
                                                🚩 Signaler
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input area */}
              {!selectedConv.isBlocked && (
                <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
                  <div className="flex gap-3">
                    <textarea
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Écrivez votre message..."
                      rows={1}
                      className="flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800"
                      style={{ minHeight: "48px", maxHeight: "120px" }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim()}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-500 text-white transition-all hover:bg-fuchsia-600 disabled:opacity-50"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* No conversation selected */
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="text-6xl">💬</div>
                <p className="mt-4 text-lg font-medium">Sélectionnez une conversation</p>
                <p className="text-sm text-neutral-500">ou démarrez-en une nouvelle</p>
                <button
                  onClick={() => setShowNewConvModal(true)}
                  className="mt-4 rounded-xl bg-fuchsia-500 px-6 py-3 text-sm font-medium text-white"
                >
                  Nouveau message
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === MODALS === */}

      {/* New conversation modal */}
      {showNewConvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowNewConvModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-neutral-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Nouvelle conversation</h2>
            <p className="text-sm text-neutral-500">Recherchez un utilisateur</p>
            
            <div className="relative mt-4">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Nom ou @pseudo..."
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-fuchsia-400 dark:border-neutral-700 dark:bg-neutral-800"
                autoFocus
              />
            </div>

            {/* Search results */}
            <div className="mt-4 max-h-64 overflow-y-auto">
              {userSearchQuery && availableUsers.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-500">Aucun utilisateur trouvé</p>
              ) : (
                <div className="space-y-1">
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleStartConversation(user.handle)}
                      className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 font-bold">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          user.username.charAt(0)
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{user.username}</p>
                        <p className="text-xs text-neutral-500">@{user.handle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowNewConvModal(false)}
              className="mt-4 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-neutral-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Supprimer le message ?</h2>
            <p className="mt-2 text-sm text-neutral-500">Cette action est irréversible.</p>
            
            <div className="mt-6 space-y-2">
              <button
                onClick={() => handleDelete(showDeleteConfirm, true)}
                className="w-full rounded-xl bg-rose-500 px-4 py-3 text-sm font-medium text-white hover:bg-rose-600"
              >
                🗑️ Supprimer pour tout le monde
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm, false)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Supprimer pour moi uniquement
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="w-full rounded-xl px-4 py-3 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {showReportModal && reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowReportModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-neutral-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">
              🚩 Signaler {reportTarget.type === "message" ? "ce message" : "cet utilisateur"}
            </h2>
            
            {reportTarget.text && (
              <div className="mt-3 rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
                <p className="text-sm italic text-neutral-600 dark:text-neutral-400 line-clamp-3">
                  &quot;{reportTarget.text}&quot;
                </p>
              </div>
            )}

            <div className="mt-4">
              <label className="text-sm font-medium">Raison du signalement</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-fuchsia-400 dark:border-neutral-700 dark:bg-neutral-800"
              >
                <option value="">Sélectionnez une raison...</option>
                <option value="spam">Spam ou contenu commercial</option>
                <option value="harassment">Harcèlement ou intimidation</option>
                <option value="hate">Discours haineux</option>
                <option value="violence">Violence ou menaces</option>
                <option value="nudity">Nudité ou contenu sexuel</option>
                <option value="misinformation">Désinformation</option>
                <option value="impersonation">Usurpation d&apos;identité</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Détails (optionnel)</label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Décrivez le problème..."
                rows={3}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-fuchsia-400 dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Annuler
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                Envoyer le signalement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close options */}
      {showOptions && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setShowOptions(null)}
        />
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent" />
          <p className="text-sm text-neutral-500">Chargement...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
