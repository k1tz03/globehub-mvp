"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/useAuthStore";
import { useGroupsStore } from "@/lib/useGroupsStore";
import { usePostsStore } from "@/lib/usePostsStore";
import { 
  INTEREST_LABELS, 
  GROUP_VISIBILITY_LABELS, 
  GROUP_JOIN_MODE_LABELS,
  GROUP_ROLE_LABELS,
  type GroupRole,
  type GroupMember,
} from "@/lib/types";

type TabType = "chat" | "members" | "posts" | "map" | "settings" | "requests";

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const { currentUser, ready: authReady, users } = useAuthStore();
  const { 
    ready: groupsReady, 
    getGroup,
    getGroupMessages,
    sendGroupMessage,
    deleteGroupMessage,
    updateGroup,
    leaveGroup,
    removeMember,
    changeMemberRole,
    inviteMember,
    getPendingRequests,
    acceptJoinRequest,
    rejectJoinRequest,
    updateMemberLocation,
    updateMemberOnlineStatus,
    isMember: checkIsMember,
    getMemberRole,
    joinGroup,
    requestToJoin,
    getGroupPostIds,
    addPostToGroup,
    removePostFromGroup,
  } = useGroupsStore(currentUser?.handle);
  const { posts: allPosts, ready: postsReady } = usePostsStore();

  const [tab, setTab] = useState<TabType>("chat");
  const [messageText, setMessageText] = useState("");
  const [searchMember, setSearchMember] = useState("");
  const [inviteSearch, setInviteSearch] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(12);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Groupe et données
  const group = useMemo(() => getGroup(groupId), [groupId, getGroup]);
  const messages = useMemo(() => getGroupMessages(groupId), [groupId, getGroupMessages]);
  const pendingRequests = useMemo(() => getPendingRequests(groupId), [groupId, getPendingRequests]);
  const groupPostIds = useMemo(() => getGroupPostIds(groupId), [groupId, getGroupPostIds]);
  
  // Posts du groupe
  const groupPosts = useMemo(() => {
    return allPosts.filter(p => groupPostIds.includes(p.id)).sort(
      (a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime()
    );
  }, [allPosts, groupPostIds]);
  
  const isMember = currentUser ? checkIsMember(groupId, currentUser.handle) : false;
  const memberRole = currentUser ? getMemberRole(groupId, currentUser.handle) : null;
  const isAdmin = memberRole === "owner" || memberRole === "admin";
  const isModerator = isAdmin || memberRole === "moderator";

  // Membres filtrés
  const filteredMembers = useMemo(() => {
    if (!group) return [];
    if (!searchMember.trim()) return group.members;
    const q = searchMember.toLowerCase();
    return group.members.filter(m => m.userHandle.toLowerCase().includes(q));
  }, [group, searchMember]);

  // Membres sur la carte (ceux qui partagent leur position)
  const membersOnMap = useMemo(() => {
    if (!group || !group.showMembersOnMap) return [];
    return group.members.filter(m => m.shareLocation && m.lat && m.lon);
  }, [group]);

  // Centre de la carte (moyenne des positions)
  const mapCenter = useMemo(() => {
    if (membersOnMap.length === 0) return { lat: 48.8566, lon: 2.3522 }; // Paris par défaut
    const avgLat = membersOnMap.reduce((sum, m) => sum + (m.lat || 0), 0) / membersOnMap.length;
    const avgLon = membersOnMap.reduce((sum, m) => sum + (m.lon || 0), 0) / membersOnMap.length;
    return { lat: avgLat, lon: avgLon };
  }, [membersOnMap]);

  // Utilisateurs disponibles pour invitation
  const availableForInvite = useMemo(() => {
    if (!group || !inviteSearch.trim()) return [];
    const q = inviteSearch.toLowerCase();
    return users.filter(u => 
      !group.members.some(m => m.userHandle === u.handle) &&
      (u.username.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [users, group, inviteSearch]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Mettre à jour le statut en ligne
  useEffect(() => {
    if (currentUser && isMember) {
      updateMemberOnlineStatus(groupId, currentUser.handle, true);
      
      // Mettre à jour la position si géolocalisation disponible
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          updateMemberLocation(groupId, currentUser.handle, pos.coords.latitude, pos.coords.longitude);
        });
      }

      return () => {
        updateMemberOnlineStatus(groupId, currentUser.handle, false);
      };
    }
  }, [currentUser, isMember, groupId, updateMemberOnlineStatus, updateMemberLocation]);

  // Loading
  if (!authReady || !groupsReady || !postsReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent" />
      </div>
    );
  }

  // Groupe non trouvé
  if (!group) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="text-center">
          <span className="text-6xl">🔍</span>
          <h1 className="mt-4 text-xl font-bold">Groupe introuvable</h1>
          <button onClick={() => router.push("/groups")} className="mt-4 rounded-xl bg-fuchsia-500 px-6 py-2 text-white">
            Retour aux groupes
          </button>
        </div>
      </div>
    );
  }

  // Groupe privé et non membre
  if (group.visibility === "private" && !isMember) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="text-center">
          <span className="text-6xl">🔒</span>
          <h1 className="mt-4 text-xl font-bold">{group.name}</h1>
          <p className="mt-2 text-neutral-500">Ce groupe est privé</p>
          {currentUser && group.joinMode === "request" && (
            <button 
              onClick={() => {
                requestToJoin(groupId, currentUser.id, currentUser.handle);
                setToast("📤 Demande envoyée !");
              }}
              className="mt-4 rounded-xl bg-fuchsia-500 px-6 py-2 text-white"
            >
              Demander à rejoindre
            </button>
          )}
          <button onClick={() => router.push("/groups")} className="mt-4 block mx-auto text-sm text-fuchsia-500">
            ← Retour aux groupes
          </button>
        </div>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (!messageText.trim() || !currentUser) return;
    
    const result = sendGroupMessage(
      groupId, 
      currentUser.id, 
      currentUser.handle, 
      messageText.trim(),
      currentUser.avatar
    );
    
    if (result) {
      setMessageText("");
      if (result.isFlagged) {
        setToast("⚠️ Message envoyé mais signalé pour vérification");
      }
    }
  };

  const handleLeaveGroup = () => {
    if (!currentUser) return;
    leaveGroup(groupId, currentUser.handle);
    setToast("👋 Vous avez quitté le groupe");
    router.push("/groups");
  };

  const handleRemoveMember = (handle: string) => {
    removeMember(groupId, handle);
    setSelectedMember(null);
    setToast("✅ Membre retiré");
  };

  const handleChangeRole = (handle: string, role: GroupRole) => {
    changeMemberRole(groupId, handle, role);
    setSelectedMember(null);
    setToast("✅ Rôle modifié");
  };

  const handleInvite = (userId: string, userHandle: string) => {
    inviteMember(groupId, userId, userHandle);
    setInviteSearch("");
    setShowInviteModal(false);
    setToast("✅ Invitation envoyée");
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  };

  const getUser = (handle: string) => users.find(u => u.handle === handle);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 dark:bg-neutral-950">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-neutral-900">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="flex items-center gap-4 px-4 py-3">
          <button onClick={() => router.push("/groups")} className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold truncate">{group.name}</h1>
              {group.visibility === "private" && <span className="text-xs">🔒</span>}
            </div>
            <p className="text-xs text-neutral-500">
              {group.memberCount} membre{group.memberCount > 1 ? "s" : ""} • 
              {membersOnMap.filter(m => m.isOnline).length} en ligne
            </p>
          </div>

          {isMember && (
            <div className="flex gap-2">
              {isAdmin && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="rounded-xl bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setShowSettingsModal(true)}
                className="rounded-xl bg-neutral-100 p-2 hover:bg-neutral-200 dark:bg-neutral-800"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto px-4 pb-2">
          {[
            { id: "chat", label: "💬 Chat", badge: messages.length },
            { id: "posts", label: "📝 Posts", badge: groupPostIds.length },
            { id: "members", label: "👥 Membres", badge: group.memberCount },
            { id: "map", label: "🗺️ Carte", badge: membersOnMap.length },
            ...(isAdmin ? [{ id: "requests", label: "📩 Demandes", badge: pendingRequests.length }] : []),
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as TabType)}
              className={clsx(
                "flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all",
                tab === t.id
                  ? "bg-fuchsia-500 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
              )}
            >
              {t.label}
              {t.badge > 0 && (
                <span className={clsx(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  tab === t.id ? "bg-white/20" : "bg-neutral-200 dark:bg-neutral-700"
                )}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 overflow-hidden">
        {/* === CHAT === */}
        {tab === "chat" && (
          <div className="flex h-full flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <span className="text-5xl">💬</span>
                    <p className="mt-2 text-neutral-500">Aucun message</p>
                    <p className="text-sm text-neutral-400">Soyez le premier à écrire !</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const isOwn = msg.senderHandle === currentUser?.handle;
                    const sender = getUser(msg.senderHandle);
                    const showDate = idx === 0 || 
                      new Date(messages[idx - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex items-center justify-center py-2">
                            <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                              {formatDate(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        
                        <div className={clsx("flex gap-2", isOwn && "flex-row-reverse")}>
                          {!isOwn && (
                            <button
                              onClick={() => router.push(`/u/${msg.senderHandle}`)}
                              className="flex-shrink-0"
                            >
                              {sender?.avatar ? (
                                <img src={sender.avatar} alt={msg.senderHandle} className="h-8 w-8 rounded-full" />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 text-sm font-bold">
                                  {msg.senderHandle[0].toUpperCase()}
                                </div>
                              )}
                            </button>
                          )}
                          
                          <div className={clsx("max-w-[75%]", isOwn && "text-right")}>
                            {!isOwn && (
                              <p className="mb-1 text-xs font-medium text-neutral-500">
                                {sender?.username || msg.senderHandle}
                              </p>
                            )}
                            <div
                              className={clsx(
                                "rounded-2xl px-4 py-2 text-sm",
                                isOwn
                                  ? "bg-fuchsia-500 text-white"
                                  : "bg-white dark:bg-neutral-800",
                                msg.isDeleted && "italic opacity-50"
                              )}
                            >
                              {msg.text}
                            </div>
                            <p className="mt-1 text-xs text-neutral-400">
                              {formatTime(msg.createdAt)}
                              {msg.editedAt && " (modifié)"}
                              {msg.isFlagged && " ⚠️"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input message */}
            {isMember ? (
              <div className="border-t border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    placeholder="Écrire un message..."
                    className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-fuchsia-400 dark:border-neutral-700 dark:bg-neutral-800"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="rounded-xl bg-fuchsia-500 px-4 text-white hover:bg-fuchsia-600 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-neutral-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-sm text-neutral-500">Rejoignez le groupe pour participer</p>
                {currentUser && (
                  <button
                    onClick={() => {
                      if (group.joinMode === "open") {
                        joinGroup(groupId, currentUser.id, currentUser.handle);
                        setToast("✅ Vous avez rejoint le groupe !");
                      } else {
                        requestToJoin(groupId, currentUser.id, currentUser.handle);
                        setToast("📤 Demande envoyée !");
                      }
                    }}
                    className="mt-2 rounded-xl bg-fuchsia-500 px-4 py-2 text-sm text-white"
                  >
                    {group.joinMode === "open" ? "Rejoindre" : "Demander à rejoindre"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* === POSTS === */}
        {tab === "posts" && (
          <div className="p-4 space-y-4">
            {/* Header avec bouton ajouter */}
            {isMember && group.allowMemberPosts && (
              <div className="rounded-2xl bg-gradient-to-r from-fuchsia-500/10 to-amber-500/10 p-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  💡 Pour ajouter un post au groupe, partagez-le depuis le flux principal en sélectionnant ce groupe.
                </p>
              </div>
            )}

            {/* Liste des posts */}
            {groupPosts.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center dark:bg-neutral-900">
                <span className="text-5xl">📝</span>
                <p className="mt-4 text-neutral-500">Aucun post dans ce groupe</p>
                <p className="mt-1 text-sm text-neutral-400">
                  Les membres peuvent partager des posts ici
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupPosts.map((post) => {
                  const author = getUser(post.handle);
                  return (
                    <div key={post.id} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                      {/* Header du post */}
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => router.push(`/u/${post.handle}`)}
                          className="flex-shrink-0"
                        >
                          {author?.avatar ? (
                            <img src={author.avatar} alt={post.handle} className="h-10 w-10 rounded-full" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 font-bold">
                              {post.handle[0].toUpperCase()}
                            </div>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{post.author}</span>
                            <span className="text-sm text-neutral-500">@{post.handle}</span>
                          </div>
                          <p className="text-xs text-neutral-400">
                            {new Date(post.createdAtISO).toLocaleDateString("fr-FR", {
                              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                            })}
                          </p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              removePostFromGroup(groupId, post.id);
                              setToast("🗑️ Post retiré du groupe");
                            }}
                            className="rounded-lg bg-rose-100 p-1.5 text-rose-600 hover:bg-rose-200"
                            title="Retirer du groupe"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Contenu */}
                      <p className="mt-3 text-sm">{post.text}</p>

                      {/* Media */}
                      {post.media && post.media.type === "image" && (
                        <img 
                          src={post.media.url} 
                          alt="Media" 
                          className="mt-3 rounded-xl max-h-80 w-full object-cover"
                        />
                      )}

                      {/* Stats */}
                      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
                        <span>❤️ {post.likes}</span>
                        <span>💬 {post.comments.length}</span>
                        <span>👁️ {post.views}</span>
                        <span>🔥 {post.viralityScore}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* === MEMBRES === */}
        {tab === "members" && (
          <div className="p-4">
            {/* Recherche */}
            <div className="mb-4">
              <input
                type="text"
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                placeholder="Rechercher un membre..."
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>

            {/* Liste */}
            <div className="space-y-2">
              {filteredMembers.map((member) => {
                const user = getUser(member.userHandle);
                
                return (
                  <div
                    key={member.userHandle}
                    className="flex items-center justify-between rounded-xl bg-white p-3 dark:bg-neutral-900"
                  >
                    <button
                      onClick={() => router.push(`/u/${member.userHandle}`)}
                      className="flex items-center gap-3"
                    >
                      <div className="relative">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={member.userHandle} className="h-10 w-10 rounded-full" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 font-bold">
                            {member.userHandle[0].toUpperCase()}
                          </div>
                        )}
                        {member.isOnline && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-900" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{user?.username || member.userHandle}</p>
                        <p className="text-xs text-neutral-500">
                          @{member.userHandle} • {GROUP_ROLE_LABELS[member.role]}
                        </p>
                      </div>
                    </button>

                    {isAdmin && member.role !== "owner" && member.userHandle !== currentUser?.handle && (
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="rounded-lg bg-neutral-100 p-2 hover:bg-neutral-200 dark:bg-neutral-800"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* === CARTE === */}
        {tab === "map" && (
          <div className="relative h-full">
            {!group.showMembersOnMap ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <span className="text-5xl">🗺️</span>
                  <p className="mt-2 text-neutral-500">Carte désactivée pour ce groupe</p>
                </div>
              </div>
            ) : membersOnMap.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <span className="text-5xl">📍</span>
                  <p className="mt-2 text-neutral-500">Aucun membre ne partage sa position</p>
                </div>
              </div>
            ) : (
              <div className="relative h-full min-h-[400px] bg-gradient-to-b from-sky-100 to-emerald-100 dark:from-sky-950 dark:to-emerald-950">
                {/* Simulation de carte avec les membres */}
                <div className="absolute inset-0 p-4">
                  {/* Contrôles de zoom */}
                  <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
                    <button
                      onClick={() => setMapZoom(Math.min(18, mapZoom + 1))}
                      className="rounded-lg bg-white p-2 shadow-md hover:bg-neutral-50 dark:bg-neutral-800"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setMapZoom(Math.max(1, mapZoom - 1))}
                      className="rounded-lg bg-white p-2 shadow-md hover:bg-neutral-50 dark:bg-neutral-800"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                    </button>
                  </div>

                  {/* Marqueurs des membres */}
                  <div className="relative h-full">
                    {membersOnMap.map((member, idx) => {
                      const user = getUser(member.userHandle);
                      // Position relative simple pour la démo
                      const x = 10 + (idx * 20) % 80;
                      const y = 20 + (idx * 15) % 60;

                      return (
                        <div
                          key={member.userHandle}
                          className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer transition-transform hover:scale-110"
                          style={{ left: `${x}%`, top: `${y}%` }}
                          onClick={() => router.push(`/u/${member.userHandle}`)}
                        >
                          {/* Popup */}
                          <div className="mb-1 rounded-xl bg-white px-3 py-2 shadow-lg dark:bg-neutral-800">
                            <div className="flex items-center gap-2">
                              {user?.avatar ? (
                                <img src={user.avatar} alt={member.userHandle} className="h-8 w-8 rounded-full" />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-amber-500 text-sm font-bold text-white">
                                  {member.userHandle[0].toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium">{user?.username || member.userHandle}</p>
                                <p className="text-xs text-neutral-500">
                                  {member.isOnline ? (
                                    <span className="text-emerald-500">● En ligne</span>
                                  ) : (
                                    "Hors ligne"
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                          {/* Pin */}
                          <div className="mx-auto h-0 w-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-fuchsia-500" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Légende */}
                <div className="absolute bottom-4 left-4 rounded-xl bg-white/90 p-3 text-xs backdrop-blur-sm dark:bg-neutral-900/90">
                  <p className="font-medium mb-1">👥 {membersOnMap.length} membre{membersOnMap.length > 1 ? "s" : ""} sur la carte</p>
                  <p className="text-emerald-600">● {membersOnMap.filter(m => m.isOnline).length} en ligne</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === DEMANDES D'ADHÉSION === */}
        {tab === "requests" && isAdmin && (
          <div className="p-4">
            {pendingRequests.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center dark:bg-neutral-900">
                <span className="text-5xl">📩</span>
                <p className="mt-2 text-neutral-500">Aucune demande en attente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => {
                  const user = getUser(req.userHandle);
                  
                  return (
                    <div key={req.id} className="rounded-xl bg-white p-4 dark:bg-neutral-900">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {user?.avatar ? (
                            <img src={user.avatar} alt={req.userHandle} className="h-10 w-10 rounded-full" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 font-bold">
                              {req.userHandle[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{user?.username || req.userHandle}</p>
                            <p className="text-xs text-neutral-500">@{req.userHandle}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              acceptJoinRequest(req.id, currentUser!.handle);
                              setToast("✅ Demande acceptée");
                            }}
                            className="rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-200"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => {
                              rejectJoinRequest(req.id, currentUser!.handle);
                              setToast("❌ Demande rejetée");
                            }}
                            className="rounded-lg bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-200"
                          >
                            Refuser
                          </button>
                        </div>
                      </div>
                      {req.message && (
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                          "{req.message}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal membre sélectionné */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedMember(null)} />
          <div className="relative rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
            <h3 className="font-bold mb-4">Gérer @{selectedMember.userHandle}</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleChangeRole(selectedMember.userHandle, "admin")}
                className="w-full rounded-xl bg-amber-100 py-2 text-sm font-medium text-amber-700 hover:bg-amber-200"
              >
                Promouvoir Admin
              </button>
              <button
                onClick={() => handleChangeRole(selectedMember.userHandle, "moderator")}
                className="w-full rounded-xl bg-sky-100 py-2 text-sm font-medium text-sky-700 hover:bg-sky-200"
              >
                Promouvoir Modérateur
              </button>
              <button
                onClick={() => handleChangeRole(selectedMember.userHandle, "member")}
                className="w-full rounded-xl bg-neutral-100 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
              >
                Rétrograder Membre
              </button>
              <button
                onClick={() => handleRemoveMember(selectedMember.userHandle)}
                className="w-full rounded-xl bg-rose-100 py-2 text-sm font-medium text-rose-700 hover:bg-rose-200"
              >
                Retirer du groupe
              </button>
            </div>
            <button
              onClick={() => setSelectedMember(null)}
              className="mt-4 w-full rounded-xl border border-neutral-200 py-2 text-sm dark:border-neutral-700"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Modal invitation */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowInviteModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
            <h3 className="font-bold mb-4">Inviter un membre</h3>
            <input
              type="text"
              value={inviteSearch}
              onChange={(e) => setInviteSearch(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
              autoFocus
            />
            <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
              {availableForInvite.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleInvite(user.id, user.handle)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.handle} className="h-10 w-10 rounded-full" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 font-bold">
                      {user.handle[0].toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-neutral-500">@{user.handle}</p>
                  </div>
                </button>
              ))}
              {inviteSearch && availableForInvite.length === 0 && (
                <p className="py-4 text-center text-sm text-neutral-500">Aucun utilisateur trouvé</p>
              )}
            </div>
            <button
              onClick={() => setShowInviteModal(false)}
              className="mt-4 w-full rounded-xl border border-neutral-200 py-2 text-sm dark:border-neutral-700"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal paramètres */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSettingsModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
            <h3 className="font-bold mb-4">Paramètres du groupe</h3>
            
            <div className="space-y-4">
              <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
                <p className="text-sm font-medium">Votre rôle</p>
                <p className="text-xs text-neutral-500">{memberRole ? GROUP_ROLE_LABELS[memberRole] : "Non membre"}</p>
              </div>

              <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
                <p className="text-sm font-medium">Créé le</p>
                <p className="text-xs text-neutral-500">{formatDate(group.createdAt)} par @{group.createdBy}</p>
              </div>

              <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
                <p className="text-sm font-medium">Statistiques</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="font-bold text-lg">{group.memberCount}</p>
                    <p className="text-neutral-500">Membres</p>
                  </div>
                  <div>
                    <p className="font-bold text-lg">{group.totalMessages}</p>
                    <p className="text-neutral-500">Messages</p>
                  </div>
                  <div>
                    <p className="font-bold text-lg">{group.totalPosts}</p>
                    <p className="text-neutral-500">Posts</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => { setShowSettingsModal(false); setShowLeaveConfirm(true); }}
                className="w-full rounded-xl bg-rose-100 py-3 text-sm font-medium text-rose-700 hover:bg-rose-200"
              >
                Quitter le groupe
              </button>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="mt-4 w-full rounded-xl border border-neutral-200 py-2 text-sm dark:border-neutral-700"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Confirmation quitter */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowLeaveConfirm(false)} />
          <div className="relative rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
            <h3 className="font-bold">Quitter le groupe ?</h3>
            <p className="mt-2 text-sm text-neutral-500">
              {memberRole === "owner" && group.memberCount === 1
                ? "Vous êtes le seul membre. Le groupe sera supprimé."
                : "Vous pourrez rejoindre à nouveau plus tard."}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 rounded-xl border border-neutral-200 py-2 text-sm dark:border-neutral-700"
              >
                Annuler
              </button>
              <button
                onClick={handleLeaveGroup}
                className="flex-1 rounded-xl bg-rose-500 py-2 text-sm font-medium text-white"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
