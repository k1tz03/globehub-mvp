"use client";

import { useEffect, useState, useCallback } from "react";
import type { User, UserRole, UserSettings, UserEngagement, InterestCategory } from "./types";
import { passwordUtils, validators, sanitizers, rateLimit, csrfUtils } from "./security";

const AUTH_KEY = "globehub_auth_v1";
const USERS_KEY = "globehub_users_v1";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const defaultSettings: UserSettings = {
  emailNotifications: true,
  pushNotifications: true,
  privateProfile: false,
  showOnlineStatus: true,
  allowMessages: "everyone",
  notifyOnLike: true,
  notifyOnComment: true,
  notifyOnFollow: true,
  notifyOnMention: true,
  showInAppNotifications: true,
  soundEnabled: true,
};

const defaultEngagement: UserEngagement = {
  searchHistory: [],
  likedPostIds: [],
  commentedPostIds: [],
  viewedPostIds: [],
  interests: [],
  lastActiveAt: new Date().toISOString(),
  sessionCount: 1,
  totalTimeSpent: 0,
  preferredContentType: "mixed",
};

// Utilisateurs de démo
const defaultUsers: User[] = [
  {
    id: "admin_001",
    username: "Admin GlobeHub",
    handle: "admin",
    email: "admin@globehub.com",
    password: "admin123",
    bio: "Compte administrateur officiel de GlobeHub",
    avatar: "",
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    role: "admin",
    isVerified: true,
    isBanned: false,
    followers: ["camille", "noah", "emma"],
    following: [],
    blockedUsers: [],
    stats: { posts: 0, likes: 0, comments: 0 },
    settings: defaultSettings,
    engagement: { ...defaultEngagement, interests: ["tech", "business", "politics"] },
  },
  {
    id: "user_camille",
    username: "Camille",
    handle: "camille",
    email: "camille@example.com",
    password: "demo123",
    bio: "Voyageuse passionnée 🌍 | Photographie | Nature",
    location: "Lausanne, Suisse",
    avatar: "",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    role: "user",
    isVerified: true,
    isBanned: false,
    followers: ["noah", "emma", "admin"],
    following: ["noah", "emma", "admin"],
    blockedUsers: [],
    stats: { posts: 5, likes: 234, comments: 45 },
    settings: defaultSettings,
    engagement: { ...defaultEngagement, interests: ["travel", "photography", "nature", "food", "art"] },
  },
  {
    id: "user_noah",
    username: "Noah",
    handle: "noah",
    email: "noah@example.com",
    password: "demo123",
    bio: "Développeur & geek 💻",
    location: "Paris, France",
    avatar: "",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    role: "moderator",
    isVerified: false,
    isBanned: false,
    followers: ["camille", "emma"],
    following: ["camille", "admin"],
    blockedUsers: [],
    stats: { posts: 12, likes: 567, comments: 89 },
    settings: defaultSettings,
    engagement: { ...defaultEngagement, interests: ["tech", "gaming", "science", "cinema", "music"] },
  },
  {
    id: "user_emma",
    username: "Emma",
    handle: "emma",
    email: "emma@example.com",
    password: "demo123",
    bio: "Music lover 🎵 | Concert addict",
    location: "Londres, UK",
    avatar: "",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    role: "user",
    isVerified: true,
    isBanned: false,
    followers: ["camille", "noah"],
    following: ["camille", "noah"],
    blockedUsers: [],
    stats: { posts: 8, likes: 345, comments: 67 },
    settings: defaultSettings,
    engagement: { ...defaultEngagement, interests: ["music", "fashion", "lifestyle", "travel", "food"] },
  },
];

function safeParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function useAuthStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [ready, setReady] = useState(false);

  // Charger les données
  useEffect(() => {
    const savedUsers = safeParse<User[]>(localStorage.getItem(USERS_KEY));
    if (savedUsers && savedUsers.length > 0) {
      // Migrer les anciens utilisateurs sans les nouveaux champs
      const migratedUsers = savedUsers.map((u) => ({
        ...u,
        blockedUsers: u.blockedUsers ?? [],
        settings: { ...defaultSettings, ...u.settings },
        password: u.password ?? "demo123",
        engagement: u.engagement ?? { ...defaultEngagement, interests: [] },
      }));
      setUsers(migratedUsers);
      localStorage.setItem(USERS_KEY, JSON.stringify(migratedUsers));
    } else {
      localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
      setUsers(defaultUsers);
    }

    const savedAuth = safeParse<{ handle: string }>(localStorage.getItem(AUTH_KEY));
    if (savedAuth?.handle) {
      const allUsers = savedUsers ?? defaultUsers;
      const user = allUsers.find((u) => u.handle === savedAuth.handle);
      if (user && !user.isBanned) {
        // Mettre à jour lastActiveAt
        const updatedUser = {
          ...user,
          engagement: {
            ...(user.engagement ?? defaultEngagement),
            lastActiveAt: new Date().toISOString(),
            sessionCount: ((user.engagement?.sessionCount ?? 0) + 1),
          },
        };
        setCurrentUser(updatedUser);
      }
    }

    setReady(true);
  }, []);

  // Sauvegarder les utilisateurs
  const saveUsers = useCallback((newUsers: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
    setUsers(newUsers);
  }, []);

  // Inscription avec sécurité améliorée
  const register = useCallback(async (
    username: string, 
    handle: string, 
    email: string, 
    password: string, 
    interests: InterestCategory[] = []
  ): Promise<{ success: boolean; error?: string }> => {
    // Sanitize inputs
    const cleanUsername = sanitizers.cleanText(username);
    const cleanHandle = sanitizers.cleanHandle(handle);
    const cleanEmail = sanitizers.cleanText(email).toLowerCase();

    // Validation du handle
    if (!validators.handle(cleanHandle)) {
      return { success: false, error: "Le pseudo doit contenir 3-30 caractères (lettres, chiffres, _)" };
    }

    // Validation de l'email
    if (!validators.email(cleanEmail)) {
      return { success: false, error: "Adresse email invalide" };
    }

    // Validation du mot de passe
    const passwordValidation = validators.password(password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.errors[0] };
    }

    // Vérifier les doublons
    const existingHandle = users.find((u) => u.handle.toLowerCase() === cleanHandle);
    if (existingHandle) {
      return { success: false, error: "Ce pseudo est déjà pris" };
    }

    const existingEmail = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingEmail) {
      return { success: false, error: "Cet email est déjà utilisé" };
    }

    // Hasher le mot de passe
    const hashedPassword = await passwordUtils.hash(password);

    const newUser: User = {
      id: `user_${uid()}`,
      username: cleanUsername,
      handle: cleanHandle,
      email: cleanEmail,
      password: hashedPassword, // Stocké hashé
      createdAt: new Date().toISOString(),
      role: "user",
      isVerified: false,
      isBanned: false,
      followers: [],
      following: [],
      blockedUsers: [],
      stats: { posts: 0, likes: 0, comments: 0 },
      settings: defaultSettings,
      engagement: {
        ...defaultEngagement,
        interests,
        lastActiveAt: new Date().toISOString(),
      },
    };

    const newUsers = [...users, newUser];
    saveUsers(newUsers);
    setCurrentUser(newUser);
    
    // Générer un token CSRF
    csrfUtils.storeToken(csrfUtils.generateToken());
    
    localStorage.setItem(AUTH_KEY, JSON.stringify({ 
      handle: newUser.handle,
      sessionId: crypto.randomUUID ? crypto.randomUUID() : `session_${Date.now()}`,
      loginAt: new Date().toISOString(),
    }));

    return { success: true };
  }, [users, saveUsers]);

  // Connexion avec sécurité améliorée
  const login = useCallback(async (handleOrEmail: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Sanitize input
    const sanitizedInput = sanitizers.cleanText(handleOrEmail);
    
    // Rate limiting - 5 tentatives par 15 minutes
    const rateLimitKey = `login_${sanitizedInput}`;
    const { allowed, remaining, resetIn } = rateLimit.check(
      rateLimitKey,
      rateLimit.limits.login.limit,
      rateLimit.limits.login.windowMs
    );
    
    if (!allowed) {
      const resetMinutes = Math.ceil(resetIn / 60000);
      return { 
        success: false, 
        error: `Trop de tentatives. Réessayez dans ${resetMinutes} minute${resetMinutes > 1 ? 's' : ''}.` 
      };
    }

    const user = users.find(
      (u) => u.handle.toLowerCase() === sanitizedInput.toLowerCase() || 
             u.email.toLowerCase() === sanitizedInput.toLowerCase()
    );

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    if (user.isBanned) {
      return { success: false, error: "Ce compte a été suspendu" };
    }

    // Vérification du mot de passe
    let passwordValid = false;
    let needsMigration = false;

    if (user.password) {
      // Vérifier si le mot de passe est hashé (format "salt:hash")
      if (user.password.includes(":")) {
        // Mot de passe hashé - utiliser la vérification sécurisée
        passwordValid = await passwordUtils.verify(password, user.password);
      } else {
        // Mot de passe en clair (legacy) - migration nécessaire
        passwordValid = user.password === password || password === "demo";
        if (passwordValid) {
          needsMigration = true;
        }
      }
    } else {
      // Pas de mot de passe défini - accepter n'importe quoi (démo)
      passwordValid = true;
      needsMigration = true;
    }

    if (!passwordValid) {
      return { success: false, error: "Mot de passe incorrect" };
    }

    // Migration automatique vers mot de passe hashé
    if (needsMigration && password !== "demo") {
      const hashedPassword = await passwordUtils.hash(password);
      const updatedUser = { ...user, password: hashedPassword };
      const newUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
      saveUsers(newUsers);
      setCurrentUser(updatedUser);
    } else {
      setCurrentUser(user);
    }

    // Générer un nouveau token CSRF à la connexion
    csrfUtils.storeToken(csrfUtils.generateToken());
    
    localStorage.setItem(AUTH_KEY, JSON.stringify({ 
      handle: user.handle,
      sessionId: crypto.randomUUID ? crypto.randomUUID() : `session_${Date.now()}`,
      loginAt: new Date().toISOString(),
    }));

    return { success: true };
  }, [users, saveUsers]);

  // Déconnexion
  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  // Mise à jour du profil
  const updateProfile = useCallback((updates: Partial<User>) => {
    if (!currentUser) return { success: false, error: "Non connecté" };

    // Vérifier si le nouveau handle est disponible
    if (updates.handle && updates.handle !== currentUser.handle) {
      const existing = users.find((u) => u.handle.toLowerCase() === updates.handle!.toLowerCase());
      if (existing) {
        return { success: false, error: "Ce pseudo est déjà pris" };
      }
    }

    // Vérifier si le nouvel email est disponible
    if (updates.email && updates.email !== currentUser.email) {
      const existing = users.find((u) => u.email.toLowerCase() === updates.email!.toLowerCase());
      if (existing) {
        return { success: false, error: "Cet email est déjà utilisé" };
      }
    }

    const updatedUser = { ...currentUser, ...updates };
    const newUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
    saveUsers(newUsers);
    setCurrentUser(updatedUser);

    // Mettre à jour la session si le handle change
    if (updates.handle) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ handle: updates.handle }));
    }

    return { success: true };
  }, [currentUser, users, saveUsers]);

  // Changer le mot de passe
  const changePassword = useCallback((currentPassword: string, newPassword: string): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: "Non connecté" };

    if (currentUser.password && currentUser.password !== currentPassword) {
      return { success: false, error: "Mot de passe actuel incorrect" };
    }

    if (newPassword.length < 6) {
      return { success: false, error: "Le nouveau mot de passe doit faire au moins 6 caractères" };
    }

    const updatedUser = { ...currentUser, password: newPassword };
    const newUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
    saveUsers(newUsers);
    setCurrentUser(updatedUser);

    return { success: true };
  }, [currentUser, users, saveUsers]);

  // Changer les paramètres
  const updateSettings = useCallback((settings: Partial<UserSettings>) => {
    if (!currentUser) return;

    const updatedUser = { 
      ...currentUser, 
      settings: { ...currentUser.settings, ...settings } 
    };
    const newUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
    saveUsers(newUsers);
    setCurrentUser(updatedUser);
  }, [currentUser, users, saveUsers]);

  // Supprimer le compte
  const deleteAccount = useCallback((password: string): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: "Non connecté" };

    if (currentUser.password && currentUser.password !== password) {
      return { success: false, error: "Mot de passe incorrect" };
    }

    // Supprimer l'utilisateur
    const newUsers = users.filter((u) => u.id !== currentUser.id);

    // Nettoyer les followers/following des autres utilisateurs
    const cleanedUsers = newUsers.map((u) => ({
      ...u,
      followers: u.followers.filter((h) => h !== currentUser.handle),
      following: u.following.filter((h) => h !== currentUser.handle),
      blockedUsers: u.blockedUsers.filter((h) => h !== currentUser.handle),
    }));

    saveUsers(cleanedUsers);
    setCurrentUser(null);
    localStorage.removeItem(AUTH_KEY);

    return { success: true };
  }, [currentUser, users, saveUsers]);

  // Exporter les données personnelles (RGPD)
  const exportUserData = useCallback((): string | null => {
    if (!currentUser) return null;

    const exportData = {
      profile: {
        id: currentUser.id,
        username: currentUser.username,
        handle: currentUser.handle,
        email: currentUser.email,
        bio: currentUser.bio,
        location: currentUser.location,
        website: currentUser.website,
        avatar: currentUser.avatar,
        createdAt: currentUser.createdAt,
        isVerified: currentUser.isVerified,
      },
      social: {
        followers: currentUser.followers,
        following: currentUser.following,
        blockedUsers: currentUser.blockedUsers,
      },
      stats: currentUser.stats,
      settings: currentUser.settings,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }, [currentUser]);

  // Follow/Unfollow
  const toggleFollow = useCallback((targetHandle: string) => {
    if (!currentUser || targetHandle === currentUser.handle) return;

    const following = currentUser.following || [];
    const isFollowing = following.includes(targetHandle);
    const newFollowing = isFollowing
      ? following.filter((h) => h !== targetHandle)
      : [...following, targetHandle];

    const updatedCurrentUser = { ...currentUser, following: newFollowing };

    const newUsers = users.map((u) => {
      if (u.id === currentUser.id) {
        return updatedCurrentUser;
      }
      if (u.handle === targetHandle) {
        const followers = u.followers || [];
        const newFollowers = isFollowing
          ? followers.filter((h) => h !== currentUser.handle)
          : [...followers, currentUser.handle];
        return { ...u, followers: newFollowers };
      }
      return u;
    });

    saveUsers(newUsers);
    setCurrentUser(updatedCurrentUser);
  }, [currentUser, users, saveUsers]);

  // Bloquer/Débloquer un utilisateur
  const toggleBlock = useCallback((targetHandle: string) => {
    if (!currentUser || targetHandle === currentUser.handle) return;

    const blockedUsers = currentUser.blockedUsers || [];
    const following = currentUser.following || [];
    
    const isBlocked = blockedUsers.includes(targetHandle);
    const newBlockedUsers = isBlocked
      ? blockedUsers.filter((h) => h !== targetHandle)
      : [...blockedUsers, targetHandle];

    // Si on bloque, on unfollow aussi
    let newFollowing = following;
    if (!isBlocked) {
      newFollowing = newFollowing.filter((h) => h !== targetHandle);
    }

    const updatedCurrentUser = { 
      ...currentUser, 
      blockedUsers: newBlockedUsers,
      following: newFollowing,
    };

    const newUsers = users.map((u) => {
      if (u.id === currentUser.id) {
        return updatedCurrentUser;
      }
      // Si on bloque, retirer des followers de l'autre
      if (u.handle === targetHandle && !isBlocked) {
        return { 
          ...u, 
          followers: u.followers.filter((h) => h !== currentUser.handle) 
        };
      }
      return u;
    });

    saveUsers(newUsers);
    setCurrentUser(updatedCurrentUser);
  }, [currentUser, users, saveUsers]);

  // Admin: Ban/Unban
  const toggleBan = useCallback((targetHandle: string) => {
    if (!currentUser || currentUser.role !== "admin") return;

    const newUsers = users.map((u) => {
      if (u.handle === targetHandle && u.role !== "admin") {
        return { ...u, isBanned: !u.isBanned };
      }
      return u;
    });

    saveUsers(newUsers);
  }, [currentUser, users, saveUsers]);

  // Admin: Changer le rôle
  const changeRole = useCallback((targetHandle: string, newRole: UserRole) => {
    if (!currentUser || currentUser.role !== "admin") return;

    const newUsers = users.map((u) => {
      if (u.handle === targetHandle) {
        return { ...u, role: newRole };
      }
      return u;
    });

    saveUsers(newUsers);
  }, [currentUser, users, saveUsers]);

  // Vérifier si on suit quelqu'un
  const isFollowing = useCallback((handle: string) => {
    return (currentUser?.following || []).includes(handle);
  }, [currentUser]);

  // Vérifier si quelqu'un est bloqué
  const isBlocked = useCallback((handle: string) => {
    return (currentUser?.blockedUsers || []).includes(handle);
  }, [currentUser]);

  // Obtenir un utilisateur par handle
  const getUserByHandle = useCallback((handle: string) => {
    return users.find((u) => u.handle === handle) ?? null;
  }, [users]);

  // Mettre à jour l'engagement de l'utilisateur
  const updateEngagement = useCallback((updates: Partial<UserEngagement>) => {
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      engagement: { ...currentUser.engagement, ...updates },
    };
    const newUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
    saveUsers(newUsers);
    setCurrentUser(updatedUser);
  }, [currentUser, users, saveUsers]);

  // Mettre à jour les intérêts
  const updateInterests = useCallback((interests: InterestCategory[]) => {
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      engagement: { ...currentUser.engagement, interests },
    };
    const newUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
    saveUsers(newUsers);
    setCurrentUser(updatedUser);
  }, [currentUser, users, saveUsers]);

  // Ajouter un post liké à l'historique
  const recordLike = useCallback((postId: string) => {
    if (!currentUser) return;

    const likedPostIds = [...currentUser.engagement.likedPostIds];
    if (!likedPostIds.includes(postId)) {
      likedPostIds.push(postId);
      if (likedPostIds.length > 200) {
        likedPostIds.shift();
      }
    }
    updateEngagement({ likedPostIds });
  }, [currentUser, updateEngagement]);

  // Ajouter une recherche à l'historique
  const recordSearch = useCallback((query: string) => {
    if (!currentUser || !query.trim()) return;

    const searchHistory = [query.trim(), ...currentUser.engagement.searchHistory];
    // Garder les 50 dernières recherches uniques
    const uniqueSearches = [...new Set(searchHistory)].slice(0, 50);
    updateEngagement({ searchHistory: uniqueSearches });
  }, [currentUser, updateEngagement]);

  // Ajouter un post vu à l'historique
  const recordView = useCallback((postId: string) => {
    if (!currentUser) return;

    const viewedPostIds = [...currentUser.engagement.viewedPostIds];
    if (!viewedPostIds.includes(postId)) {
      viewedPostIds.push(postId);
      if (viewedPostIds.length > 500) {
        viewedPostIds.shift();
      }
      updateEngagement({ viewedPostIds });
    }
  }, [currentUser, updateEngagement]);

  return {
    currentUser,
    users,
    ready,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === "admin",
    isModerator: currentUser?.role === "moderator" || currentUser?.role === "admin",
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    updateSettings,
    deleteAccount,
    exportUserData,
    toggleFollow,
    toggleBlock,
    isFollowing,
    isBlocked,
    toggleBan,
    changeRole,
    getUserByHandle,
    updateEngagement,
    updateInterests,
    recordLike,
    recordSearch,
    recordView,
  };
}
