"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import Link from "next/link";
import { useAuthStore } from "@/lib/useAuthStore";
import { useCookieConsentStore } from "@/lib/useCookieConsentStore";
import { CompactInterestSelector } from "@/components/InterestSelector";
import type { InterestCategory } from "@/lib/types";

type SettingsTab = "profile" | "account" | "security" | "privacy" | "notifications" | "interests" | "blocked" | "data";

// Composant Toggle réutilisable
function Toggle({ enabled, onChange, disabled = false }: { enabled: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={clsx(
        "relative h-6 w-11 rounded-full transition-colors",
        enabled ? "bg-fuchsia-500" : "bg-neutral-300 dark:bg-neutral-700",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className={clsx(
        "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm",
        enabled ? "left-[22px]" : "left-0.5"
      )} />
    </button>
  );
}

// Indicateur de force du mot de passe
function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    
    if (score <= 1) return { score: 1, label: "Très faible", color: "bg-rose-500" };
    if (score === 2) return { score: 2, label: "Faible", color: "bg-orange-500" };
    if (score === 3) return { score: 3, label: "Moyen", color: "bg-amber-500" };
    if (score === 4) return { score: 4, label: "Fort", color: "bg-emerald-500" };
    return { score: 5, label: "Très fort", color: "bg-emerald-600" };
  };
  
  const strength = getStrength();
  if (!password) return null;
  
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={clsx(
              "h-1 flex-1 rounded-full transition-colors",
              i <= strength.score ? strength.color : "bg-neutral-200 dark:bg-neutral-700"
            )}
          />
        ))}
      </div>
      <p className={clsx("mt-1 text-xs", strength.score <= 2 ? "text-rose-500" : "text-emerald-500")}>
        {strength.label}
      </p>
    </div>
  );
}

