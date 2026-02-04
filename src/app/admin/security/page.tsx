"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/useAuthStore";

// ============================================
// TYPES
// ============================================

interface SecurityEvent {
  id: string;
  type: "login_attempt" | "login_success" | "login_failure" | "suspicious_activity" | "rate_limit" | "blocked_request" | "data_access";
  severity: "low" | "medium" | "high" | "critical";
  ip: string;
  userAgent?: string;
  userId?: string;
  userHandle?: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

interface SecurityMetric {
  label: string;
  value: number;
  change?: number;
  trend?: "up" | "down" | "stable";
  color: string;
}

interface VulnerabilityCheck {
  id: string;
  name: string;
  description: string;
  status: "pass" | "warning" | "fail";
  details?: string;
  lastChecked: string;
}

// ============================================
// DONNÉES DE DÉMO
// ============================================

const generateDemoEvents = (): SecurityEvent[] => {
  const events: SecurityEvent[] = [];
  const types: SecurityEvent["type"][] = ["login_attempt", "login_success", "login_failure", "suspicious_activity", "rate_limit", "blocked_request"];
  const severities: SecurityEvent["severity"][] = ["low", "medium", "high", "critical"];
  
  for (let i = 0; i < 50; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const severity = type === "login_success" ? "low" 
      : type === "blocked_request" ? "high"
      : type === "suspicious_activity" ? "critical"
      : severities[Math.floor(Math.random() * severities.length)];
    
    events.push({
      id: `evt_${i}`,
      type,
      severity,
      ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      userId: type.includes("login") ? `usr_${Math.random().toString(36).slice(2, 8)}` : undefined,
      userHandle: type.includes("login") ? ["admin", "noah", "camille", "emma"][Math.floor(Math.random() * 4)] : undefined,
      description: getEventDescription(type),
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

function getEventDescription(type: SecurityEvent["type"]): string {
  switch (type) {
    case "login_attempt": return "Tentative de connexion";
    case "login_success": return "Connexion réussie";
    case "login_failure": return "Échec de connexion - identifiants incorrects";
    case "suspicious_activity": return "Activité suspecte détectée - pattern anormal";
    case "rate_limit": return "Rate limit atteint - requêtes bloquées";
    case "blocked_request": return "Requête bloquée - tentative d'accès non autorisé";
    case "data_access": return "Accès aux données sensibles";
    default: return "Événement de sécurité";
  }
}

const vulnerabilityChecks: VulnerabilityCheck[] = [
  {
    id: "v1",
    name: "Headers de sécurité HTTP",
    description: "Vérification de la présence des headers X-Frame-Options, X-XSS-Protection, etc.",
    status: "pass",
    details: "Tous les headers de sécurité sont correctement configurés",
    lastChecked: new Date().toISOString(),
  },
  {
    id: "v2",
    name: "Protection CSRF",
    description: "Vérification de la protection contre les attaques Cross-Site Request Forgery",
    status: "pass",
    details: "Tokens CSRF générés et validés correctement",
    lastChecked: new Date().toISOString(),
  },
  {
    id: "v3",
    name: "Rate Limiting",
    description: "Limitation du nombre de requêtes par IP",
    status: "pass",
    details: "100 requêtes/minute par IP, blocage automatique après dépassement",
    lastChecked: new Date().toISOString(),
  },
  {
    id: "v4",
    name: "Validation des entrées",
    description: "Vérification de la sanitization des données utilisateur",
    status: "pass",
    details: "Toutes les entrées sont validées et nettoyées",
    lastChecked: new Date().toISOString(),
  },
  {
    id: "v5",
    name: "Hashage des mots de passe",
    description: "Vérification de l'algorithme de hashage utilisé",
    status: "warning",
    details: "PBKDF2 utilisé côté client, recommandé: Argon2id côté serveur",
    lastChecked: new Date().toISOString(),
  },
  {
    id: "v6",
    name: "HTTPS Only",
    description: "Vérification que toutes les connexions utilisent HTTPS",
    status: "pass",
    details: "HSTS activé avec preload, durée: 1 an",
    lastChecked: new Date().toISOString(),
  },
  {
    id: "v7",
    name: "Content Security Policy",
    description: "Vérification de la politique CSP",
    status: "warning",
    details: "CSP configuré mais 'unsafe-inline' nécessaire pour certains scripts",
    lastChecked: new Date().toISOString(),
  },
  {
    id: "v8",
    name: "Sessions sécurisées",
    description: "Vérification de la gestion des sessions",
    status: "pass",
    details: "Tokens aléatoires, expiration 24h, fingerprint navigateur",
    lastChecked: new Date().toISOString(),
  },
  {
    id: "v9",
    name: "Protection injection SQL",
    description: "Vérification contre les injections SQL",
    status: "pass",
    details: "Pas de SQL direct, utilisation de localStorage pour la démo",
    lastChecked: new Date().toISOString(),
  },
  {
    id: "v10",
    name: "Dépendances à jour",
    description: "Vérification des vulnérabilités dans les dépendances",
    status: "warning",
    details: "npm audit recommandé régulièrement",
    lastChecked: new Date().toISOString(),
  },
];

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function SecurityAuditPage() {
  const router = useRouter();
  const { currentUser, isAdmin, ready } = useAuthStore();
  
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [tab, setTab] = useState<"overview" | "events" | "vulnerabilities" | "config">("overview");
  const [severityFilter, setSeverityFilter] = useState<SecurityEvent["severity"] | "all">("all");
  const [typeFilter, setTypeFilter] = useState<SecurityEvent["type"] | "all">("all");

  // Charger les événements
  useEffect(() => {
    setEvents(generateDemoEvents());
  }, []);

  // Métriques calculées
  const metrics = useMemo((): SecurityMetric[] => {
    const last24h = events.filter(e => 
      Date.now() - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
    );
    const last7d = events.filter(e => 
      Date.now() - new Date(e.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
    );
    
    return [
      {
        label: "Événements (24h)",
        value: last24h.length,
        change: 12,
        trend: "up",
        color: "sky",
      },
      {
        label: "Connexions réussies",
        value: last24h.filter(e => e.type === "login_success").length,
        change: -5,
        trend: "down",
        color: "emerald",
      },
      {
        label: "Échecs de connexion",
        value: last24h.filter(e => e.type === "login_failure").length,
        change: 3,
        trend: "up",
        color: "amber",
      },
      {
        label: "Activités suspectes",
        value: last7d.filter(e => e.severity === "critical").length,
        change: 0,
        trend: "stable",
        color: "rose",
      },
    ];
  }, [events]);

  // Événements filtrés
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (severityFilter !== "all" && e.severity !== severityFilter) return false;
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      return true;
    });
  }, [events, severityFilter, typeFilter]);

  // Score de sécurité
  const securityScore = useMemo(() => {
    const passCount = vulnerabilityChecks.filter(v => v.status === "pass").length;
    const warningCount = vulnerabilityChecks.filter(v => v.status === "warning").length;
    const total = vulnerabilityChecks.length;
    return Math.round((passCount * 100 + warningCount * 50) / total);
  }, []);

  // Vérification admin
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="text-center">
          <span className="text-6xl">🔒</span>
          <h1 className="mt-4 text-xl font-bold">Accès refusé</h1>
          <p className="mt-2 text-neutral-500">Cette page est réservée aux administrateurs</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-xl bg-fuchsia-500 px-6 py-2 text-white"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const severityColors: Record<SecurityEvent["severity"], string> = {
    low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
    critical: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
  };

  const statusColors: Record<VulnerabilityCheck["status"], string> = {
    pass: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    fail: "bg-rose-100 text-rose-700",
  };

  const statusIcons: Record<VulnerabilityCheck["status"], string> = {
    pass: "✅",
    warning: "⚠️",
    fail: "❌",
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/admin")} className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">🛡️ Audit de Sécurité</h1>
              <p className="text-xs text-neutral-500">Surveillance et analyse des menaces</p>
            </div>
          </div>
          
          {/* Score de sécurité */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-neutral-500">Score de sécurité</p>
              <p className={clsx(
                "text-2xl font-bold",
                securityScore >= 80 ? "text-emerald-500" :
                securityScore >= 60 ? "text-amber-500" : "text-rose-500"
              )}>
                {securityScore}%
              </p>
            </div>
            <div className={clsx(
              "h-12 w-12 rounded-full flex items-center justify-center text-2xl",
              securityScore >= 80 ? "bg-emerald-100" :
              securityScore >= 60 ? "bg-amber-100" : "bg-rose-100"
            )}>
              {securityScore >= 80 ? "🛡️" : securityScore >= 60 ? "⚠️" : "🚨"}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-2 pb-2">
            {[
              { key: "overview", label: "Vue d'ensemble", icon: "📊" },
              { key: "events", label: "Événements", icon: "📋", badge: events.length },
              { key: "vulnerabilities", label: "Vulnérabilités", icon: "🔍" },
              { key: "config", label: "Configuration", icon: "⚙️" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as typeof tab)}
                className={clsx(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  tab === t.key
                    ? "bg-fuchsia-500 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                )}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {t.badge && (
                  <span className={clsx(
                    "rounded-full px-1.5 py-0.5 text-xs",
                    tab === t.key ? "bg-white/20" : "bg-neutral-200 dark:bg-neutral-700"
                  )}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* === VUE D'ENSEMBLE === */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Métriques */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                  <p className="text-sm text-neutral-500">{metric.label}</p>
                  <div className="mt-2 flex items-end justify-between">
                    <p className={`text-3xl font-bold text-${metric.color}-600`}>{metric.value}</p>
                    {metric.change !== undefined && (
                      <span className={clsx(
                        "flex items-center text-xs font-medium",
                        metric.trend === "up" ? "text-rose-500" :
                        metric.trend === "down" ? "text-emerald-500" : "text-neutral-500"
                      )}>
                        {metric.trend === "up" ? "↑" : metric.trend === "down" ? "↓" : "→"}
                        {Math.abs(metric.change)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Graphique simplifié */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <h3 className="font-bold mb-4">📈 Activité des 7 derniers jours</h3>
              <div className="h-40 flex items-end gap-2">
                {[...Array(7)].map((_, i) => {
                  const dayEvents = events.filter(e => {
                    const eventDate = new Date(e.timestamp);
                    const today = new Date();
                    const daysDiff = Math.floor((today.getTime() - eventDate.getTime()) / (24 * 60 * 60 * 1000));
                    return daysDiff === 6 - i;
                  });
                  const height = Math.min(100, (dayEvents.length / 10) * 100);
                  const criticalCount = dayEvents.filter(e => e.severity === "critical").length;
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className={clsx(
                          "w-full rounded-t transition-all",
                          criticalCount > 0 ? "bg-rose-400" : "bg-fuchsia-400"
                        )}
                        style={{ height: `${height}%`, minHeight: "4px" }}
                      />
                      <span className="text-xs text-neutral-400">
                        {new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR", { weekday: "short" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Derniers événements critiques */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <h3 className="font-bold mb-4">🚨 Derniers événements critiques</h3>
              <div className="space-y-3">
                {events.filter(e => e.severity === "critical").slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center gap-4 rounded-xl bg-rose-50 p-3 dark:bg-rose-950/20">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1">
                      <p className="font-medium text-rose-700 dark:text-rose-400">{event.description}</p>
                      <p className="text-xs text-rose-500">IP: {event.ip} • {new Date(event.timestamp).toLocaleString("fr-FR")}</p>
                    </div>
                  </div>
                ))}
                {events.filter(e => e.severity === "critical").length === 0 && (
                  <p className="text-center text-neutral-500 py-4">Aucun événement critique récent ✅</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === ÉVÉNEMENTS === */}
        {tab === "events" && (
          <div className="space-y-4">
            {/* Filtres */}
            <div className="flex flex-wrap gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500">Sévérité</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as typeof severityFilter)}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <option value="all">Toutes</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <option value="all">Tous</option>
                  <option value="login_attempt">Tentative connexion</option>
                  <option value="login_success">Connexion réussie</option>
                  <option value="login_failure">Échec connexion</option>
                  <option value="suspicious_activity">Activité suspecte</option>
                  <option value="rate_limit">Rate limit</option>
                  <option value="blocked_request">Requête bloquée</option>
                </select>
              </div>
              <div className="flex-1" />
              <div className="flex items-end">
                <span className="text-sm text-neutral-500">{filteredEvents.length} événement(s)</span>
              </div>
            </div>

            {/* Liste */}
            <div className="rounded-2xl bg-white shadow-sm dark:bg-neutral-900">
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[600px] overflow-y-auto">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-4">
                    <span className={clsx("rounded-full px-2 py-1 text-xs font-medium", severityColors[event.severity])}>
                      {event.severity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.description}</p>
                      <p className="text-xs text-neutral-500">
                        IP: {event.ip}
                        {event.userHandle && ` • @${event.userHandle}`}
                      </p>
                    </div>
                    <span className="text-xs text-neutral-400 whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleString("fr-FR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === VULNÉRABILITÉS === */}
        {tab === "vulnerabilities" && (
          <div className="space-y-4">
            {/* Résumé */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-emerald-50 p-6 text-center dark:bg-emerald-950/30">
                <p className="text-3xl font-bold text-emerald-600">{vulnerabilityChecks.filter(v => v.status === "pass").length}</p>
                <p className="text-sm text-emerald-700">Tests réussis</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-6 text-center dark:bg-amber-950/30">
                <p className="text-3xl font-bold text-amber-600">{vulnerabilityChecks.filter(v => v.status === "warning").length}</p>
                <p className="text-sm text-amber-700">Avertissements</p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-6 text-center dark:bg-rose-950/30">
                <p className="text-3xl font-bold text-rose-600">{vulnerabilityChecks.filter(v => v.status === "fail").length}</p>
                <p className="text-sm text-rose-700">Échecs</p>
              </div>
            </div>

            {/* Liste des vérifications */}
            <div className="rounded-2xl bg-white shadow-sm dark:bg-neutral-900">
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {vulnerabilityChecks.map((check) => (
                  <div key={check.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <span className="text-2xl">{statusIcons[check.status]}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold">{check.name}</h4>
                          <span className={clsx("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[check.status])}>
                            {check.status}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">{check.description}</p>
                        {check.details && (
                          <p className="text-xs text-neutral-400 mt-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-2">
                            💡 {check.details}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-neutral-400">
                        Vérifié {new Date(check.lastChecked).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === CONFIGURATION === */}
        {tab === "config" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <h3 className="font-bold mb-4">⚙️ Configuration de sécurité actuelle</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
                  <div>
                    <p className="font-medium">Rate Limiting</p>
                    <p className="text-xs text-neutral-500">Limite les requêtes par IP</p>
                  </div>
                  <span className="text-emerald-500 font-medium">100 req/min</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
                  <div>
                    <p className="font-medium">Durée de session</p>
                    <p className="text-xs text-neutral-500">Temps avant expiration automatique</p>
                  </div>
                  <span className="text-emerald-500 font-medium">24 heures</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
                  <div>
                    <p className="font-medium">Tentatives de connexion</p>
                    <p className="text-xs text-neutral-500">Avant blocage temporaire</p>
                  </div>
                  <span className="text-emerald-500 font-medium">5 tentatives</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
                  <div>
                    <p className="font-medium">Durée de blocage</p>
                    <p className="text-xs text-neutral-500">Après trop de tentatives</p>
                  </div>
                  <span className="text-emerald-500 font-medium">15 minutes</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
                  <div>
                    <p className="font-medium">HSTS</p>
                    <p className="text-xs text-neutral-500">HTTP Strict Transport Security</p>
                  </div>
                  <span className="text-emerald-500 font-medium">1 an + preload</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <h3 className="font-bold mb-4">🔧 Actions de maintenance</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <button className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <p className="font-medium">Forcer la déconnexion</p>
                    <p className="text-xs text-neutral-500">Déconnecter toutes les sessions</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
                  <span className="text-2xl">🗑️</span>
                  <div>
                    <p className="font-medium">Purger les logs</p>
                    <p className="text-xs text-neutral-500">Supprimer les événements anciens</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="font-medium">Exporter le rapport</p>
                    <p className="text-xs text-neutral-500">Télécharger l'audit complet</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
                  <span className="text-2xl">🔍</span>
                  <div>
                    <p className="font-medium">Lancer un scan</p>
                    <p className="text-xs text-neutral-500">Vérifier les vulnérabilités</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
