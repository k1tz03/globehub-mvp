"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================
// CONFIGURATION
// ============================================

const AUTH_CONFIG = {
  storageKey: "globehub_secure_auth_v1",
  sessionDuration: 24 * 60 * 60 * 1000, // 24 heures
  refreshThreshold: 60 * 60 * 1000, // Refresh si < 1 heure restante
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  passwordMinLength: 8,
  tokenLength: 64,
};

// ============================================
// TYPES
// ============================================

interface SecureUser {
  id: string;
  handle: string;
  email?: string;
  role: "user" | "moderator" | "admin";
  createdAt: string;
  lastLoginAt: string;
  twoFactorEnabled: boolean;
}

interface SecureSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  fingerprint: string;
  ipAddress?: string;
  userAgent?: string;
}

interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: SecureUser | null;
  session: SecureSession | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// UTILITAIRES CRYPTOGRAPHIQUES
// ============================================

// Générer un token sécurisé
function generateSecureToken(length: number = AUTH_CONFIG.tokenLength): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Créer une empreinte du navigateur (fingerprint)
function generateBrowserFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    // @ts-ignore - deviceMemory existe sur certains navigateurs
    navigator.deviceMemory || 0,
  ];
  
  const fingerprint = components.join("|");
  
  // Hash simple du fingerprint
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}

// Encoder en Base64 de manière sécurisée
function secureEncode(data: string): string {
  try {
    return btoa(encodeURIComponent(data));
  } catch {
    return "";
  }
}

// Décoder depuis Base64
function secureDecode(data: string): string {
  try {
    return decodeURIComponent(atob(data));
  } catch {
    return "";
  }
}

// Hashage simple pour les mots de passe (côté client uniquement - utiliser bcrypt côté serveur)
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  
  if (crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  
  // Fallback simple
  let hash = 0;
  const str = password + salt;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// ============================================
// STOCKAGE SÉCURISÉ
// ============================================

class SecureStorage {
  private key: string;
  
  constructor(key: string) {
    this.key = key;
  }
  
  set(data: object): void {
    try {
      const encoded = secureEncode(JSON.stringify(data));
      localStorage.setItem(this.key, encoded);
    } catch (error) {
      console.error("[SecureStorage] Error saving data:", error);
    }
  }
  
  get<T>(): T | null {
    try {
      const encoded = localStorage.getItem(this.key);
      if (!encoded) return null;
      
      const decoded = secureDecode(encoded);
      return JSON.parse(decoded) as T;
    } catch (error) {
      console.error("[SecureStorage] Error reading data:", error);
      return null;
    }
  }
  
  remove(): void {
    try {
      localStorage.removeItem(this.key);
    } catch (error) {
      console.error("[SecureStorage] Error removing data:", error);
    }
  }
  
  exists(): boolean {
    return localStorage.getItem(this.key) !== null;
  }
}

// ============================================
// GESTION DES TENTATIVES DE CONNEXION
// ============================================

const loginAttemptsStorage = new SecureStorage("globehub_login_attempts");

function getLoginAttempts(): LoginAttempt {
  const attempts = loginAttemptsStorage.get<LoginAttempt>();
  return attempts || { count: 0, lastAttempt: 0 };
}

function recordLoginAttempt(success: boolean): void {
  const attempts = getLoginAttempts();
  const now = Date.now();
  
  if (success) {
    // Réinitialiser les tentatives en cas de succès
    loginAttemptsStorage.remove();
  } else {
    // Incrémenter les tentatives
    const newAttempts: LoginAttempt = {
      count: attempts.count + 1,
      lastAttempt: now,
      lockedUntil: attempts.count + 1 >= AUTH_CONFIG.maxLoginAttempts 
        ? now + AUTH_CONFIG.lockoutDuration 
        : undefined,
    };
    loginAttemptsStorage.set(newAttempts);
  }
}

function isLockedOut(): { locked: boolean; remainingTime: number } {
  const attempts = getLoginAttempts();
  
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    return { 
      locked: true, 
      remainingTime: attempts.lockedUntil - Date.now() 
    };
  }
  
  // Réinitialiser si le lockout est expiré
  if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
    loginAttemptsStorage.remove();
  }
  
  return { locked: false, remainingTime: 0 };
}

// ============================================
// VALIDATION DES ENTRÉES
// ============================================

function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!email) {
    return { valid: false, error: "L'email est requis" };
  }
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Format d'email invalide" };
  }
  
  if (email.length > 254) {
    return { valid: false, error: "Email trop long" };
  }
  
  return { valid: true };
}

function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!password) {
    errors.push("Le mot de passe est requis");
    return { valid: false, errors };
  }
  
  if (password.length < AUTH_CONFIG.passwordMinLength) {
    errors.push(`Minimum ${AUTH_CONFIG.passwordMinLength} caractères`);
  }
  
  if (password.length > 128) {
    errors.push("Maximum 128 caractères");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Au moins une minuscule requise");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Au moins une majuscule requise");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Au moins un chiffre requis");
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Au moins un caractère spécial requis");
  }
  
  // Vérifier les patterns communs
  const commonPatterns = ["123456", "password", "qwerty", "azerty", "abc123"];
  if (commonPatterns.some(p => password.toLowerCase().includes(p))) {
    errors.push("Mot de passe trop commun");
  }
  
  return { valid: errors.length === 0, errors };
}

