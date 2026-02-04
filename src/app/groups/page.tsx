"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/useAuthStore";
import { useGroupsStore } from "@/lib/useGroupsStore";
import { 
  INTEREST_LABELS, 
  GROUP_VISIBILITY_LABELS, 
  GROUP_JOIN_MODE_LABELS,
  type InterestCategory,
  type GroupVisibility,
  type GroupJoinMode,
} from "@/lib/types";

export default function GroupsPage() {
  const router = useRouter();
  const { currentUser, ready: authReady } = useAuthStore();
  const { 
    ready: groupsReady, 
    userGroups, 
    publicGroups, 
    searchGroups,
    createGroup,
    joinGroup,
    requestToJoin,
  } = useGroupsStore(currentUser?.handle);

  const [tab, setTab] = useState<"my" | "discover">("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Formulaire de création
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formVisibility, setFormVisibility] = useState<GroupVisibility>("public");
  const [formJoinMode, setFormJoinMode] = useState<GroupJoinMode>("open");
  const [formCategory, setFormCategory] = useState<InterestCategory | "">("");
  const [formTags, setFormTags] = useState("");
  const [formShowMap, setFormShowMap] = useState(true);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Groupes filtrés
  const filteredGroups = useMemo(() => {
    if (searchQuery.trim()) {
      return searchGroups(searchQuery);
    }
    return tab === "my" ? userGroups : publicGroups.filter(g => !userGroups.some(ug => ug.id === g.id));
  }, [tab, searchQuery, userGroups, publicGroups, searchGroups]);

  // Loading
  if (!authReady || !groupsReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent" />
      </div>
    );
  }

  const handleCreateGroup = () => {
    if (!currentUser || !formName.trim()) {
      setToast("⚠️ Veuillez remplir le nom du groupe");
      return;
    }

    const tags = formTags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
    
    const newGroup = createGroup(
      {
        name: formName,
        description: formDescription || undefined,
        visibility: formVisibility,
        joinMode: formJoinMode,
        category: formCategory || undefined,
        tags: tags.length > 0 ? tags : undefined,
        showMembersOnMap: formShowMap,
      },
      currentUser.id,
      currentUser.handle
    );

    setShowCreateModal(false);
    setFormName("");
    setFormDescription("");
    setFormVisibility("public");
    setFormJoinMode("open");
    setFormCategory("");
    setFormTags("");
    setFormShowMap(true);
    
    setToast("✅ Groupe créé avec succès !");
    router.push(`/groups/${newGroup.id}`);
  };

  const handleJoinGroup = (groupId: string, joinMode: GroupJoinMode) => {
    if (!currentUser) {
      setToast("⚠️ Connectez-vous pour rejoindre un groupe");
      return;
    }

    if (joinMode === "open") {
      const success = joinGroup(groupId, currentUser.id, currentUser.handle);
      if (success) {
        setToast("✅ Vous avez rejoint le groupe !");
      }
    } else if (joinMode === "request") {
      requestToJoin(groupId, currentUser.id, currentUser.handle);
      setToast("📤 Demande envoyée !");
    } else {
      setToast("🔒 Ce groupe est sur invitation uniquement");
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-neutral-900">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">👥 Groupes</h1>
              <p className="text-xs text-neutral-500">{userGroups.length} groupe{userGroups.length > 1 ? "s" : ""} rejoint{userGroups.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          
          {currentUser && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-amber-500 px-4 py-2 text-sm font-medium text-white shadow-lg hover:opacity-90"
            >
              <span>+</span>
              <span className="hidden sm:inline">Créer un groupe</span>
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Recherche */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un groupe..."
              className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
        </div>

        {/* Tabs */}
        {!searchQuery && (
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setTab("my")}
              className={clsx(
                "flex-1 rounded-xl py-3 text-sm font-medium transition-all",
                tab === "my"
                  ? "bg-fuchsia-500 text-white shadow-lg"
                  : "bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400"
              )}
            >
              Mes groupes ({userGroups.length})
            </button>
            <button
              onClick={() => setTab("discover")}
              className={clsx(
                "flex-1 rounded-xl py-3 text-sm font-medium transition-all",
                tab === "discover"
                  ? "bg-fuchsia-500 text-white shadow-lg"
                  : "bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400"
              )}
            >
              Découvrir ({publicGroups.filter(g => !userGroups.some(ug => ug.id === g.id)).length})
            </button>
          </div>
        )}

        {/* Liste des groupes */}
        <div className="space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center dark:bg-neutral-900">
              <span className="text-5xl">
                {searchQuery ? "🔍" : tab === "my" ? "👥" : "🌍"}
              </span>
              <p className="mt-4 text-neutral-500">
                {searchQuery 
                  ? "Aucun groupe trouvé" 
                  : tab === "my" 
                    ? "Vous n'avez pas encore rejoint de groupe" 
                    : "Aucun groupe public disponible"}
              </p>
              {!searchQuery && tab === "my" && currentUser && (
                <button
                  onClick={() => setTab("discover")}
                  className="mt-4 rounded-xl bg-fuchsia-500 px-6 py-2 text-sm font-medium text-white"
                >
                  Découvrir des groupes
                </button>
              )}
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isMember = userGroups.some(g => g.id === group.id);
              
              return (
                <div
                  key={group.id}
                  className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md dark:bg-neutral-900"
                >
                  <div className="flex items-start gap-4 p-4">
                    {/* Avatar du groupe */}
                    <div className="relative flex-shrink-0">
                      {group.avatar ? (
                        <img src={group.avatar} alt={group.name} className="h-16 w-16 rounded-2xl object-cover" />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 text-2xl">
                          {group.category ? INTEREST_LABELS[group.category].split(" ")[0] : "👥"}
                        </div>
                      )}
                      {group.visibility === "private" && (
                        <div className="absolute -top-1 -right-1 rounded-full bg-neutral-800 p-1 text-xs">
                          🔒
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-neutral-900 dark:text-white truncate">
                            {group.name}
                          </h3>
                          <p className="text-xs text-neutral-500">
                            {group.memberCount} membre{group.memberCount > 1 ? "s" : ""} • 
                            Actif {timeAgo(group.lastActivityAt)}
                          </p>
                        </div>
                        
                        {/* Badge visibilité/mode */}
                        <span className="flex-shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
                          {GROUP_VISIBILITY_LABELS[group.visibility]}
                        </span>
                      </div>

                      {group.description && (
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                          {group.description}
                        </p>
                      )}

                      {/* Tags */}
                      {group.tags && group.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {group.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-fuchsia-50 px-2 py-0.5 text-xs text-fuchsia-600 dark:bg-fuchsia-950/30 dark:text-fuchsia-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
                        <span>💬 {group.totalMessages} messages</span>
                        <span>📝 {group.totalPosts} posts</span>
                        {group.showMembersOnMap && <span>🗺️ Carte activée</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      onClick={() => router.push(`/groups/${group.id}`)}
                      className="flex-1 py-3 text-sm font-medium text-fuchsia-600 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/20"
                    >
                      {isMember ? "Ouvrir" : "Voir"}
                    </button>
                    
                    {!isMember && currentUser && (
                      <button
                        onClick={() => handleJoinGroup(group.id, group.joinMode)}
                        className="flex-1 border-l border-neutral-100 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:border-neutral-800 dark:hover:bg-emerald-950/20"
                      >
                        {group.joinMode === "open" 
                          ? "Rejoindre" 
                          : group.joinMode === "request" 
                            ? "Demander" 
                            : "Sur invitation"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Créer un groupe</h2>
              <button onClick={() => setShowCreateModal(false)} className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {/* Nom */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nom du groupe *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Runners Paris"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-fuchsia-400 dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Décrivez votre groupe..."
                  rows={3}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-fuchsia-400 dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>

              {/* Visibilité */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Visibilité</label>
                <div className="flex gap-2">
                  {(["public", "private"] as GroupVisibility[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setFormVisibility(v)}
                      className={clsx(
                        "flex-1 rounded-xl py-3 text-sm font-medium transition-all",
                        formVisibility === v
                          ? "bg-fuchsia-500 text-white"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800"
                      )}
                    >
                      {GROUP_VISIBILITY_LABELS[v]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode d'adhésion */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Mode d'adhésion</label>
                <select
                  value={formJoinMode}
                  onChange={(e) => setFormJoinMode(e.target.value as GroupJoinMode)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
                >
                  {(["open", "request", "invite_only"] as GroupJoinMode[]).map((mode) => (
                    <option key={mode} value={mode}>
                      {GROUP_JOIN_MODE_LABELS[mode]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Catégorie */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Catégorie</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as InterestCategory | "")}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <option value="">Aucune catégorie</option>
                  {Object.entries(INTEREST_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="running, paris, sport"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-fuchsia-400 dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>

              {/* Option carte */}
              <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
                <div>
                  <p className="font-medium">Afficher les membres sur la carte</p>
                  <p className="text-xs text-neutral-500">Les membres pourront voir leur position respective</p>
                </div>
                <button
                  onClick={() => setFormShowMap(!formShowMap)}
                  className={clsx(
                    "relative h-6 w-11 rounded-full transition-colors",
                    formShowMap ? "bg-fuchsia-500" : "bg-neutral-300 dark:bg-neutral-600"
                  )}
                >
                  <div
                    className={clsx(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                      formShowMap ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!formName.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-fuchsia-500 to-amber-500 py-3 text-sm font-medium text-white shadow-lg hover:opacity-90 disabled:opacity-50"
                >
                  Créer le groupe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