// Privacy Settings Component with Consent Management
function PrivacySettings({
  currentUser,
  updateSettings,
  showMessage
}: {
  currentUser: ReturnType<typeof useAuthStore>["currentUser"];
  updateSettings: ReturnType<typeof useAuthStore>["updateSettings"];
  showMessage: (type: "success" | "error", text: string) => void;
}) {
  const { consent, openPreferences, resetConsent } = useCookieConsentStore();

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      {/* Paramètres de confidentialité du profil */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
        <h2 className="mb-6 text-lg font-bold">Paramètres de confidentialité</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div><p className="font-medium">Profil privé</p><p className="text-sm text-neutral-500">Seuls vos abonnés peuvent voir vos posts</p></div>
            <Toggle enabled={currentUser.settings.privateProfile} onChange={() => updateSettings({ privateProfile: !currentUser.settings.privateProfile })} />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="font-medium">Statut en ligne visible</p><p className="text-sm text-neutral-500">Les autres peuvent voir quand vous êtes en ligne</p></div>
            <Toggle enabled={currentUser.settings.showOnlineStatus} onChange={() => updateSettings({ showOnlineStatus: !currentUser.settings.showOnlineStatus })} />
          </div>
          <div>
            <p className="mb-2 font-medium">Qui peut m&apos;envoyer des messages</p>
            <select value={currentUser.settings.allowMessages} onChange={(e) => updateSettings({ allowMessages: e.target.value as "everyone" | "followers" | "none" })}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-fuchsia-400 dark:border-neutral-700 dark:bg-neutral-800">
              <option value="everyone">Tout le monde</option>
              <option value="followers">Mes abonnés uniquement</option>
              <option value="none">Personne</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gestion des cookies et consentements (RGPD) */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
        <h2 className="mb-2 text-lg font-bold">Cookies et traceurs</h2>
        <p className="mb-6 text-sm text-neutral-500">
          Gérez vos préférences de cookies conformément au RGPD et à la directive ePrivacy.
        </p>

        {consent ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
              <p className="text-sm font-medium mb-3">Vos choix actuels :</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className={consent.necessary ? "text-emerald-500" : "text-neutral-400"}>
                    {consent.necessary ? "✓" : "✗"}
                  </span>
                  <span>Essentiels (obligatoire)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={consent.functional ? "text-emerald-500" : "text-neutral-400"}>
                    {consent.functional ? "✓" : "✗"}
                  </span>
                  <span>Fonctionnels</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={consent.analytics ? "text-emerald-500" : "text-neutral-400"}>
                    {consent.analytics ? "✓" : "✗"}
                  </span>
                  <span>Analytiques</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={consent.marketing ? "text-emerald-500" : "text-neutral-400"}>
                    {consent.marketing ? "✓" : "✗"}
                  </span>
                  <span>Marketing</span>
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-3">
                Consentement donné le {new Date(consent.timestamp).toLocaleDateString("fr-FR", { dateStyle: "long" })}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={openPreferences}
                className="flex-1 rounded-xl bg-neutral-100 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Modifier mes préférences
              </button>
              <button
                onClick={() => {
                  resetConsent();
                  showMessage("success", "Vos préférences de cookies ont été réinitialisées");
                }}
                className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={openPreferences}
            className="w-full rounded-xl bg-fuchsia-500 py-3 text-sm font-medium text-white transition-colors hover:bg-fuchsia-600"
          >
            Configurer mes préférences de cookies
          </button>
        )}
      </div>

      {/* Personnalisation algorithmique */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
        <h2 className="mb-2 text-lg font-bold">Personnalisation du contenu</h2>
        <p className="mb-6 text-sm text-neutral-500">
          Conformément au DSA, vous pouvez désactiver la personnalisation algorithmique.
        </p>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Fil personnalisé</p>
              <p className="text-sm text-neutral-500">Afficher les posts selon vos centres d&apos;intérêt</p>
            </div>
            <Toggle
              enabled={true}
              onChange={() => showMessage("success", "Préférence enregistrée")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Suggestions de comptes</p>
              <p className="text-sm text-neutral-500">Recevoir des suggestions basées sur votre activité</p>
            </div>
            <Toggle
              enabled={true}
              onChange={() => showMessage("success", "Préférence enregistrée")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Publicités personnalisées</p>
              <p className="text-sm text-neutral-500">Voir des publicités basées sur vos intérêts</p>
            </div>
            <Toggle
              enabled={consent?.marketing ?? false}
              onChange={openPreferences}
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            ℹ️ En savoir plus sur{" "}
            <Link href="/transparency" className="underline hover:no-underline">
              notre algorithme de recommandation
            </Link>
          </p>
        </div>
      </div>

      {/* Liens utiles */}
      <div className="rounded-2xl bg-neutral-50 p-6 dark:bg-neutral-800/50">
        <h3 className="font-medium mb-4">Vos droits RGPD</h3>
        <div className="grid gap-2 text-sm">
          <Link href="/privacy" className="flex items-center gap-2 text-fuchsia-500 hover:underline">
            <span>📜</span> Politique de confidentialité
          </Link>
          <Link href="/legal" className="flex items-center gap-2 text-fuchsia-500 hover:underline">
            <span>⚖️</span> Mentions légales
          </Link>
          <Link href="/transparency" className="flex items-center gap-2 text-fuchsia-500 hover:underline">
            <span>🔍</span> Transparence algorithmique
          </Link>
          <Link href="/appeal" className="flex items-center gap-2 text-fuchsia-500 hover:underline">
            <span>📝</span> Contester une décision de modération
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { 
    currentUser, 
    ready, 
    updateProfile, 
    changePassword, 
    updateSettings, 
    deleteAccount,
    exportUserData,
    updateInterests,
    toggleBlock,
    getUserByHandle,
  } = useAuthStore();
  
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Profile form
  const [username, setUsername] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Account form
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  
  // Security form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteStep, setDeleteStep] = useState(1);
  
  // Export data
  const [exportInclude, setExportInclude] = useState({
    profile: true,
    posts: true,
    comments: true,
    likes: true,
    messages: true,
    followers: true,
    settings: true,
  });

  // Init form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username);
      setHandle(currentUser.handle);
      setBio(currentUser.bio || "");
      setLocation(currentUser.location || "");
      setWebsite(currentUser.website || "");
      setEmail(currentUser.email);
      setAvatarPreview(currentUser.avatar || null);
    }
  }, [currentUser]);

  // Loading
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent" />
      </div>
    );
  }

  // Not authenticated
  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-neutral-900">
          <div className="text-4xl">🔒</div>
          <h1 className="mt-4 text-xl font-bold">Connexion requise</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Vous devez être connecté pour accéder aux paramètres.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showMessage("error", "L'image ne doit pas dépasser 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        showMessage("error", "Le fichier doit être une image");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      showMessage("error", "Le nom ne peut pas être vide");
      return;
    }
    if (username.length < 2) {
      showMessage("error", "Le nom doit faire au moins 2 caractères");
      return;
    }
    if (bio.length > 160) {
      showMessage("error", "La bio ne peut pas dépasser 160 caractères");
      return;
    }
    if (website && !website.match(/^https?:\/\/.+/)) {
      showMessage("error", "Le site web doit commencer par http:// ou https://");
      return;
    }
    
    setSaving(true);
    const result = updateProfile({
      username,
      bio,
      location,
      website,
      avatar: avatarPreview || undefined,
    });
    setSaving(false);
    
    if (result.success) {
      showMessage("success", "Profil mis à jour avec succès !");
    } else {
      showMessage("error", result.error || "Erreur lors de la mise à jour");
    }
  };

  const handleSaveHandle = async () => {
    if (!handle.trim() || handle.length < 3) {
      showMessage("error", "Le pseudo doit faire au moins 3 caractères");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(handle)) {
      showMessage("error", "Le pseudo ne peut contenir que des lettres minuscules, chiffres et _");
      return;
    }
    
    setSaving(true);
    const result = updateProfile({ handle });
    setSaving(false);
    
    if (result.success) {
      showMessage("success", "Pseudo mis à jour avec succès !");
    } else {
      showMessage("error", result.error || "Ce pseudo est déjà pris");
    }
  };

  const handleSaveEmail = async () => {
    if (!email || !email.includes("@")) {
      showMessage("error", "Email invalide");
      return;
    }
    if (email !== emailConfirm) {
      showMessage("error", "Les emails ne correspondent pas");
      return;
    }
    
    setSaving(true);
    const result = updateProfile({ email });
    setSaving(false);
    
    if (result.success) {
      showMessage("success", "Email mis à jour avec succès !");
      setEmailConfirm("");
    } else {
      showMessage("error", result.error || "Cet email est déjà utilisé");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      showMessage("error", "Le nouveau mot de passe doit faire au moins 6 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage("error", "Les mots de passe ne correspondent pas");
      return;
    }
    
    setSaving(true);
    const result = changePassword(currentPassword, newPassword);
    setSaving(false);
    
    if (result.success) {
      showMessage("success", "Mot de passe modifié avec succès !");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      showMessage("error", result.error || "Mot de passe actuel incorrect");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }
    if (deleteStep === 2) {
      if (deleteConfirmText !== `supprimer ${currentUser.handle}`) {
        showMessage("error", "Le texte de confirmation ne correspond pas");
        return;
      }
      setDeleteStep(3);
      return;
    }
    
    const result = deleteAccount(deletePassword);
    
    if (result.success) {
      router.push("/");
    } else {
      showMessage("error", result.error || "Mot de passe incorrect");
    }
  };

  const handleExportData = () => {
    const data = exportUserData();
    if (data) {
      const exportData = JSON.parse(data);
      exportData.exportOptions = exportInclude;
      exportData.exportedAt = new Date().toISOString();
      exportData.version = "1.0";
      
      const finalData = JSON.stringify(exportData, null, 2);
      const blob = new Blob([finalData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `globehub-data-${currentUser.handle}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage("success", "Données exportées avec succès !");
    }
  };

  const handleUnblock = (handle: string) => {
    toggleBlock(handle);
    showMessage("success", `@${handle} a été débloqué`);
  };

  const tabs = [
    { key: "profile" as const, label: "Profil", icon: "👤" },
    { key: "account" as const, label: "Compte", icon: "📧" },
    { key: "security" as const, label: "Sécurité", icon: "🔐" },
    { key: "privacy" as const, label: "Confidentialité", icon: "🔒" },
    { key: "notifications" as const, label: "Notifications", icon: "🔔" },
    { key: "interests" as const, label: "Intérêts", icon: "💡" },
    { key: "blocked" as const, label: "Bloqués", icon: "🚫" },
    { key: "data" as const, label: "Mes données", icon: "📦" },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold">Paramètres</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 via-fuchsia-500/20 to-amber-500/20">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <span className="text-sm font-bold">{currentUser.username.charAt(0)}</span>
              )}
            </div>
            <span className="text-sm font-medium">@{currentUser.handle}</span>
          </div>
        </div>
      </header>

      {/* Message toast */}
      {message && (
        <div className={clsx(
          "fixed right-4 top-20 z-50 animate-slide-in rounded-xl px-4 py-3 shadow-lg",
          message.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
        )}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {message.text}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="lg:w-64">
            <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={clsx(
                    "flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    tab === t.key
                      ? "bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30"
                      : "bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  )}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {t.key === "blocked" && currentUser.blockedUsers.length > 0 && (
                    <span className="ml-auto rounded-full bg-neutral-200 px-2 py-0.5 text-xs dark:bg-neutral-700">
                      {currentUser.blockedUsers.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {/* Profile Tab */}
            {tab === "profile" && (
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                  <h2 className="mb-4 text-lg font-bold">Photo de profil</h2>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500/20 via-fuchsia-500/20 to-amber-500/20">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-3xl font-bold">{username.charAt(0) || "?"}</span>
                        )}
                      </div>
                      {avatarPreview && (
                        <button
                          onClick={handleRemoveAvatar}
                          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg hover:bg-rose-600"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div>
                      <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                      >
                        Changer la photo
                      </button>
                      <p className="mt-2 text-xs text-neutral-500">JPG, PNG ou GIF. Max 5MB.</p>
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                  <h2 className="mb-4 text-lg font-bold">Informations du profil</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Nom d&apos;affichage</label>
                      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={50}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800" />
                      <p className="mt-1 text-xs text-neutral-500">{username.length}/50 caractères</p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Bio</label>
                      <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} rows={3} placeholder="Décrivez-vous..."
                        className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800" />
                      <p className={clsx("mt-1 text-xs", bio.length > 140 ? "text-amber-500" : "text-neutral-500")}>{bio.length}/160 caractères</p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Localisation</label>
                      <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Paris, France"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Site web</label>
                      <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800" />
                    </div>
                    <button onClick={handleSaveProfile} disabled={saving}
                      className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-50">
                      {saving ? "Enregistrement..." : "Enregistrer le profil"}
                    </button>
                  </div>
                </div>

                {/* Handle Change */}
                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                  <h2 className="mb-4 text-lg font-bold">Pseudo (@)</h2>
                  <p className="mb-4 text-sm text-neutral-500">Votre pseudo est unique et permet aux autres de vous mentionner.</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400">@</span>
                      <input type="text" value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-8 pr-4 text-sm outline-none transition-all focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800" />
                    </div>
                    <button onClick={handleSaveHandle} disabled={saving || handle === currentUser.handle}
                      className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900">
                      Modifier
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {tab === "account" && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                  <h2 className="mb-4 text-lg font-bold">Adresse email</h2>
                  <p className="mb-4 text-sm text-neutral-500">Votre email actuel : <span className="font-medium">{currentUser.email}</span></p>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Nouvel email</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nouveau@email.com"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Confirmer l&apos;email</label>
                      <input type="email" value={emailConfirm} onChange={(e) => setEmailConfirm(e.target.value)} placeholder="Confirmez le nouvel email"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800" />
                    </div>
                    <button onClick={handleSaveEmail} disabled={saving || email === currentUser.email || !emailConfirm}
                      className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900">
                      Mettre à jour l&apos;email
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                  <h2 className="mb-4 text-lg font-bold">Informations du compte</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <span className="text-sm text-neutral-500">ID utilisateur</span>
                      <span className="text-sm font-mono">{currentUser.id}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <span className="text-sm text-neutral-500">Compte créé le</span>
                      <span className="text-sm font-medium">{new Date(currentUser.createdAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <span className="text-sm text-neutral-500">Rôle</span>
                      <span className={clsx("rounded-full px-2 py-0.5 text-xs font-medium",
                        currentUser.role === "admin" ? "bg-rose-100 text-rose-600" :
                        currentUser.role === "moderator" ? "bg-amber-100 text-amber-600" : "bg-neutral-100 text-neutral-600")}>
                        {currentUser.role === "admin" ? "Administrateur" : currentUser.role === "moderator" ? "Modérateur" : "Utilisateur"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-neutral-500">Compte vérifié</span>
                      <span className="text-sm">
                        {currentUser.isVerified ? (
                          <span className="flex items-center gap-1 text-emerald-500">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Oui
                          </span>
                        ) : <span className="text-neutral-400">Non</span>}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {tab === "security" && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                  <h2 className="mb-4 text-lg font-bold">Changer le mot de passe</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Mot de passe actuel</label>
                      <div className="relative">
                        <input type={showPasswords ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition-all focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800" />
                        <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                          {showPasswords ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Nouveau mot de passe</label>
                      <input type={showPasswords ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800" />
                      <PasswordStrength password={newPassword} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Confirmer le nouveau mot de passe</label>
                      <input type={showPasswords ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800" />
                      {confirmPassword && confirmPassword !== newPassword && (
                        <p className="mt-1 text-xs text-rose-500">Les mots de passe ne correspondent pas</p>
                      )}
                    </div>
                    <button onClick={handleChangePassword} disabled={saving || !currentPassword || !newPassword || newPassword !== confirmPassword}
                      className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900">
                      Changer le mot de passe
                    </button>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-6 dark:border-rose-900/50 dark:bg-rose-950/20">
                  <h2 className="mb-2 text-lg font-bold text-rose-600">Zone de danger</h2>
                  <p className="mb-4 text-sm text-rose-600/80">La suppression de votre compte est irréversible. Toutes vos données seront définitivement effacées.</p>
                  
                  {!showDeleteConfirm ? (
                    <button onClick={() => setShowDeleteConfirm(true)}
                      className="rounded-xl border-2 border-rose-300 bg-white px-6 py-3 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100 dark:bg-transparent">
                      Supprimer mon compte
                    </button>
                  ) : (
                    <div className="space-y-4 rounded-xl bg-white p-4 dark:bg-neutral-900">
                      <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3].map((step) => (
                          <div key={step} className={clsx("flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all",
                            deleteStep >= step ? "bg-rose-500 text-white" : "bg-neutral-200 text-neutral-400")}>{step}</div>
                        ))}
                      </div>

                      {deleteStep === 1 && (
                        <>
                          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">Êtes-vous sûr de vouloir supprimer votre compte ? Cette action supprimera définitivement :</p>
                          <ul className="list-inside list-disc text-sm text-neutral-500">
                            <li>Votre profil et toutes vos informations</li>
                            <li>Tous vos posts et commentaires</li>
                            <li>Vos messages et conversations</li>
                            <li>Vos abonnés et abonnements</li>
                          </ul>
                        </>
                      )}

                      {deleteStep === 2 && (
                        <>
                          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">Pour confirmer, tapez <span className="font-mono font-bold">supprimer {currentUser.handle}</span></p>
                          <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={`supprimer ${currentUser.handle}`}
                            className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400 dark:border-neutral-700 dark:bg-neutral-800" />
                        </>
                      )}

                      {deleteStep === 3 && (
                        <>
                          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">Dernière étape : entrez votre mot de passe pour confirmer</p>
                          <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Votre mot de passe"
                            className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400 dark:border-neutral-700 dark:bg-neutral-800" />
                        </>
                      )}

                      <div className="flex gap-2">
                        <button onClick={handleDeleteAccount}
                          disabled={(deleteStep === 2 && deleteConfirmText !== `supprimer ${currentUser.handle}`) || (deleteStep === 3 && !deletePassword)}
                          className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50">
                          {deleteStep === 3 ? "Supprimer définitivement" : "Continuer"}
                        </button>
                        <button onClick={() => { setShowDeleteConfirm(false); setDeleteStep(1); setDeleteConfirmText(""); setDeletePassword(""); }}
                          className="rounded-xl bg-neutral-100 px-6 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400">
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {tab === "privacy" && (
              <PrivacySettings currentUser={currentUser} updateSettings={updateSettings} showMessage={showMessage} />
            )}

            {/* Notifications Tab */}
            {tab === "notifications" && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                  <h2 className="mb-6 text-lg font-bold">Canaux de notification</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div><p className="font-medium">Notifications par email</p><p className="text-sm text-neutral-500">Recevoir un résumé par email</p></div>
                      <Toggle enabled={currentUser.settings.emailNotifications} onChange={() => updateSettings({ emailNotifications: !currentUser.settings.emailNotifications })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div><p className="font-medium">Notifications push</p><p className="text-sm text-neutral-500">Recevoir des notifications en temps réel</p></div>
                      <Toggle enabled={currentUser.settings.pushNotifications} onChange={() => updateSettings({ pushNotifications: !currentUser.settings.pushNotifications })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div><p className="font-medium">Notifications in-app</p><p className="text-sm text-neutral-500">Afficher les notifications dans l&apos;application</p></div>
                      <Toggle enabled={currentUser.settings.showInAppNotifications} onChange={() => updateSettings({ showInAppNotifications: !currentUser.settings.showInAppNotifications })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div><p className="font-medium">Sons</p><p className="text-sm text-neutral-500">Jouer un son pour les notifications</p></div>
                      <Toggle enabled={currentUser.settings.soundEnabled} onChange={() => updateSettings({ soundEnabled: !currentUser.settings.soundEnabled })} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                  <h2 className="mb-6 text-lg font-bold">Types de notifications</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><span className="text-xl">❤️</span><div><p className="font-medium">Likes</p><p className="text-sm text-neutral-500">Quand quelqu&apos;un aime votre post</p></div></div>
                      <Toggle enabled={currentUser.settings.notifyOnLike} onChange={() => updateSettings({ notifyOnLike: !currentUser.settings.notifyOnLike })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><span className="text-xl">💬</span><div><p className="font-medium">Commentaires</p><p className="text-sm text-neutral-500">Quand quelqu&apos;un commente votre post</p></div></div>
                      <Toggle enabled={currentUser.settings.notifyOnComment} onChange={() => updateSettings({ notifyOnComment: !currentUser.settings.notifyOnComment })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><span className="text-xl">👤</span><div><p className="font-medium">Nouveaux abonnés</p><p className="text-sm text-neutral-500">Quand quelqu&apos;un vous suit</p></div></div>
                      <Toggle enabled={currentUser.settings.notifyOnFollow} onChange={() => updateSettings({ notifyOnFollow: !currentUser.settings.notifyOnFollow })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><span className="text-xl">📢</span><div><p className="font-medium">Mentions</p><p className="text-sm text-neutral-500">Quand quelqu&apos;un vous mentionne</p></div></div>
                      <Toggle enabled={currentUser.settings.notifyOnMention} onChange={() => updateSettings({ notifyOnMention: !currentUser.settings.notifyOnMention })} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Interests Tab */}
            {tab === "interests" && (
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h2 className="mb-2 text-lg font-bold">Centres d&apos;intérêt</h2>
                <p className="mb-6 text-sm text-neutral-500">Sélectionnez vos centres d&apos;intérêt pour personnaliser votre fil d&apos;actualité.</p>
                <CompactInterestSelector
                  selectedInterests={currentUser.engagement?.interests || []}
                  onSelect={(interests) => updateInterests(interests as InterestCategory[])}
                  maxSelection={5}
                />
                <div className="mt-6 rounded-xl bg-fuchsia-50 p-4 dark:bg-fuchsia-950/30">
                  <p className="text-sm text-fuchsia-600 dark:text-fuchsia-400">💡 Vos intérêts influencent l&apos;algorithme de suggestion de posts.</p>
                </div>
              </div>
            )}

            {/* Blocked Tab */}
            {tab === "blocked" && (
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h2 className="mb-2 text-lg font-bold">Utilisateurs bloqués</h2>
                <p className="mb-6 text-sm text-neutral-500">Les utilisateurs bloqués ne peuvent pas voir vos posts ni vous envoyer de messages.</p>
                
                {currentUser.blockedUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                    <span className="mb-2 text-4xl">🚫</span>
                    <p className="text-sm">Vous n&apos;avez bloqué personne</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentUser.blockedUsers.map((h) => {
                      const blockedUser = getUserByHandle(h);
                      return (
                        <div key={h} className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
                              {blockedUser?.avatar ? (<img src={blockedUser.avatar} alt="" className="h-full w-full rounded-full object-cover" />) : 
                              (<span className="text-sm font-bold">{blockedUser?.username?.charAt(0) || "?"}</span>)}
                            </div>
                            <div><p className="font-medium">{blockedUser?.username || h}</p><p className="text-sm text-neutral-500">@{h}</p></div>
                          </div>
                          <button onClick={() => handleUnblock(h)}
                            className="rounded-xl bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-300">
                            Débloquer
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Data Tab */}
            {tab === "data" && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                  <h2 className="mb-4 text-lg font-bold">Télécharger mes données (RGPD)</h2>
                  <p className="mb-4 text-sm text-neutral-500">Conformément au RGPD, vous pouvez télécharger une copie complète de toutes vos données personnelles.</p>
                  <div className="mb-4 space-y-2">
                    <p className="text-sm font-medium">Données incluses :</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(exportInclude).map(([key, value]) => (
                        <label key={key} className="flex items-center gap-2">
                          <input type="checkbox" checked={value} onChange={() => setExportInclude({ ...exportInclude, [key]: !value })}
                            className="h-4 w-4 rounded border-neutral-300 text-fuchsia-500 focus:ring-fuchsia-400" />
                          <span className="text-sm capitalize">{key === "profile" ? "Profil" : key === "posts" ? "Posts" : key === "comments" ? "Commentaires" : 
                            key === "likes" ? "Likes" : key === "messages" ? "Messages" : key === "followers" ? "Abonnés" : "Paramètres"}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleExportData}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:opacity-90">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Télécharger mes données (JSON)
                  </button>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                  <h2 className="mb-4 text-lg font-bold">Statistiques de votre compte</h2>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-neutral-50 p-4 text-center dark:bg-neutral-800">
                      <p className="text-2xl font-bold text-fuchsia-500">{currentUser.stats.posts}</p><p className="text-xs text-neutral-500">Posts</p>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-4 text-center dark:bg-neutral-800">
                      <p className="text-2xl font-bold text-rose-500">{currentUser.stats.likes}</p><p className="text-xs text-neutral-500">Likes reçus</p>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-4 text-center dark:bg-neutral-800">
                      <p className="text-2xl font-bold text-sky-500">{currentUser.stats.comments}</p><p className="text-xs text-neutral-500">Commentaires</p>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-4 text-center dark:bg-neutral-800">
                      <p className="text-2xl font-bold text-emerald-500">{currentUser.followers.length}</p><p className="text-xs text-neutral-500">Abonnés</p>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-4 text-center dark:bg-neutral-800">
                      <p className="text-2xl font-bold text-amber-500">{currentUser.following.length}</p><p className="text-xs text-neutral-500">Abonnements</p>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-4 text-center dark:bg-neutral-800">
                      <p className="text-2xl font-bold text-neutral-600">{currentUser.engagement?.sessionCount || 1}</p><p className="text-xs text-neutral-500">Sessions</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                  <h2 className="mb-4 text-lg font-bold">Historique d&apos;engagement</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <span className="text-neutral-500">Posts consultés</span><span className="font-medium">{currentUser.engagement?.viewedPostIds?.length || 0}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <span className="text-neutral-500">Posts likés</span><span className="font-medium">{currentUser.engagement?.likedPostIds?.length || 0}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <span className="text-neutral-500">Recherches effectuées</span><span className="font-medium">{currentUser.engagement?.searchHistory?.length || 0}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-neutral-500">Dernière activité</span>
                      <span className="font-medium">{currentUser.engagement?.lastActiveAt ? new Date(currentUser.engagement.lastActiveAt).toLocaleString("fr-FR") : "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
