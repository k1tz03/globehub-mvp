// === USERS ===
export type UserRole = "user" | "moderator" | "admin";

// Catégories d'intérêts disponibles
export type InterestCategory = 
  | "music"
  | "sports"
  | "travel"
  | "food"
  | "tech"
  | "art"
  | "fashion"
  | "gaming"
  | "nature"
  | "politics"
  | "science"
  | "cinema"
  | "photography"
  | "fitness"
  | "business"
  | "lifestyle";

export const INTEREST_LABELS: Record<InterestCategory, string> = {
  music: "🎵 Musique",
  sports: "⚽ Sport",
  travel: "✈️ Voyage",
  food: "🍕 Gastronomie",
  tech: "💻 Tech",
  art: "🎨 Art",
  fashion: "👗 Mode",
  gaming: "🎮 Gaming",
  nature: "🌿 Nature",
  politics: "🏛️ Politique",
  science: "🔬 Science",
  cinema: "🎬 Cinéma",
  photography: "📷 Photo",
  fitness: "💪 Fitness",
  business: "💼 Business",
  lifestyle: "✨ Lifestyle",
};

export type UserSettings = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  privateProfile: boolean;
  showOnlineStatus: boolean;
  allowMessages: "everyone" | "followers" | "none";
  // Nouvelles options de notifications
  notifyOnLike: boolean;
  notifyOnComment: boolean;
  notifyOnFollow: boolean;
  notifyOnMention: boolean;
  showInAppNotifications: boolean;
  soundEnabled: boolean;
};

export type UserEngagement = {
  searchHistory: string[];
  likedPostIds: string[];
  commentedPostIds: string[];
  viewedPostIds: string[];
  interests: InterestCategory[];
  lastActiveAt: string;
  sessionCount: number;
  totalTimeSpent: number; // en secondes
  preferredContentType: "text" | "image" | "video" | "mixed";
};

export type User = {
  id: string;
  username: string;
  handle: string;
  email: string;
  password?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt: string;
  role: UserRole;
  isVerified: boolean;
  isBanned: boolean;
  followers: string[];
  following: string[];
  blockedUsers: string[];
  stats: {
    posts: number;
    likes: number;
    comments: number;
  };
  settings: UserSettings;
  engagement: UserEngagement;
};

// === POSTS ===
export type PostKind = "normal" | "following" | "promoted" | "featured";
export type PostCategory = "vibe" | "news" | "event" | "alert";
export type SignalStrength = "none" | "weak" | "strong";
export type GeoMode = "none" | "approximate" | "precise";
export type MediaType = "image" | "video" | "youtube" | "tiktok";
export type PostStatus = "active" | "hidden" | "flagged" | "deleted";

export type Media = {
  type: MediaType;
  url: string;
  thumbnail?: string;
};

export type Comment = {
  id: string;
  authorId: string;
  author: string;
  handle: string;
  text: string;
  createdAtISO: string;
  likes: number;
};

export type Post = {
  id: string;
  authorId: string;
  author: string;
  handle: string;
  avatar?: string;
  text: string;
  createdAtISO: string;
  isVerified?: boolean; // Auteur vérifié

  kind: PostKind;
  category: PostCategory;
  signal: SignalStrength;
  geoMode: GeoMode;
  status: PostStatus;

  likes: number;
  likedBy: string[];
  comments: Comment[];
  shares: number;
  views: number;

  media?: Media;

  lon?: number;
  lat?: number;

  viralityScore: number;
  isPinned?: boolean;
  isFeatured?: boolean;
  featuredUntil?: string;
  
  // Mise en avant manuelle par admin
  isPromotedByAdmin?: boolean;
  promotedAt?: string;
  promotedBy?: string;
  promotionPriority?: number;

  reports?: number;
  moderatedAt?: string;
  moderatedBy?: string;
  autoFlagged?: boolean;
  flagReason?: string;
  
  // Métriques d'engagement pour l'algorithme
  engagementRate: number; // (likes + comments + shares) / views
  peakViewsPerMinute: number;
  viewsHistory: { timestamp: string; count: number }[];
  tags?: string[]; // Tags pour catégorisation
  detectedInterests?: InterestCategory[]; // Intérêts détectés automatiquement
};

