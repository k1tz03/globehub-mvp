"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import type { CategoryFilter, FeedMode, LayerToggles, Post, ProjectionMode, TimeRange, ReportReason, Group } from "@/lib/types";
import { haversineKm } from "@/lib/geo";
import { useAuthStore } from "@/lib/useAuthStore";
import { usePostsStore } from "@/lib/usePostsStore";
import { useAnalyticsStore } from "@/lib/useAnalyticsStore";
import { useRecommendationStore } from "@/lib/useRecommendationStore";
import { useNotificationStore } from "@/lib/useNotificationStore";
import { useEngagementBoostStore } from "@/lib/useEngagementBoostStore";
import { useGroupsStore } from "@/lib/useGroupsStore";
import { useMessagesStore } from "@/lib/useMessagesStore";
import GlobeMap, { type GroupMemberOnMap } from "@/components/GlobeMap";
import LeftRail from "@/components/LeftRail";
import TopBar from "@/components/TopBar";
import FloatingComposeButton from "@/components/FloatingComposeButton";
import TimeRail from "@/components/TimeRail";
import FeedSheet from "@/components/FeedSheet";
import PostSheet from "@/components/PostSheet";
import ComposeSheet from "@/components/ComposeSheet";
import LayersSheet from "@/components/LayersSheet";
import AuthModal from "@/components/AuthModal";
import ProfileMenu from "@/components/ProfileMenu";
import AnimatedBackground from "@/components/AnimatedBackground";
import { ViralPopupContainer } from "@/components/ViralPopup";
import FeaturedPopup from "@/components/FeaturedPopup";
import { InterestModal } from "@/components/InterestPicker";
import { PostSuccessOverlay } from "@/components/LiveViewCounter";
import { NotificationBell, NotificationPanel, ToastContainer } from "@/components/NotificationUI";
import { AutoNavController, useAutoNav } from "@/components/AutoNavController";
import { ForYouSection, InterestProfileWidget } from "@/components/ForYouSection";
import MapPostPopup from "@/components/MapPostPopup";
import GroupMemberPopup from "@/components/GroupMemberPopup";
import DiscoveryMode, { useDiscoveryMode } from "@/components/DiscoveryMode";
import HotZoneOverlay, { HotZoneBadge } from "@/components/HotZoneOverlay";
import ViralPredictionBadge, { ViralScoreInline } from "@/components/ViralPredictionBadge";
import ChallengesPanel, { ChallengesFAB, ChallengeCompletedToast } from "@/components/ChallengesPanel";
import { useLocationSignaturesStore } from "@/lib/useLocationSignaturesStore";
import LocationSignaturePopup from "@/components/LocationSignaturePopup";
import { useTerritoriesStore } from "@/lib/useTerritoriesStore";
import TerritoryPopup, { TerritoryOverlay } from "@/components/TerritoryPopup";
import { useTimeCapsuleStore } from "@/lib/useTimeCapsuleStore";
import { TimeCapsuleRevealed, CapsuleHintIndicator, CapsuleMapMarker, CreateTimeCapsule } from "@/components/TimeCapsule";
import { useLiveWavesStore } from "@/lib/useLiveWavesStore";
import { LiveWaveOverlay, WaveReachedNotification, ActiveWavesIndicator, ViralEventsFeed, useWaveAnimation, useWaveNotifications, generateWaveGeoJSON } from "@/components/LiveWave";

function scoreForTrending(p: Post) {
  const base = p.kind === "promoted" ? 25 : 5;
  const likesBoost = Math.log(p.likes + 1) * 2;
  const commentsBoost = p.comments.length * 3;
  const ageMin = Math.max(1, (Date.now() - new Date(p.createdAtISO).getTime()) / 60000);
  return (base + likesBoost + commentsBoost) / Math.log(ageMin + 2);
}

function inTimeRange(p: Post, range: TimeRange) {
  const ageMs = Date.now() - new Date(p.createdAtISO).getTime();
  if (range === "live") return ageMs <= 20 * 60 * 1000;
  if (range === "1h") return ageMs <= 60 * 60 * 1000;
  if (range === "24h") return ageMs <= 24 * 60 * 60 * 1000;
  return ageMs <= 7 * 24 * 60 * 60 * 1000;
}

