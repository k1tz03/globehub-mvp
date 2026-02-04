"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { 
  Group, 
  GroupMember, 
  GroupMessage, 
  GroupPost, 
  JoinRequest,
  GroupRole,
  GroupVisibility,
  GroupJoinMode,
  InterestCategory 
} from "./types";

const GROUPS_KEY = "globehub_groups_v1";
const GROUP_MESSAGES_KEY = "globehub_group_messages_v1";
const GROUP_POSTS_KEY = "globehub_group_posts_v1";
const JOIN_REQUESTS_KEY = "globehub_join_requests_v1";

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

// Mots-clés à surveiller pour la modération automatique
const FLAGGED_KEYWORDS = [
  "violence", "haine", "mort", "tuer", "drogue", "arnaque", "scam",
  "terrorisme", "nazi", "raciste", "pédophile", "suicide"
];

function checkMessageForFlags(text: string): { isFlagged: boolean; reason?: string } {
  const textLower = text.toLowerCase();
  for (const keyword of FLAGGED_KEYWORDS) {
    if (textLower.includes(keyword)) {
      return { isFlagged: true, reason: `Mot-clé détecté: "${keyword}"` };
    }
  }
  return { isFlagged: false };
}

// Groupes de démo
const defaultGroups: Group[] = [
  {
    id: "grp_runners_paris",
    name: "Runners Paris 🏃",
    description: "Groupe pour les passionnés de course à pied à Paris. Partagez vos parcours, organisez des sorties et motivez-vous ensemble !",
    avatar: undefined,
    visibility: "public",
    joinMode: "open",
    allowMemberPosts: true,
    allowMemberInvites: true,
    showMembersOnMap: true,
    members: [
      { userId: "usr_camille", userHandle: "camille", role: "owner", joinedAt: "2025-01-15T10:00:00Z", isOnline: true, lat: 48.8566, lon: 2.3522, shareLocation: true },
      { userId: "usr_noah", userHandle: "noah", role: "admin", joinedAt: "2025-01-16T14:30:00Z", isOnline: true, lat: 48.8606, lon: 2.3376, shareLocation: true },
      { userId: "usr_emma", userHandle: "emma", role: "member", joinedAt: "2025-01-18T09:00:00Z", isOnline: false, lat: 48.8530, lon: 2.3499, shareLocation: true },
    ],
    memberCount: 3,
    category: "fitness",
    tags: ["running", "paris", "sport", "outdoor"],
    createdAt: "2025-01-15T10:00:00Z",
    createdBy: "camille",
    totalMessages: 156,
    totalPosts: 23,
    lastActivityAt: new Date().toISOString(),
  },
  {
    id: "grp_foodies_lyon",
    name: "Foodies Lyon 🍽️",
    description: "Les meilleures adresses gastronomiques de Lyon ! Restaurants, bouchons, street food... Partagez vos découvertes.",
    visibility: "public",
    joinMode: "request",
    allowMemberPosts: true,
    allowMemberInvites: false,
    showMembersOnMap: true,
    members: [
      { userId: "usr_noah", userHandle: "noah", role: "owner", joinedAt: "2025-01-10T12:00:00Z", isOnline: true, lat: 45.7640, lon: 4.8357, shareLocation: true },
      { userId: "usr_camille", userHandle: "camille", role: "member", joinedAt: "2025-01-12T18:00:00Z", isOnline: false, shareLocation: false },
    ],
    memberCount: 2,
    category: "food",
    tags: ["food", "lyon", "gastronomie", "restaurant"],
    createdAt: "2025-01-10T12:00:00Z",
    createdBy: "noah",
    totalMessages: 89,
    totalPosts: 45,
    lastActivityAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "grp_tech_startup",
    name: "Tech Entrepreneurs 💻",
    description: "Groupe privé pour les entrepreneurs tech. Échanges, conseils, networking et opportunités.",
    visibility: "private",
    joinMode: "invite_only",
    allowMemberPosts: true,
    allowMemberInvites: true,
    showMembersOnMap: false,
    members: [
      { userId: "usr_admin", userHandle: "admin", role: "owner", joinedAt: "2025-01-01T00:00:00Z", isOnline: true },
      { userId: "usr_noah", userHandle: "noah", role: "moderator", joinedAt: "2025-01-05T10:00:00Z", isOnline: true },
    ],
    memberCount: 2,
    category: "tech",
    tags: ["startup", "tech", "business", "entrepreneur"],
    createdAt: "2025-01-01T00:00:00Z",
    createdBy: "admin",
    totalMessages: 234,
    totalPosts: 12,
    lastActivityAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

// Messages de démo
const defaultMessages: GroupMessage[] = [
  {
    id: "msg_1",
    groupId: "grp_runners_paris",
    senderId: "usr_camille",
    senderHandle: "camille",
    text: "Salut à tous ! Qui est partant pour une sortie dimanche matin au Bois de Vincennes ? 🏃‍♀️",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "msg_2",
    groupId: "grp_runners_paris",
    senderId: "usr_noah",
    senderHandle: "noah",
    text: "Je suis partant ! On dit 9h au lac Daumesnil ?",
    createdAt: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    id: "msg_3",
    groupId: "grp_runners_paris",
    senderId: "usr_emma",
    senderHandle: "emma",
    text: "Parfait pour moi aussi ! J'apporte les barres énergétiques 💪",
    createdAt: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    id: "msg_4",
    groupId: "grp_foodies_lyon",
    senderId: "usr_noah",
    senderHandle: "noah",
    text: "Nouvelle découverte : le bouchon 'Chez Paul' dans le Vieux Lyon. Incroyable quenelles !",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export function useGroupsStore(currentUserHandle?: string) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [ready, setReady] = useState(false);

  // Charger les données
  useEffect(() => {
    const savedGroups = safeParse<Group[]>(localStorage.getItem(GROUPS_KEY));
    const savedMessages = safeParse<GroupMessage[]>(localStorage.getItem(GROUP_MESSAGES_KEY));
    const savedPosts = safeParse<GroupPost[]>(localStorage.getItem(GROUP_POSTS_KEY));
    const savedRequests = safeParse<JoinRequest[]>(localStorage.getItem(JOIN_REQUESTS_KEY));

    setGroups(savedGroups || defaultGroups);
    setMessages(savedMessages || defaultMessages);
    setGroupPosts(savedPosts || []);
    setJoinRequests(savedRequests || []);
    setReady(true);
  }, []);

  // Sauvegarder les groupes
  const saveGroups = useCallback((newGroups: Group[]) => {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(newGroups));
    setGroups(newGroups);
  }, []);

  // Sauvegarder les messages
  const saveMessages = useCallback((newMessages: GroupMessage[]) => {
    localStorage.setItem(GROUP_MESSAGES_KEY, JSON.stringify(newMessages));
    setMessages(newMessages);
  }, []);

  // Sauvegarder les posts
  const saveGroupPosts = useCallback((newPosts: GroupPost[]) => {
    localStorage.setItem(GROUP_POSTS_KEY, JSON.stringify(newPosts));
    setGroupPosts(newPosts);
  }, []);

  // Sauvegarder les demandes
  const saveJoinRequests = useCallback((newRequests: JoinRequest[]) => {
    localStorage.setItem(JOIN_REQUESTS_KEY, JSON.stringify(newRequests));
    setJoinRequests(newRequests);
  }, []);

  // === GESTION DES GROUPES ===

  // Créer un groupe
  const createGroup = useCallback((data: {
    name: string;
    description?: string;
    visibility: GroupVisibility;
    joinMode: GroupJoinMode;
    category?: InterestCategory;
    tags?: string[];
    showMembersOnMap?: boolean;
  }, creatorId: string, creatorHandle: string): Group => {
    const newGroup: Group = {
      id: `grp_${uid()}`,
      name: data.name,
      description: data.description,
      visibility: data.visibility,
      joinMode: data.joinMode,
      allowMemberPosts: true,
      allowMemberInvites: data.visibility === "public",
      showMembersOnMap: data.showMembersOnMap ?? true,
      members: [{
        userId: creatorId,
        userHandle: creatorHandle,
        role: "owner",
        joinedAt: new Date().toISOString(),
        isOnline: true,
        shareLocation: true,
      }],
      memberCount: 1,
      category: data.category,
      tags: data.tags,
      createdAt: new Date().toISOString(),
      createdBy: creatorHandle,
      totalMessages: 0,
      totalPosts: 0,
      lastActivityAt: new Date().toISOString(),
    };

    saveGroups([...groups, newGroup]);
    return newGroup;
  }, [groups, saveGroups]);

  // Mettre à jour un groupe
  const updateGroup = useCallback((groupId: string, updates: Partial<Group>) => {
    const newGroups = groups.map(g => 
      g.id === groupId ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
    );
    saveGroups(newGroups);
  }, [groups, saveGroups]);

  // Supprimer un groupe
  const deleteGroup = useCallback((groupId: string) => {
    saveGroups(groups.filter(g => g.id !== groupId));
    saveMessages(messages.filter(m => m.groupId !== groupId));
    saveGroupPosts(groupPosts.filter(p => p.groupId !== groupId));
  }, [groups, messages, groupPosts, saveGroups, saveMessages, saveGroupPosts]);

  // === GESTION DES MEMBRES ===

  // Rejoindre un groupe
  const joinGroup = useCallback((groupId: string, userId: string, userHandle: string): boolean => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return false;

    // Vérifier si déjà membre
    if (group.members.some(m => m.userHandle === userHandle)) return false;

    // Si groupe ouvert, rejoindre directement
    if (group.joinMode === "open") {
      const newMember: GroupMember = {
        userId: userId,
        userHandle: userHandle,
        role: "member",
        joinedAt: new Date().toISOString(),
        isOnline: true,
        shareLocation: true,
      };

      const newGroups = groups.map(g => 
        g.id === groupId 
          ? { ...g, members: [...g.members, newMember], memberCount: g.memberCount + 1 }
          : g
      );
      saveGroups(newGroups);
      return true;
    }

    return false;
  }, [groups, saveGroups]);

  // Demander à rejoindre un groupe
  const requestToJoin = useCallback((groupId: string, userId: string, userHandle: string, message?: string) => {
    const existing = joinRequests.find(r => r.groupId === groupId && r.userHandle === userHandle && r.status === "pending");
    if (existing) return;

    const newRequest: JoinRequest = {
      id: `req_${uid()}`,
      userId,
      userHandle,
      groupId,
      message,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    saveJoinRequests([...joinRequests, newRequest]);
  }, [joinRequests, saveJoinRequests]);

  // Accepter une demande
  const acceptJoinRequest = useCallback((requestId: string, reviewerHandle: string) => {
    const request = joinRequests.find(r => r.id === requestId);
    if (!request) return;

    // Ajouter le membre
    const newMember: GroupMember = {
      userId: request.userId,
      userHandle: request.userHandle,
      role: "member",
      joinedAt: new Date().toISOString(),
      isOnline: false,
      shareLocation: true,
    };

    const newGroups = groups.map(g => 
      g.id === request.groupId 
        ? { ...g, members: [...g.members, newMember], memberCount: g.memberCount + 1 }
        : g
    );
    saveGroups(newGroups);

    // Mettre à jour la demande
    const newRequests = joinRequests.map(r =>
      r.id === requestId 
        ? { ...r, status: "accepted" as const, reviewedBy: reviewerHandle, reviewedAt: new Date().toISOString() }
        : r
    );
    saveJoinRequests(newRequests);
  }, [groups, joinRequests, saveGroups, saveJoinRequests]);

  // Rejeter une demande
  const rejectJoinRequest = useCallback((requestId: string, reviewerHandle: string) => {
    const newRequests = joinRequests.map(r =>
      r.id === requestId 
        ? { ...r, status: "rejected" as const, reviewedBy: reviewerHandle, reviewedAt: new Date().toISOString() }
        : r
    );
    saveJoinRequests(newRequests);
  }, [joinRequests, saveJoinRequests]);

  // Inviter un membre
  const inviteMember = useCallback((groupId: string, userId: string, userHandle: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    if (group.members.some(m => m.userHandle === userHandle)) return;

    const newMember: GroupMember = {
      userId: userId,
      userHandle: userHandle,
      role: "member",
      joinedAt: new Date().toISOString(),
      isOnline: false,
      shareLocation: true,
    };

    const newGroups = groups.map(g => 
      g.id === groupId 
        ? { ...g, members: [...g.members, newMember], memberCount: g.memberCount + 1 }
        : g
    );
    saveGroups(newGroups);
  }, [groups, saveGroups]);

  // Retirer un membre
  const removeMember = useCallback((groupId: string, userHandle: string) => {
    const newGroups = groups.map(g => {
      if (g.id !== groupId) return g;
      const member = g.members.find(m => m.userHandle === userHandle);
      if (!member || member.role === "owner") return g; // Ne pas retirer le propriétaire
      
      return {
        ...g,
        members: g.members.filter(m => m.userHandle !== userHandle),
        memberCount: g.memberCount - 1,
      };
    });
    saveGroups(newGroups);
  }, [groups, saveGroups]);

  // Quitter un groupe
  const leaveGroup = useCallback((groupId: string, userHandle: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const member = group.members.find(m => m.userHandle === userHandle);
    if (!member) return;

    // Si c'est le propriétaire et qu'il y a d'autres membres, transférer la propriété
    if (member.role === "owner" && group.members.length > 1) {
      const newOwner = group.members.find(m => m.userHandle !== userHandle && (m.role === "admin" || m.role === "moderator"))
        || group.members.find(m => m.userHandle !== userHandle);
      
      if (newOwner) {
        const newGroups = groups.map(g => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            members: g.members
              .filter(m => m.userHandle !== userHandle)
              .map(m => m.userHandle === newOwner.userHandle ? { ...m, role: "owner" as GroupRole } : m),
            memberCount: g.memberCount - 1,
          };
        });
        saveGroups(newGroups);
      }
    } else if (member.role === "owner" && group.members.length === 1) {
      // Supprimer le groupe si le propriétaire est le seul membre
      deleteGroup(groupId);
    } else {
      removeMember(groupId, userHandle);
    }
  }, [groups, saveGroups, removeMember, deleteGroup]);

  // Changer le rôle d'un membre
  const changeMemberRole = useCallback((groupId: string, userHandle: string, newRole: GroupRole) => {
    const newGroups = groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        members: g.members.map(m => 
          m.userHandle === userHandle ? { ...m, role: newRole } : m
        ),
      };
    });
    saveGroups(newGroups);
  }, [groups, saveGroups]);

  // Mettre à jour la position d'un membre
  const updateMemberLocation = useCallback((groupId: string, userHandle: string, lat: number, lon: number) => {
    const newGroups = groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        members: g.members.map(m => 
          m.userHandle === userHandle 
            ? { ...m, lat, lon, lastSeenAt: new Date().toISOString(), isOnline: true }
            : m
        ),
      };
    });
    saveGroups(newGroups);
  }, [groups, saveGroups]);

  // Mettre à jour le statut en ligne
  const updateMemberOnlineStatus = useCallback((groupId: string, userHandle: string, isOnline: boolean) => {
    const newGroups = groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        members: g.members.map(m => 
          m.userHandle === userHandle 
            ? { ...m, isOnline, lastSeenAt: new Date().toISOString() }
            : m
        ),
      };
    });
    saveGroups(newGroups);
  }, [groups, saveGroups]);

  // === MESSAGERIE ===

  // Envoyer un message
  const sendGroupMessage = useCallback((groupId: string, senderId: string, senderHandle: string, text: string, senderAvatar?: string): GroupMessage | null => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return null;

    // Vérifier si membre
    if (!group.members.some(m => m.userHandle === senderHandle)) return null;

    // Vérifier contenu
    const flagCheck = checkMessageForFlags(text);

    const newMessage: GroupMessage = {
      id: `gmsg_${uid()}`,
      groupId,
      senderId,
      senderHandle,
      senderAvatar,
      text,
      createdAt: new Date().toISOString(),
      isFlagged: flagCheck.isFlagged,
      flagReason: flagCheck.reason,
    };

    saveMessages([...messages, newMessage]);

    // Mettre à jour les stats du groupe
    const newGroups = groups.map(g => 
      g.id === groupId 
        ? { 
            ...g, 
            totalMessages: g.totalMessages + 1, 
            lastActivityAt: new Date().toISOString(),
            flaggedMessagesCount: flagCheck.isFlagged 
              ? (g.flaggedMessagesCount || 0) + 1 
              : g.flaggedMessagesCount,
          }
        : g
    );
    saveGroups(newGroups);

    return newMessage;
  }, [groups, messages, saveMessages, saveGroups]);

  // Modifier un message
  const editGroupMessage = useCallback((messageId: string, newText: string) => {
    const flagCheck = checkMessageForFlags(newText);
    const newMessages = messages.map(m =>
      m.id === messageId 
        ? { 
            ...m, 
            text: newText, 
            editedAt: new Date().toISOString(),
            isFlagged: flagCheck.isFlagged,
            flagReason: flagCheck.reason,
          }
        : m
    );
    saveMessages(newMessages);
  }, [messages, saveMessages]);

  // Supprimer un message
  const deleteGroupMessage = useCallback((messageId: string) => {
    const newMessages = messages.map(m =>
      m.id === messageId ? { ...m, isDeleted: true, text: "[Message supprimé]" } : m
    );
    saveMessages(newMessages);
  }, [messages, saveMessages]);

  // Messages d'un groupe
  const getGroupMessages = useCallback((groupId: string) => {
    return messages
      .filter(m => m.groupId === groupId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages]);

  // === POSTS DE GROUPE ===

  // Ajouter un post au groupe
  const addPostToGroup = useCallback((groupId: string, postId: string, addedBy: string) => {
    const existing = groupPosts.find(p => p.groupId === groupId && p.postId === postId);
    if (existing) return;

    const newGroupPost: GroupPost = {
      id: `gp_${uid()}`,
      postId,
      groupId,
      addedBy,
      addedAt: new Date().toISOString(),
    };

    saveGroupPosts([...groupPosts, newGroupPost]);

    // Mettre à jour les stats
    const newGroups = groups.map(g => 
      g.id === groupId 
        ? { ...g, totalPosts: g.totalPosts + 1, lastActivityAt: new Date().toISOString() }
        : g
    );
    saveGroups(newGroups);
  }, [groups, groupPosts, saveGroupPosts, saveGroups]);

  // Retirer un post du groupe
  const removePostFromGroup = useCallback((groupId: string, postId: string) => {
    saveGroupPosts(groupPosts.filter(p => !(p.groupId === groupId && p.postId === postId)));
  }, [groupPosts, saveGroupPosts]);

  // Posts d'un groupe
  const getGroupPostIds = useCallback((groupId: string) => {
    return groupPosts.filter(p => p.groupId === groupId).map(p => p.postId);
  }, [groupPosts]);

  // === REQUÊTES ===

  // Groupes de l'utilisateur
  const userGroups = useMemo(() => {
    if (!currentUserHandle) return [];
    return groups.filter(g => g.members.some(m => m.userHandle === currentUserHandle));
  }, [groups, currentUserHandle]);

  // Groupes publics
  const publicGroups = useMemo(() => {
    return groups.filter(g => g.visibility === "public" && !g.isBanned);
  }, [groups]);

  // Demandes en attente pour un groupe
  const getPendingRequests = useCallback((groupId: string) => {
    return joinRequests.filter(r => r.groupId === groupId && r.status === "pending");
  }, [joinRequests]);

  // Chercher des groupes
  const searchGroups = useCallback((query: string) => {
    const q = query.toLowerCase();
    return groups.filter(g => 
      !g.isBanned &&
      (g.visibility === "public" || userGroups.some(ug => ug.id === g.id)) &&
      (g.name.toLowerCase().includes(q) || 
       g.description?.toLowerCase().includes(q) ||
       g.tags?.some(t => t.toLowerCase().includes(q)))
    );
  }, [groups, userGroups]);

  // Obtenir un groupe par ID
  const getGroup = useCallback((groupId: string) => {
    return groups.find(g => g.id === groupId);
  }, [groups]);

  // Vérifier si utilisateur est membre
  const isMember = useCallback((groupId: string, userHandle: string) => {
    const group = groups.find(g => g.id === groupId);
    return group?.members.some(m => m.userHandle === userHandle) ?? false;
  }, [groups]);

  // Obtenir le rôle d'un utilisateur dans un groupe
  const getMemberRole = useCallback((groupId: string, userHandle: string): GroupRole | null => {
    const group = groups.find(g => g.id === groupId);
    const member = group?.members.find(m => m.userHandle === userHandle);
    return member?.role ?? null;
  }, [groups]);

  // === MODÉRATION ADMIN ===

  // Messages flaggés
  const flaggedMessages = useMemo(() => {
    return messages.filter(m => m.isFlagged && !m.isDeleted);
  }, [messages]);

  // Groupes avec alertes
  const groupsWithAlerts = useMemo(() => {
    return groups.filter(g => (g.flaggedMessagesCount || 0) > 0);
  }, [groups]);

  // Bannir un groupe
  const banGroup = useCallback((groupId: string, reason: string) => {
    const newGroups = groups.map(g =>
      g.id === groupId
        ? { ...g, isBanned: true, bannedAt: new Date().toISOString(), bannedReason: reason }
        : g
    );
    saveGroups(newGroups);
  }, [groups, saveGroups]);

  // Débannir un groupe
  const unbanGroup = useCallback((groupId: string) => {
    const newGroups = groups.map(g =>
      g.id === groupId
        ? { ...g, isBanned: false, bannedAt: undefined, bannedReason: undefined }
        : g
    );
    saveGroups(newGroups);
  }, [groups, saveGroups]);

  // Approuver un message flaggé
  const approveMessage = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const newMessages = messages.map(m =>
      m.id === messageId ? { ...m, isFlagged: false, flagReason: undefined } : m
    );
    saveMessages(newMessages);

    // Décrémenter le compteur
    const newGroups = groups.map(g =>
      g.id === message.groupId
        ? { ...g, flaggedMessagesCount: Math.max(0, (g.flaggedMessagesCount || 0) - 1) }
        : g
    );
    saveGroups(newGroups);
  }, [messages, groups, saveMessages, saveGroups]);

  return {
    ready,
    groups,
    messages,
    
    // CRUD Groupes
    createGroup,
    updateGroup,
    deleteGroup,
    getGroup,
    searchGroups,
    
    // Membres
    joinGroup,
    requestToJoin,
    acceptJoinRequest,
    rejectJoinRequest,
    inviteMember,
    removeMember,
    leaveGroup,
    changeMemberRole,
    updateMemberLocation,
    updateMemberOnlineStatus,
    isMember,
    getMemberRole,
    getPendingRequests,
    
    // Messages
    sendGroupMessage,
    editGroupMessage,
    deleteGroupMessage,
    getGroupMessages,
    
    // Posts
    addPostToGroup,
    removePostFromGroup,
    getGroupPostIds,
    
    // Listes
    userGroups,
    publicGroups,
    joinRequests,
    
    // Modération
    flaggedMessages,
    groupsWithAlerts,
    banGroup,
    unbanGroup,
    approveMessage,
  };
}