// === REPORTS ===
export type ReportReason = 
  | "spam" 
  | "hate" 
  | "violence" 
  | "misinformation" 
  | "harassment" 
  | "inappropriate" 
  | "copyright" 
  | "impersonation"
  | "suicide_self_harm"
  | "illegal_content"
  | "other";

export type ReportCategory = "post" | "user" | "message" | "comment";

export type Report = {
  id: string;
  category: ReportCategory;
  targetId: string;
  reporterId: string;
  reporterHandle: string;
  reason: ReportReason;
  details?: string;
  createdAt: string;
  status: "pending" | "reviewed" | "dismissed" | "actioned";
  reviewedBy?: string;
  reviewedAt?: string;
  actionTaken?: string;
};

// === MESSAGING ===
export type MessageStatus = "sent" | "delivered" | "read" | "deleted";

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderHandle: string;
  text: string;
  createdAt: string;
  editedAt?: string;
  status: MessageStatus;
  isDeleted: boolean;
  deletedFor: string[];
};

export type Conversation = {
  id: string;
  participants: string[];
  createdAt: string;
  lastMessageAt: string;
  lastMessage?: string;
  unreadCount: Record<string, number>;
  isBlocked: boolean;
  blockedBy?: string;
};

// === ANALYTICS ===
export type AnalyticsEvent = {
  id: string;
  type: "view" | "click" | "share" | "search" | "login" | "signup" | "post_create" | "message_send";
  userId?: string;
  data?: Record<string, unknown>;
  timestamp: string;
  sessionId: string;
};

export type HourlyStats = {
  hour: number;
  visitors: number;
  pageViews: number;
  postsCreated: number;
};

export type SearchStat = {
  query: string;
  count: number;
};

export type DailyStats = {
  date: string;
  visitors: number;
  uniqueVisitors: number;
  pageViews: number;
  newUsers: number;
  postsCreated: number;
  messagesCreated: number;
  likes: number;
  comments: number;
  shares: number;
  searches: SearchStat[];
  hourlyBreakdown: HourlyStats[];
};

export type LiveStats = {
  onlineUsers: number;
  activeConversations: number;
  postsLastHour: number;
  trendingPosts: string[];
  peakToday: number;
  currentTimestamp: string;
};

// === BACKGROUND EVENTS ===
export type BackgroundEventType = 
  | "none" 
  | "new_year" 
  | "chinese_new_year"
  | "christmas" 
  | "halloween" 
  | "valentine"
  | "easter"
  | "summer"
  | "custom" 
  | "sponsored";

export type BackgroundEvent = {
  id: string;
  name: string;
  description?: string;
  type: BackgroundEventType;
  isActive: boolean;
  startDate: string;
  endDate: string;
  cssClass?: string;
  priority: number;
  
  // Code personnalisé (pour type "custom")
  customCSS?: string;
  customJS?: string;
  customHTML?: string;
  
  // Sponsoring
  sponsorName?: string;
  sponsorLogo?: string;
  sponsorUrl?: string;
  sponsorBudget?: number;
  
  // Métadonnées
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  
  // Stats
  impressions?: number;
  clicks?: number;
};

// Labels pour les types d'événements
export const BG_EVENT_LABELS: Record<BackgroundEventType, string> = {
  none: "Aucun",
  new_year: "🎆 Nouvel An",
  chinese_new_year: "🧧 Nouvel An Chinois",
  christmas: "🎄 Noël",
  halloween: "🎃 Halloween",
  valentine: "💕 Saint-Valentin",
  easter: "🐣 Pâques",
  summer: "☀️ Été",
  custom: "🎨 Personnalisé",
  sponsored: "💰 Sponsorisé",
};

// === AUTO SHARE ===
export type SocialPlatform = "twitter" | "facebook" | "instagram" | "threads";