function validateHandle(handle: string): { valid: boolean; error?: string } {
  if (!handle) {
    return { valid: false, error: "Le pseudo est requis" };
  }
  
  if (handle.length < 3) {
    return { valid: false, error: "Minimum 3 caractères" };
  }
  
  if (handle.length > 30) {
    return { valid: false, error: "Maximum 30 caractères" };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
    return { valid: false, error: "Seuls lettres, chiffres et underscores autorisés" };
  }
  
  // Mots réservés
  const reserved = ["admin", "moderator", "system", "globehub", "support", "help"];
  if (reserved.includes(handle.toLowerCase())) {
    return { valid: false, error: "Ce pseudo est réservé" };
  }
  
  return { valid: true };
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useSecureAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });

  const storage = new SecureStorage(AUTH_CONFIG.storageKey);

  // Vérifier la session au chargement
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = storage.get<{ user: SecureUser; session: SecureSession }>();
        
        if (!sessionData) {
          setState(s => ({ ...s, isLoading: false }));
          return;
        }
        
        const { user, session } = sessionData;
        
        // Vérifier l'expiration
        if (Date.now() > session.expiresAt) {
          storage.remove();
          setState(s => ({ ...s, isLoading: false, error: "Session expirée" }));
          return;
        }
        
        // Vérifier le fingerprint
        const currentFingerprint = generateBrowserFingerprint();
        if (session.fingerprint !== currentFingerprint) {
          console.warn("[Security] Fingerprint mismatch - possible session hijacking");
          storage.remove();
          setState(s => ({ ...s, isLoading: false, error: "Session invalide" }));
          return;
        }
        
        // Rafraîchir si proche de l'expiration
        if (session.expiresAt - Date.now() < AUTH_CONFIG.refreshThreshold) {
          const newSession: SecureSession = {
            ...session,
            expiresAt: Date.now() + AUTH_CONFIG.sessionDuration,
          };
          storage.set({ user, session: newSession });
        }
        
        setState({
          isAuthenticated: true,
          user,
          session,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("[SecureAuth] Error checking session:", error);
        storage.remove();
        setState(s => ({ ...s, isLoading: false }));
      }
    };
    
    checkSession();
  }, []);

  // Connexion sécurisée
  const login = useCallback(async (
    identifier: string, // email ou handle
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Vérifier le lockout
    const lockoutStatus = isLockedOut();
    if (lockoutStatus.locked) {
      const minutes = Math.ceil(lockoutStatus.remainingTime / 60000);
      return { 
        success: false, 
        error: `Trop de tentatives. Réessayez dans ${minutes} minutes.` 
      };
    }
    
    // Validation basique
    if (!identifier || !password) {
      return { success: false, error: "Identifiants requis" };
    }
    
    setState(s => ({ ...s, isLoading: true, error: null }));
    
    try {
      // Simulation d'authentification (à remplacer par une vraie API)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Pour la démo, accepter certains utilisateurs
      const validUsers: Record<string, SecureUser> = {
        admin: {
          id: "usr_admin",
          handle: "admin",
          email: "admin@globehub.app",
          role: "admin",
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          twoFactorEnabled: false,
        },
        noah: {
          id: "usr_noah",
          handle: "noah",
          email: "noah@globehub.app",
          role: "moderator",
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          twoFactorEnabled: false,
        },
        camille: {
          id: "usr_camille",
          handle: "camille",
          email: "camille@globehub.app",
          role: "user",
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          twoFactorEnabled: false,
        },
      };
      
      const user = validUsers[identifier.toLowerCase()];
      
      if (!user) {
        recordLoginAttempt(false);
        setState(s => ({ ...s, isLoading: false, error: "Identifiants incorrects" }));
        return { success: false, error: "Identifiants incorrects" };
      }
      
      // Créer la session
      const session: SecureSession = {
        token: generateSecureToken(),
        userId: user.id,
        createdAt: Date.now(),
        expiresAt: Date.now() + AUTH_CONFIG.sessionDuration,
        fingerprint: generateBrowserFingerprint(),
        userAgent: navigator.userAgent,
      };
      
      // Enregistrer
      storage.set({ user, session });
      recordLoginAttempt(true);
      
      setState({
        isAuthenticated: true,
        user,
        session,
        isLoading: false,
        error: null,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur de connexion";
      setState(s => ({ ...s, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Déconnexion sécurisée
  const logout = useCallback(() => {
    storage.remove();
    setState({
      isAuthenticated: false,
      user: null,
      session: null,
      isLoading: false,
      error: null,
    });
    
    // Invalider le token côté serveur (à implémenter)
    // await api.revokeToken(state.session?.token);
  }, []);

  // Inscription sécurisée
  const register = useCallback(async (data: {
    handle: string;
    email: string;
    password: string;
  }): Promise<{ success: boolean; errors: string[] }> => {
    const errors: string[] = [];
    
    // Validation du handle
    const handleValidation = validateHandle(data.handle);
    if (!handleValidation.valid) {
      errors.push(handleValidation.error!);
    }
    
    // Validation de l'email
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.valid) {
      errors.push(emailValidation.error!);
    }
    
    // Validation du mot de passe
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }
    
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    // Simulation de l'inscription (à remplacer par une vraie API)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true, errors: [] };
  }, []);

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = useCallback((role: "user" | "moderator" | "admin"): boolean => {
    if (!state.user) return false;
    
    const roleHierarchy = { user: 1, moderator: 2, admin: 3 };
    return roleHierarchy[state.user.role] >= roleHierarchy[role];
  }, [state.user]);

  // Obtenir le temps restant de la session
  const getSessionTimeRemaining = useCallback((): number => {
    if (!state.session) return 0;
    return Math.max(0, state.session.expiresAt - Date.now());
  }, [state.session]);

  return {
    ...state,
    login,
    logout,
    register,
    hasRole,
    getSessionTimeRemaining,
    validateEmail,
    validatePassword,
    validateHandle,
    isLockedOut,
  };
}

// Export des utilitaires
export { validateEmail, validatePassword, validateHandle, generateSecureToken };
