"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { IconX } from "./icons";
import { InterestSelector } from "./InterestSelector";
import type { InterestCategory } from "@/lib/types";

type AuthMode = "login" | "register";
type RegisterStep = "info" | "interests";
type AuthResult = { success: boolean; error?: string };

export default function AuthModal({
  open,
  onClose,
  onLogin,
  onRegister,
}: {
  open: boolean;
  onClose: () => void;
  onLogin: (handleOrEmail: string, password: string) => AuthResult | Promise<AuthResult>;
  onRegister: (username: string, handle: string, email: string, password: string, interests: InterestCategory[]) => AuthResult | Promise<AuthResult>;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("info");
  const [username, setUsername] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [interests, setInterests] = useState<InterestCategory[]>([]);
  const [ageVerified, setAgeVerified] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setUsername("");
    setHandle("");
    setEmail("");
    setPassword("");
    setInterests([]);
    setAgeVerified(false);
    setTermsAccepted(false);
    setError("");
    setRegisterStep("info");
  };

  const handleNextStep = () => {
    setError("");
    
    if (!username.trim() || username.length < 2) {
      setError("Le nom doit faire au moins 2 caractères");
      return;
    }
    if (!handle.trim() || handle.length < 3) {
      setError("Le pseudo doit faire au moins 3 caractères");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
      setError("Le pseudo ne peut contenir que des lettres, chiffres et _");
      return;
    }
    if (!email.includes("@")) {
      setError("Email invalide");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères");
      return;
    }
    if (!ageVerified) {
      setError("Vous devez confirmer avoir au moins 13 ans");
      return;
    }
    if (!termsAccepted) {
      setError("Vous devez accepter les conditions d'utilisation");
      return;
    }

    setRegisterStep("interests");
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      let result: AuthResult;

      if (mode === "login") {
        result = await Promise.resolve(onLogin(email, password));
      } else {
        if (interests.length < 3) {
          setError("Sélectionnez au moins 3 centres d'intérêt");
          setLoading(false);
          return;
        }
        result = await Promise.resolve(onRegister(username, handle, email, password, interests));
      }

      setLoading(false);

      if (result.success) {
        resetForm();
        onClose();
      } else {
        setError(result.error ?? "Une erreur est survenue");
      }
    } catch {
      setLoading(false);
      setError("Une erreur est survenue");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              {mode === "login" ? "Connexion" : 
                registerStep === "info" ? "Créer un compte" : "Tes centres d'intérêt"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {mode === "login" 
                ? "Connecte-toi pour poster sur GlobeHub" 
                : registerStep === "info" 
                  ? "Rejoins la communauté GlobeHub"
                  : "Personnalise ton expérience"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs - only show in login mode or first step of register */}
        {(mode === "login" || registerStep === "info") && (
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => { setMode("login"); setError(""); setRegisterStep("info"); }}
              className={clsx(
                "flex-1 rounded-xl py-2.5 text-sm font-medium transition-all",
                mode === "login"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              )}
            >
              Connexion
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={clsx(
                "flex-1 rounded-xl py-2.5 text-sm font-medium transition-all",
                mode === "register"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              )}
            >
              Inscription
            </button>
          </div>
        )}

        {/* Register step indicator */}
        {mode === "register" && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all",
              registerStep === "info" 
                ? "bg-fuchsia-500 text-white" 
                : "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950/50"
            )}>
              1
            </div>
            <div className={clsx(
              "h-0.5 w-8 rounded-full transition-all",
              registerStep === "interests" ? "bg-fuchsia-500" : "bg-neutral-200 dark:bg-neutral-700"
            )} />
            <div className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all",
              registerStep === "interests" 
                ? "bg-fuchsia-500 text-white" 
                : "bg-neutral-200 text-neutral-400 dark:bg-neutral-700"
            )}>
              2
            </div>
          </div>
        )}

        {/* Form */}
        <div className="mt-6 space-y-4">
          {mode === "register" && registerStep === "info" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Nom d&apos;affichage
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Jean Dupont"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Pseudo (unique)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400">@</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="jean_dupont"
                    className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-8 pr-4 text-sm outline-none transition-all focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
              </div>
            </>
          )}

          {mode === "register" && registerStep === "interests" && (
            <InterestSelector
              selectedInterests={interests}
              onSelect={setInterests}
              maxSelection={5}
              minSelection={3}
            />
          )}

          {(mode === "login" || (mode === "register" && registerStep === "info")) && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {mode === "login" ? "Email ou pseudo" : "Email"}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>

              {/* Age verification and terms - only for registration */}
              {mode === "register" && (
                <div className="space-y-3 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ageVerified}
                      onChange={(e) => setAgeVerified(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-fuchsia-500 focus:ring-fuchsia-400"
                    />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Je certifie avoir <strong>13 ans ou plus</strong> *
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-fuchsia-500 focus:ring-fuchsia-400"
                    />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      J&apos;accepte les{" "}
                      <a href="/terms" target="_blank" className="text-fuchsia-500 hover:underline">
                        conditions d&apos;utilisation
                      </a>{" "}
                      et la{" "}
                      <a href="/privacy" target="_blank" className="text-fuchsia-500 hover:underline">
                        politique de confidentialité
                      </a>{" "}
                      *
                    </span>
                  </label>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Buttons */}
          {mode === "register" && registerStep === "interests" && (
            <div className="flex gap-2">
              <button
                onClick={() => setRegisterStep("info")}
                className="flex-1 rounded-xl bg-neutral-100 py-3 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || interests.length < 3}
                className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 via-fuchsia-500 to-amber-500 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Chargement..." : "Créer mon compte"}
              </button>
            </div>
          )}

          {(mode === "login" || (mode === "register" && registerStep === "info")) && (
            <button
              onClick={mode === "login" ? handleSubmit : handleNextStep}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-sky-500 via-fuchsia-500 to-amber-500 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Continuer"}
            </button>
          )}
        </div>

        {/* Demo accounts */}
        {mode === "login" && (
          <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <p className="text-center text-xs text-neutral-500">
              Comptes de démo : <span className="font-medium">admin</span>, <span className="font-medium">camille</span>, <span className="font-medium">noah</span>
              <br />
              (mot de passe : n&apos;importe quoi)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