export type AutoShareConfig = {
  enabled: boolean;
  platforms: SocialPlatform[];
  intervalHours: number;
  minViralityScore: number;
  maxPostsPerShare: number;
  lastShareTime?: string;
  hashtags: string[];
  includeLink: boolean;
  customMessage?: string;
};

export type ShareLog = {
  id: string;
  postId: string;
  platform: SocialPlatform;
  timestamp: string;
  success: boolean;
  error?: string;
};

// === CONTENT MODERATION ===
export type ModerationRule = {
  id: string;
  name: string;
  isActive: boolean;
  type: "keyword" | "regex" | "ai";
  pattern: string;
  action: "flag" | "hide" | "delete";
  severity: "low" | "medium" | "high";
  createdAt: string;
  triggeredCount: number;
};

export type ModerationLog = {
  id: string;
  postId: string;
  ruleId?: string;
  action: string;
  reason: string;
  timestamp: string;
  moderatorHandle?: string;
  isAutomatic: boolean;
};

// === APP STATE ===
export type FeedMode = "all" | "trending" | "nearby" | "following" | "sponsored";
export type ProjectionMode = "globe" | "flat";
export type TimeRange = "live" | "1h" | "24h" | "7d";

export type LayerToggles = {
  pulse: boolean;
  heat: boolean;
  trails: boolean;
};

export type CategoryFilter = PostCategory | "all";

// === AUTH ===
export type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
};

// === NOTIFICATIONS ===
export type NotificationType = 
  | "like" 
  | "comment" 
  | "follow" 
  | "mention" 
  | "message" 
  | "report_resolved"
  | "post_featured"
  | "account_warning";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
};

// === SPONSORED ===
export type SponsoredPost = Post & {
  budget: number;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

// === GROUPS ===
export type GroupRole = "member" | "moderator" | "admin" | "owner";
export type GroupVisibility = "public" | "private";
export type GroupJoinMode = "open" | "request" | "invite_only";

export type GroupMember = {
  userId: string;
  userHandle: string;
  role: GroupRole;
  joinedAt: string;
  lastSeenAt?: string;
  isOnline?: boolean;
  // Position sur la carte (si partagée)
  lat?: number;
  lon?: number;
  shareLocation?: boolean;
};

export type GroupMessage = {
  id: string;
  groupId: string;
  senderId: string;
  senderHandle: string;
  senderAvatar?: string;
  text: string;
  createdAt: string;
  editedAt?: string;
  isDeleted?: boolean;
  // Pour la modération
  isFlagged?: boolean;
  flagReason?: string;
};

export type GroupPost = {
  id: string;
  postId: string; // Référence au Post principal
  groupId: string;
  addedBy: string;
  addedAt: string;
};

export type JoinRequest = {
  id: string;
  userId: string;
  userHandle: string;
  groupId: string;
  message?: string;
  createdAt: string;
  status: "pending" | "accepted" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
};

export type Group = {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  coverImage?: string;
  
  // Paramètres
  visibility: GroupVisibility;
  joinMode: GroupJoinMode;
  allowMemberPosts: boolean;
  allowMemberInvites: boolean;
  showMembersOnMap: boolean;
  
  // Membres
  members: GroupMember[];
  memberCount: number;
  
  // Catégorie/tags
  category?: InterestCategory;
  tags?: string[];
  
  // Métadonnées
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  
  // Stats
  totalMessages: number;
  totalPosts: number;
  lastActivityAt: string;
  
  // Modération
  isBanned?: boolean;
  bannedAt?: string;
  bannedReason?: string;
  flaggedMessagesCount?: number;
};

// Labels pour l'UI
export const GROUP_VISIBILITY_LABELS: Record<GroupVisibility, string> = {
  public: "🌍 Public",
  private: "🔒 Privé",
};

export const GROUP_JOIN_MODE_LABELS: Record<GroupJoinMode, string> = {
  open: "Ouvert à tous",
  request: "Sur demande",
  invite_only: "Sur invitation",
};

export const GROUP_ROLE_LABELS: Record<GroupRole, string> = {
  member: "Membre",
  moderator: "Modérateur",
  admin: "Administrateur",
  owner: "Propriétaire",
};