export default function HomePage() {
  const { resolvedTheme } = useTheme();
  const themeMode = (resolvedTheme === "dark" ? "dark" : "light") as "light" | "dark";

  // Auth
  const { 
    currentUser, 
    ready: authReady, 
    login, 
    register, 
    logout, 
    toggleFollow, 
    isFollowing 
  } = useAuthStore();

  // Posts
  const { 
    posts,
    viralPosts,
    featuredPost,
    ready: postsReady, 
    addPost, 
    toggleLike, 
    addComment,
    sharePost,
    reportPost,
  } = usePostsStore(currentUser?.handle);

  // Analytics
  const {
    activeBackgroundEvent,
    onlineUsers,
    trackVisit,
    ready: analyticsReady,
  } = useAnalyticsStore();

  // Recommendations (nouveau système basé sur likes, commentaires, recherches, préférences)
  const {
    forYouPosts,
    trendingPosts: recommendedTrending,
    userStats,
    recordLike: recLike,
    recordUnlike,
    recordComment: recComment,
    recordView,
    recordSearch,
    recordShare: recShare,
    ready: recoReady,
  } = useRecommendationStore(currentUser, posts);

  // Flag pour savoir si l'utilisateur a des intérêts configurés
  const hasConfiguredInterests = useMemo(() => {
    return currentUser && currentUser.engagement?.interests && currentUser.engagement.interests.length >= 3;
  }, [currentUser]);

  // Notifications
  const {
    notifications,
    newNotifications,
    settings: notifSettings,
    unreadCount,
    dismissNewNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    notifyLike,
    notifyComment,
    notifyFollow,
  } = useNotificationStore(currentUser?.handle);

  // Engagement Boost (Hot Zones, Viral Predictions, Challenges)
  const {
    hotZones,
    viralPredictions,
    activeChallenges,
    detectHotZones,
    predictVirality,
    boostPost,
    joinChallenge,
    checkChallengeCompletion,
    generateDailyChallenges,
    getViralPrediction,
    isInHotZone,
  } = useEngagementBoostStore();

  // Groups
  const {
    userGroups,
    ready: groupsReady,
  } = useGroupsStore(currentUser?.handle);

  // Messages (for opening conversations with group members)
  const {
    getOrCreateConversation,
  } = useMessagesStore(currentUser?.handle);

  // Location Signatures
  const {
    signatures,
    computeSignatures,
    getSignatureAt,
    ready: signaturesReady,
  } = useLocationSignaturesStore();

  // Territories
  const {
    territories,
    computeTerritories,
    getTerritoryAt,
    getUserMayorBadges,
    ready: territoriesReady,
  } = useTerritoriesStore();

  // Time Capsules
  const {
    capsules,
    checkProximityCapsules,
    checkDateCapsules,
    getNearbyHints,
    revealCapsule,
    reactToCapsule,
    createCapsule,
    ready: capsulesReady,
  } = useTimeCapsuleStore();

  // Live Waves
  const {
    waves,
    triggerWave,
    getActiveWaves,
    isPositionInWave,
    markUserReached,
  } = useLiveWavesStore();

  const router = useRouter();

  // Auto-navigation
  const { isEnabled: autoNavEnabled, toggle: toggleAutoNav } = useAutoNav();

  // UI State
  const [mode, setMode] = useState<FeedMode>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [projection, setProjection] = useState<ProjectionMode>("globe");
  const [layers, setLayers] = useState<LayerToggles>({ pulse: true, heat: false, trails: false });
  const [followsOnly, setFollowsOnly] = useState(false);

  // Modals
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showFeatured, setShowFeatured] = useState(false);
  const [dismissedViral, setDismissedViral] = useState<Set<string>>(new Set());
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [postSuccessData, setPostSuccessData] = useState<{ views: number } | null>(null);
  const [challengesPanelOpen, setChallengesPanelOpen] = useState(false);
  const [completedChallenge, setCompletedChallenge] = useState<string | null>(null);

  // Map popup state
  const [mapPopupPostId, setMapPopupPostId] = useState<string | null>(null);
  const [popupScreenPos, setPopupScreenPos] = useState<{ x: number; y: number } | null>(null);

  // Group members on map
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedMember, setSelectedMember] = useState<GroupMemberOnMap | null>(null);
  const [memberPopupPos, setMemberPopupPos] = useState<{ x: number; y: number } | null>(null);

  // Discovery mode
  const [discoveryEnabled, setDiscoveryEnabled] = useState(true);

  // Map
  const [focus, setFocus] = useState<{ lon: number; lat: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lon: number; lat: number }>({ lon: 8, lat: 30 });

  // Location Signatures & Territories
  const [selectedSignature, setSelectedSignature] = useState<ReturnType<typeof getSignatureAt>>(null);
  const [signaturePopupPos, setSignaturePopupPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<ReturnType<typeof getTerritoryAt>>(null);
  const [territoryPopupPos, setTerritoryPopupPos] = useState<{ x: number; y: number } | null>(null);

  // Time Capsules
  const [createCapsuleOpen, setCreateCapsuleOpen] = useState(false);
  const [revealedCapsule, setRevealedCapsule] = useState<ReturnType<typeof checkProximityCapsules>[0] | null>(null);
  const [capsuleHints, setCapsuleHints] = useState<ReturnType<typeof getNearbyHints>>([]);

  // Live Waves
  const [viralFeedOpen, setViralFeedOpen] = useState(false);
  const activeWaves = getActiveWaves();

  // Détecter les Hot Zones avec debounce pour éviter les recalculs fréquents
  const hotZoneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHotZoneCalcRef = useRef<number>(0);

  // Live Wave animation hook
  useWaveAnimation();

  // Wave notifications hook
  const { pendingNotification: waveNotification, dismissNotification: dismissWaveNotification } = useWaveNotifications(
    mapCenter.lat,
    mapCenter.lon,
    currentUser?.handle || null
  );

  useEffect(() => {
    if (posts.length === 0) return;

    // Debounce de 5 secondes minimum entre les recalculs
    const now = Date.now();
    const timeSinceLastCalc = now - lastHotZoneCalcRef.current;
    const delay = Math.max(0, 5000 - timeSinceLastCalc);

    if (hotZoneTimeoutRef.current) {
      clearTimeout(hotZoneTimeoutRef.current);
    }

    hotZoneTimeoutRef.current = setTimeout(() => {
      lastHotZoneCalcRef.current = Date.now();
      detectHotZones(posts);

      // Calculer les prédictions de viralité pour les posts récents (limité à 20)
      const recentPosts = posts
        .filter(p => {
          const age = Date.now() - new Date(p.createdAtISO).getTime();
          return age < 2 * 60 * 60 * 1000; // Posts de moins de 2h
        })
        .slice(0, 20); // Limiter à 20 posts max
      recentPosts.forEach(p => predictVirality(p, posts));
    }, delay);

    return () => {
      if (hotZoneTimeoutRef.current) {
        clearTimeout(hotZoneTimeoutRef.current);
      }
    };
  }, [posts, detectHotZones, predictVirality]);

  // Générer les challenges quotidiens
  useEffect(() => {
    if (activeChallenges.length === 0) {
      generateDailyChallenges(mapCenter);
    }
  }, [activeChallenges.length, generateDailyChallenges, mapCenter]);

  // Compute Location Signatures and Territories when posts change
  useEffect(() => {
    if (posts.length === 0) return;

    const users = posts.reduce((acc, p) => {
      if (!acc.find(u => u.handle === p.handle)) {
        acc.push({ handle: p.handle, username: p.author, avatar: p.avatar });
      }
      return acc;
    }, [] as Array<{ handle: string; username: string; avatar?: string }>);

    computeSignatures(posts, users);
    computeTerritories(posts, users);
  }, [posts, computeSignatures, computeTerritories]);

  // Check for proximity-based time capsules when user moves
  useEffect(() => {
    if (!currentUser || !mapCenter) return;

    const nearbyCapsules = checkProximityCapsules(mapCenter.lat, mapCenter.lon, currentUser.handle);
    if (nearbyCapsules.length > 0 && !revealedCapsule) {
      // Reveal the first found capsule
      const capsule = nearbyCapsules[0];
      const revealed = revealCapsule(capsule.id, currentUser.handle, currentUser.username, currentUser.avatar);
      if (revealed) {
        setRevealedCapsule(capsule);
      }
    }

    // Update hints for nearby capsules
    const hints = getNearbyHints(mapCenter.lat, mapCenter.lon, currentUser.handle);
    setCapsuleHints(hints);
  }, [mapCenter, currentUser, checkProximityCapsules, revealCapsule, getNearbyHints, revealedCapsule]);

  // Check date-based capsules periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkDateCapsules();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkDateCapsules]);

  // Trigger viral wave when a post reaches high engagement velocity
  const viralWaveCheckRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (posts.length === 0) return;

    // Check for posts that might have gone viral
    for (const post of posts) {
      if (viralWaveCheckRef.current.has(post.id)) continue;
      if (!post.lat || !post.lon) continue;

      // Calculate engagement velocity (simplified)
      const ageMinutes = Math.max(1, (Date.now() - new Date(post.createdAtISO).getTime()) / 60000);
      const likesPerMinute = post.likes / ageMinutes;

      // Trigger wave if velocity is high enough (5+ likes/min and at least 10 likes)
      if (likesPerMinute >= 5 && post.likes >= 10) {
        viralWaveCheckRef.current.add(post.id);
        triggerWave({
          postId: post.id,
          postHandle: post.handle,
          postUsername: post.author,
          postText: post.text,
          postAvatar: post.avatar,
          origin: { lat: post.lat, lon: post.lon },
          likes: post.likes,
          likeVelocity: likesPerMinute,
          category: post.category,
        });
      }
    }
  }, [posts, triggerWave]);

  // Show interest modal for new users
  useEffect(() => {
    if (currentUser && !hasConfiguredInterests && authReady) {
      const timer = setTimeout(() => setInterestModalOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, hasConfiguredInterests, authReady]);

  // Track visit on mount
  useEffect(() => {
    if (analyticsReady) {
      trackVisit();
    }
  }, [analyticsReady, trackVisit]);

  // Prepare group members for map display
  const { users } = useAuthStore();

  const groupMembersOnMap = useMemo((): GroupMemberOnMap[] => {
    if (!selectedGroup || !selectedGroup.showMembersOnMap) return [];

    return selectedGroup.members
      .filter(m => m.shareLocation && m.lat && m.lon)
      .map(m => {
        const user = users.find(u => u.handle === m.userHandle);
        return {
          ...m,
          groupId: selectedGroup.id,
          groupName: selectedGroup.name,
          avatar: user?.avatar,
          username: user?.username,
        };
      });
  }, [selectedGroup, users]);

  // Zoom to group members when group is selected
  useEffect(() => {
    if (selectedGroup && groupMembersOnMap.length > 0) {
      // Calculate bounding box center
      const lats = groupMembersOnMap.map(m => m.lat!);
      const lons = groupMembersOnMap.map(m => m.lon!);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;

      setFocus({ lon: centerLon, lat: centerLat });
      // Disable discovery mode when viewing group
      setDiscoveryEnabled(false);
    }
  }, [selectedGroup, groupMembersOnMap]);

  // Handle group selection from sidebar
  const handleSelectGroup = useCallback((group: Group | null) => {
    setSelectedGroup(group);
    // Close any open member popup
    setSelectedMember(null);
    setMemberPopupPos(null);
  }, []);

  // Handle member click on map
  const handleMemberClick = useCallback((member: GroupMemberOnMap, screenPos: { x: number; y: number }) => {
    setSelectedMember(member);
    setMemberPopupPos(screenPos);
    // Close post popup if open
    setMapPopupPostId(null);
    setPopupScreenPos(null);
  }, []);

  // Close member popup
  const closeMemberPopup = useCallback(() => {
    setSelectedMember(null);
    setMemberPopupPos(null);
  }, []);

  // Handle message to member
  const handleMessageMember = useCallback(() => {
    if (!currentUser || !selectedMember) return;

    // Get or create conversation
    const conversation = getOrCreateConversation(selectedMember.userHandle);
    if (conversation) {
      // Navigate to messages with conversation selected
      router.push(`/messages?conversation=${conversation.id}`);
    }
    closeMemberPopup();
  }, [currentUser, selectedMember, getOrCreateConversation, router, closeMemberPopup]);

  // Handle view member profile
  const handleViewMemberProfile = useCallback(() => {
    if (!selectedMember) return;
    router.push(`/u/${selectedMember.userHandle}`);
    closeMemberPopup();
  }, [selectedMember, router, closeMemberPopup]);

  // Handle signature click on map
  const handleSignatureClick = useCallback((lat: number, lon: number, screenPos: { x: number; y: number }) => {
    const signature = getSignatureAt(lat, lon);
    if (signature) {
      setSelectedSignature(signature);
      setSignaturePopupPos(screenPos);
    }
  }, [getSignatureAt]);

  // Handle territory click on map
  const handleTerritoryClick = useCallback((lat: number, lon: number, screenPos: { x: number; y: number }) => {
    const territory = getTerritoryAt(lat, lon);
    if (territory) {
      setSelectedTerritory(territory);
      setTerritoryPopupPos(screenPos);
    }
  }, [getTerritoryAt]);

  // Close signature popup
  const closeSignaturePopup = useCallback(() => {
    setSelectedSignature(null);
    setSignaturePopupPos(null);
  }, []);

  // Close territory popup
  const closeTerritoryPopup = useCallback(() => {
    setSelectedTerritory(null);
    setTerritoryPopupPos(null);
  }, []);

  // Handle capsule creation
  const handleCreateCapsule = useCallback((data: Parameters<typeof createCapsule>[0]) => {
    createCapsule(data);
    setCreateCapsuleOpen(false);
  }, [createCapsule]);

  // Handle capsule reaction
  const handleCapsuleReaction = useCallback((capsuleId: string, reaction: "amazed" | "touched" | "funny") => {
    if (!currentUser) return;
    reactToCapsule(capsuleId, currentUser.handle, reaction);
  }, [currentUser, reactToCapsule]);

  // Projection function for overlays
  const mapProjection = useCallback((lat: number, lon: number) => {
    if (typeof window === "undefined") return null;
    // Simplified projection - in production use map's actual projection
    return {
      x: ((lon + 180) / 360) * window.innerWidth,
      y: ((90 - lat) / 180) * window.innerHeight,
    };
  }, []);

  // Navigate to post on map
  const navigateToPost = useCallback((post: Post) => {
    if (post.lat && post.lon) {
      setFocus({ lon: post.lon, lat: post.lat });
    }
  }, []);

  // Open post and record view
  const openPost = useCallback((post: Post) => {
    setSelectedId(post.id);
    // Enregistrer la vue après 3 secondes
    setTimeout(() => {
      recordView(post, 5000);
    }, 3000);
  }, [recordView]);

  // Handle like with notification and recommendation tracking
  const handleLike = useCallback((postId: string, handle: string) => {
    const post = posts.find(p => p.id === postId);
    const likedBy = post?.likedBy || [];
    const wasLiked = likedBy.includes(handle);
    
    toggleLike(postId, handle);
    
    // Track pour les recommandations
    if (post) {
      if (wasLiked) {
        recordUnlike(postId);
      } else {
        recLike(post);
      }
    }
    
    // Send notification to author
    if (post && post.handle !== handle && currentUser && !wasLiked) {
      notifyLike(currentUser.username, currentUser.handle, postId);
    }
  }, [toggleLike, posts, currentUser, notifyLike, recLike, recordUnlike]);

  // Handle comment with notification and recommendation tracking
  const handleComment = useCallback((postId: string, text: string) => {
    if (!currentUser) return;
    addComment(postId, text, currentUser.id, currentUser.username, currentUser.handle);
    
    const post = posts.find(p => p.id === postId);
    if (post) {
      recComment(post); // Track pour les recommandations
      
      if (post.handle !== currentUser.handle) {
        notifyComment(currentUser.username, currentUser.handle, postId, text);
      }
    }
  }, [addComment, posts, currentUser, notifyComment, recComment]);

  // Handle post creation with success overlay
  const handleCreatePost = useCallback((post: Parameters<typeof addPost>[0]) => {
    addPost(post);
    // Show success overlay with animated view counter
    setPostSuccessData({ views: Math.floor(Math.random() * 10) + 1 });
    
    // Vérifier si le post complète un challenge
    if (currentUser) {
      const newPost = { ...post, id: `temp-${Date.now()}` } as Post;
      const completedChallengeId = checkChallengeCompletion(newPost, currentUser.handle);
      if (completedChallengeId) {
        setTimeout(() => setCompletedChallenge(completedChallengeId), 1500);
      }
    }
  }, [addPost, currentUser, checkChallengeCompletion]);
  useEffect(() => {
    if (analyticsReady) {
      trackVisit();
    }
  }, [analyticsReady, trackVisit]);

  // Show featured post popup
  useEffect(() => {
    if (featuredPost && !showFeatured) {
      const timer = setTimeout(() => setShowFeatured(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [featuredPost, showFeatured]);

  const selectedPost = useMemo(() => posts.find((p) => p.id === selectedId) ?? null, [posts, selectedId]);

  // Filtered posts - use recommendations when available
  const filtered = useMemo(() => {
    // If user has interests configured, use recommended posts for "all" mode
    if (mode === "all" && currentUser && hasConfiguredInterests && forYouPosts.length > 0) {
      let arr = forYouPosts.map(sp => sp.post).filter((p) => inTimeRange(p, timeRange));
      if (categoryFilter !== "all") {
        arr = arr.filter((p) => p.category === categoryFilter);
      }
      return arr;
    }

    let arr = posts.filter((p) => inTimeRange(p, timeRange));

    // Follows only
    const userFollowing = currentUser?.following || [];
    if (followsOnly && userFollowing.length > 0) {
      arr = arr.filter((p) => userFollowing.includes(p.handle));
    }

    // Category filter
    if (categoryFilter !== "all") {
      arr = arr.filter((p) => p.category === categoryFilter);
    }

    // Mode filters
    if (mode === "following" && userFollowing.length > 0) {
      return arr.filter((p) => userFollowing.includes(p.handle)).sort((a, b) => scoreForTrending(b) - scoreForTrending(a));
    }
    if (mode === "sponsored") {
      return arr.filter((p) => p.kind === "promoted").sort((a, b) => scoreForTrending(b) - scoreForTrending(a));
    }
    if (mode === "nearby") {
      return arr
        .filter((p) => typeof p.lon === "number" && typeof p.lat === "number" && haversineKm({ lon: p.lon, lat: p.lat }, mapCenter) <= 800)
        .sort((a, b) => scoreForTrending(b) - scoreForTrending(a));
    }
    if (mode === "trending") {
      return [...arr].sort((a, b) => scoreForTrending(b) - scoreForTrending(a));
    }

    return [...arr].sort((a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime());
  }, [posts, mode, mapCenter, timeRange, categoryFilter, followsOnly, currentUser, hasConfiguredInterests, forYouPosts]);

  const postsOnMap = useMemo(() => filtered.filter((p) => typeof p.lon === "number" && typeof p.lat === "number"), [filtered]);

  // Discovery mode - utilise les posts recommandés
  const discoveryPosts = useMemo(() => {
    // Prioriser les posts recommandés, sinon utiliser les posts filtrés
    const postsToUse = forYouPosts.length > 0 
      ? forYouPosts.map(sp => sp.post) 
      : filtered;
    return postsToUse.filter(p => typeof p.lon === "number" && typeof p.lat === "number");
  }, [forYouPosts, filtered]);

  const {
    currentPost: discoveryCurrentPost,
    currentIndex: discoveryIndex,
    totalPosts: discoveryTotal,
    isTransitioning: discoveryTransitioning,
    goToNext: discoveryNext,
    goToPrevious: discoveryPrev,
  } = useDiscoveryMode(discoveryPosts, discoveryEnabled, 8000);

  // Post actuellement dans le popup de la carte
  const mapPopupPost = useMemo(() => {
    if (discoveryEnabled && discoveryCurrentPost) {
      return discoveryCurrentPost;
    }
    if (mapPopupPostId) {
      return postsOnMap.find(p => p.id === mapPopupPostId) || null;
    }
    return null;
  }, [mapPopupPostId, postsOnMap, discoveryEnabled, discoveryCurrentPost]);

  // Vérifier si l'utilisateur a liké le post du popup
  const isMapPopupLiked = useMemo(() => {
    if (!currentUser || !mapPopupPost) return false;
    return (mapPopupPost.likedBy || []).includes(currentUser.handle);
  }, [currentUser, mapPopupPost]);

  // Handler pour le clic sur une puce
  const handlePostClick = useCallback((postId: string, screenPos: { x: number; y: number }) => {
    // Si le mode découverte est activé, le désactiver
    if (discoveryEnabled) {
      setDiscoveryEnabled(false);
    }
    setMapPopupPostId(postId);
    setPopupScreenPos(screenPos);
  }, [discoveryEnabled]);

  // Fermer le popup de la carte
  const closeMapPopup = useCallback(() => {
    setMapPopupPostId(null);
    setPopupScreenPos(null);
  }, []);

  // Projection pour HotZoneOverlay (mémorisée pour éviter les re-renders)
  const hotZoneMapProjection = useCallback((coords: { lat: number; lon: number }) => {
    if (typeof window === "undefined") return null;
    return {
      x: ((coords.lon + 180) / 360) * window.innerWidth,
      y: ((90 - coords.lat) / 180) * window.innerHeight,
    };
  }, []);

  // Handler pour clic sur hot zone
  const handleHotZoneClick = useCallback((zone: { center: { lon: number; lat: number } }) => {
    setFocus({ lon: zone.center.lon, lat: zone.center.lat });
  }, []);

  // Effect pour centrer sur le post en mode découverte
  useEffect(() => {
    if (discoveryEnabled && discoveryCurrentPost && discoveryCurrentPost.lon && discoveryCurrentPost.lat) {
      setFocus({ lon: discoveryCurrentPost.lon, lat: discoveryCurrentPost.lat });
      // Calculer la position écran approximative (centre de l'écran)
      if (typeof window !== "undefined") {
        setPopupScreenPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      }
    }
  }, [discoveryEnabled, discoveryCurrentPost]);

  // Fermer le popup quand on désactive le mode découverte
  useEffect(() => {
    if (!discoveryEnabled) {
      // Garder le popup ouvert si on a cliqué sur une puce manuellement
      if (!mapPopupPostId) {
        setPopupScreenPos(null);
      }
    }
  }, [discoveryEnabled, mapPopupPostId]);

  // Viral posts not dismissed
  const activeViralPosts = useMemo(() => {
    return viralPosts.filter((p) => !dismissedViral.has(p.id));
  }, [viralPosts, dismissedViral]);

  // Handle share
  const handleShare = (postId: string) => {
    sharePost(postId);
  };

  // Handle report
  const handleReport = (postId: string, reason: ReportReason, details?: string) => {
    if (!currentUser) return;
    reportPost(postId, currentUser.id, currentUser.handle, reason, details);
  };

  // Loading
  if (!authReady || !postsReady || !analyticsReady) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gradient-to-br from-sky-50 via-fuchsia-50 to-amber-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent" />
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden page-map">
      {/* Animated Background for special events */}
      <AnimatedBackground event={activeBackgroundEvent} />

      {/* Map */}
      <GlobeMap
        theme={themeMode}
        postsOnMap={postsOnMap}
        onSelectPostId={(id) => setSelectedId(id)}
        onPostClick={handlePostClick}
        focus={focus}
        onCenterChange={(c) => setMapCenter(c)}
        projection={projection}
        layers={layers}
        follows={currentUser?.following ?? []}
        selectedPostId={mapPopupPost?.id}
        groupMembers={groupMembersOnMap}
        onMemberClick={handleMemberClick}
        selectedMemberHandle={selectedMember?.userHandle}
      />

      {/* Map Post Popup - au-dessus de la puce */}
      <MapPostPopup
        post={mapPopupPost}
        screenPosition={popupScreenPos}
        onClose={closeMapPopup}
        onLike={() => {
          if (mapPopupPost && currentUser) {
            handleLike(mapPopupPost.id, currentUser.handle);
          }
        }}
        onComment={() => {
          if (mapPopupPost) {
            setSelectedId(mapPopupPost.id);
            closeMapPopup();
          }
        }}
        onViewDetails={() => {
          if (mapPopupPost) {
            setSelectedId(mapPopupPost.id);
            closeMapPopup();
          }
        }}
        isLiked={isMapPopupLiked}
      />

      {/* Group Member Popup - above member marker */}
      <GroupMemberPopup
        member={selectedMember}
        screenPosition={memberPopupPos}
        onClose={closeMemberPopup}
        onMessage={handleMessageMember}
        onViewProfile={handleViewMemberProfile}
        currentUserHandle={currentUser?.handle}
      />

      {/* Location Signature Popup */}
      <LocationSignaturePopup
        signature={selectedSignature}
        screenPosition={signaturePopupPos}
        onClose={closeSignaturePopup}
        onViewPost={(postId) => setSelectedId(postId)}
        onViewProfile={(handle) => router.push(`/u/${handle}`)}
      />

      {/* Territory Popup */}
      <TerritoryPopup
        territory={selectedTerritory}
        screenPosition={territoryPopupPos}
        currentUserHandle={currentUser?.handle}
        onClose={closeTerritoryPopup}
        onViewProfile={(handle) => router.push(`/u/${handle}`)}
      />

      {/* Live Wave Overlays */}
      {activeWaves.map(wave => (
        <LiveWaveOverlay
          key={wave.id}
          wave={wave}
          mapProjection={mapProjection}
        />
      ))}

      {/* Wave Reached Notification */}
      {waveNotification && (
        <WaveReachedNotification
          wave={waveNotification}
          onDismiss={dismissWaveNotification}
          onViewPost={(postId) => setSelectedId(postId)}
        />
      )}

      {/* Active Waves Indicator */}
      <ActiveWavesIndicator
        waveCount={activeWaves.length}
        onClick={() => setViralFeedOpen(true)}
      />

      {/* Viral Events Feed */}
      <ViralEventsFeed
        isOpen={viralFeedOpen}
        onClose={() => setViralFeedOpen(false)}
        onViewPost={(postId) => setSelectedId(postId)}
        onViewProfile={(handle) => router.push(`/u/${handle}`)}
      />

      {/* Time Capsule Hints */}
      {currentUser && capsuleHints.length > 0 && (
        <CapsuleHintIndicator
          hints={capsuleHints}
          onClick={() => {
            // Could navigate to nearest capsule direction
          }}
        />
      )}

      {/* Revealed Time Capsule Modal */}
      {revealedCapsule && (
        <TimeCapsuleRevealed
          capsule={revealedCapsule}
          onClose={() => setRevealedCapsule(null)}
          onReact={(reaction) => handleCapsuleReaction(revealedCapsule.id, reaction)}
          onViewProfile={(handle) => router.push(`/u/${handle}`)}
          currentUserHandle={currentUser?.handle}
        />
      )}

      {/* Create Time Capsule Modal */}
      {currentUser && (
        <CreateTimeCapsule
          open={createCapsuleOpen}
          location={mapCenter}
          onClose={() => setCreateCapsuleOpen(false)}
          onCreate={(data) => handleCreateCapsule({
            ...data,
            creatorId: currentUser.id,
            creatorHandle: currentUser.handle,
            creatorUsername: currentUser.username,
            creatorAvatar: currentUser.avatar,
            location: mapCenter,
          })}
        />
      )}

      {/* Discovery Mode Controls */}
      <DiscoveryMode
        posts={discoveryPosts}
        currentUser={currentUser}
        isEnabled={discoveryEnabled}
        onToggle={() => {
          setDiscoveryEnabled(!discoveryEnabled);
          if (!discoveryEnabled) {
            closeMapPopup();
          }
        }}
        onSelectPost={(post) => {
          setSelectedId(post.id);
          setDiscoveryEnabled(false);
        }}
        onFlyTo={(coords) => setFocus(coords)}
      />

      {/* Hot Zones Overlay */}
      <HotZoneOverlay
        hotZones={hotZones}
        mapProjection={hotZoneMapProjection}
        onZoneClick={handleHotZoneClick}
      />

      {/* Challenges FAB */}
      <ChallengesFAB
        activeChallenges={activeChallenges.length}
        completedCount={currentUser ? activeChallenges.filter(c => c.completedBy.includes(currentUser.handle)).length : 0}
        onClick={() => setChallengesPanelOpen(true)}
      />

      {/* Challenges Panel */}
      <ChallengesPanel
        challenges={activeChallenges}
        userHandle={currentUser?.handle}
        onJoin={(challengeId) => {
          if (currentUser) {
            joinChallenge(challengeId, currentUser.handle);
          } else {
            setAuthOpen(true);
          }
        }}
        onClose={() => setChallengesPanelOpen(false)}
        isOpen={challengesPanelOpen}
      />

      {/* Challenge Completed Toast */}
      {completedChallenge && (
        <ChallengeCompletedToast
          challenge={activeChallenges.find(c => c.id === completedChallenge)!}
          onClose={() => setCompletedChallenge(null)}
        />
      )}

      {/* Viral Posts Popups - masqués pendant le mode découverte */}
      {!discoveryEnabled && activeViralPosts.length > 0 && (
        <ViralPopupContainer
          posts={activeViralPosts}
          onPostClick={(post) => setSelectedId(post.id)}
          onClose={(postId) => setDismissedViral((prev) => new Set([...prev, postId]))}
        />
      )}

      {/* Left Rail - Compact */}
      <LeftRail
        mode={mode}
        setMode={(m) => {
          setMode(m);
          setFocus(null);
        }}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        projection={projection}
        setProjection={setProjection}
        onOpenLayers={() => setLayersOpen(true)}
        followsOnly={followsOnly}
        setFollowsOnly={setFollowsOnly}
        userGroups={userGroups}
        selectedGroupId={selectedGroup?.id}
        onSelectGroup={handleSelectGroup}
      />

      {/* Top Bar */}
      <TopBar
        online={onlineUsers}
        currentUser={currentUser}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenFeed={() => setFeedOpen(true)}
      />

      {/* Time Rail - Bottom right, compact */}
      <TimeRail value={timeRange} onChange={setTimeRange} />

      {/* Floating Compose Button */}
      <FloatingComposeButton
        onClick={() => {
          if (currentUser) {
            setComposeOpen(true);
          } else {
            setAuthOpen(true);
          }
        }}
      />

      {/* Floating Time Capsule Button */}
      {currentUser && (
        <button
          onClick={() => setCreateCapsuleOpen(true)}
          className="fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg transition-transform hover:scale-110 sm:bottom-8 sm:right-24"
          title="Enterrer une Time Capsule"
        >
          <span className="text-xl">⏳</span>
        </button>
      )}

      {/* Modals */}
      <LayersSheet open={layersOpen} toggles={layers} onClose={() => setLayersOpen(false)} onChange={setLayers} />

      <FeedSheet
        open={feedOpen}
        posts={filtered}
        currentUser={currentUser}
        onClose={() => setFeedOpen(false)}
        onPick={(id) => setSelectedId(id)}
        onFocus={(p) => {
          if (typeof p.lon === "number" && typeof p.lat === "number") setFocus({ lon: p.lon, lat: p.lat });
        }}
        onToggleLike={toggleLike}
      />

      <PostSheet
        open={!!selectedPost}
        post={selectedPost}
        currentUser={currentUser}
        isFollowing={selectedPost ? isFollowing(selectedPost.handle) : false}
        onClose={() => setSelectedId(null)}
        onToggleLike={toggleLike}
        onAddComment={addComment}
        onToggleFollow={toggleFollow}
        onShare={handleShare}
        onReport={handleReport}
      />

      <ComposeSheet
        open={composeOpen}
        currentUser={currentUser}
        mapCenter={mapCenter}
        onClose={() => setComposeOpen(false)}
        onCreate={handleCreatePost}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onLogin={login}
        onRegister={register}
      />

      <ProfileMenu
        open={profileOpen}
        user={currentUser}
        onClose={() => setProfileOpen(false)}
        onLogout={logout}
      />

      {/* Featured Post Popup */}
      {showFeatured && featuredPost && (
        <FeaturedPopup
          post={featuredPost}
          onClose={() => setShowFeatured(false)}
          onLike={() => currentUser && toggleLike(featuredPost.id, currentUser.handle)}
          onShare={() => handleShare(featuredPost.id)}
        />
      )}

      {/* Branding - subtle */}
      <div className="pointer-events-none fixed bottom-20 left-1/2 z-10 -translate-x-1/2 sm:bottom-4">
        <div className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-500 shadow backdrop-blur dark:bg-neutral-900/80 dark:text-neutral-400">
          <span className="bg-gradient-to-r from-sky-500 via-fuchsia-500 to-amber-500 bg-clip-text font-bold text-transparent">GlobeHub</span>
          {activeBackgroundEvent && (
            <span className="ml-2 text-fuchsia-500">✨ {activeBackgroundEvent.name}</span>
          )}
        </div>
      </div>
    </div>
  );
}
