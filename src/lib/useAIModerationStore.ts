"use client";

import { create } from "zustand";

// Catégories de classification IA
export type AICategory =
  | "safe"           // Contenu sûr
  | "spam"           // Spam
  | "hate"           // Discours haineux
  | "harassment"     // Harcèlement
  | "violence"       // Violence
  | "sexual"         // Contenu sexuel
  | "self_harm"      // Automutilation
  | "misinformation" // Désinformation
  | "illegal"        // Contenu illégal
  | "copyright";     // Violation de droits

export interface AIClassification {
  id: string;
  contentId: string;
  contentType: "post" | "comment" | "message" | "profile";
  contentText: string;
  contentAuthorHandle: string;

  // Résultats
  primaryCategory: AICategory;
  confidence: number; // 0-100
  allScores: Record<AICategory, number>;

  // Actions recommandées
  recommendedAction: "none" | "flag" | "hide" | "delete" | "escalate";
  actionReason: string;

  // Détails
  flaggedPhrases: Array<{
    text: string;
    category: AICategory;
    severity: number;
  }>;

  // Toxicité (score global 0-100)
  toxicityScore: number;
  isToxic: boolean;

  // Meta
  classifiedAt: string;
  modelVersion: string;
  processingTimeMs: number;

  // Feedback humain
  humanVerified: boolean;
  humanVerdict?: {
    correct: boolean;
    actualCategory?: AICategory;
    verifiedBy: string;
    verifiedAt: string;
    notes?: string;
  };
}

// Configuration du modèle
export interface AIModelConfig {
  enabled: boolean;
  autoActionThreshold: number; // Seuil de confiance pour action auto (0-100)
  toxicityThreshold: number;   // Seuil de toxicité (0-100)
  categoriesEnabled: AICategory[];
  requireHumanReview: boolean; // Si true, actions auto désactivées
  learningEnabled: boolean;    // Si true, apprend des corrections humaines
}

// Mots et patterns pour simulation de classification
const CATEGORY_PATTERNS: Record<AICategory, { keywords: string[]; weight: number }> = {
  safe: { keywords: [], weight: 0 },
  spam: {
    keywords: ["promo", "gratuit", "gagner", "cliquez", "abonnez", "offre", "réduction", "suivez-moi", "follow", "f4f"],
    weight: 15
  },
  hate: {
    keywords: ["déteste", "haine", "race", "religion", "dégage", "crève", "sale"],
    weight: 25
  },
  harassment: {
    keywords: ["harcèlement", "stalker", "menace", "intimider", "persécuter"],
    weight: 30
  },
  violence: {
    keywords: ["tuer", "frapper", "violence", "blesser", "attaquer", "massacre"],
    weight: 35
  },
  sexual: {
    keywords: ["sexe", "nude", "xxx", "porno", "onlyfans"],
    weight: 30
  },
  self_harm: {
    keywords: ["suicide", "me tuer", "en finir", "mourir", "overdose"],
    weight: 40
  },
  misinformation: {
    keywords: ["fake news", "complot", "mensonge", "vérité cachée", "ils nous mentent"],
    weight: 20
  },
  illegal: {
    keywords: ["drogue", "cocaïne", "dealer", "arme", "faux papiers"],
    weight: 35
  },
  copyright: {
    keywords: ["torrent", "crack", "pirate", "télécharger", "streaming illégal"],
    weight: 20
  }
};

const ACTION_THRESHOLDS = {
  none: 30,
  flag: 50,
  hide: 70,
  delete: 85,
  escalate: 95
};

interface AIModerationState {
  classifications: AIClassification[];
  config: AIModelConfig;
  ready: boolean;

  // === CLASSIFICATION ===

  classifyContent: (content: {
    id: string;
    type: "post" | "comment" | "message" | "profile";
    text: string;
    authorHandle: string;
  }) => AIClassification;

  // Classification par lot
  classifyBatch: (contents: Array<{
    id: string;
    type: "post" | "comment" | "message" | "profile";
    text: string;
    authorHandle: string;
  }>) => AIClassification[];

  // === FEEDBACK ===

  submitHumanFeedback: (classificationId: string, data: {
    correct: boolean;
    actualCategory?: AICategory;
    verifierHandle: string;
    notes?: string;
  }) => void;

  // === CONFIGURATION ===

  updateConfig: (updates: Partial<AIModelConfig>) => void;
  toggleCategory: (category: AICategory, enabled: boolean) => void;

  // === QUERIES ===

  getClassificationById: (id: string) => AIClassification | undefined;
  getContentClassification: (contentId: string) => AIClassification | undefined;
  getRecentClassifications: (limit?: number) => AIClassification[];
  getPendingReviews: () => AIClassification[]; // Classifications nécessitant une vérification humaine
  getFalsePositives: () => AIClassification[];
  getFalseNegatives: () => AIClassification[];

  // === STATS ===

  getStats: () => {
    totalClassified: number;
    flaggedCount: number;
    autoActioned: number;
    humanVerified: number;
    accuracy: number; // Basé sur les feedbacks
    avgConfidence: number;
    avgProcessingTime: number;
    byCategory: Record<AICategory, number>;
    falsePositiveRate: number;
    falseNegativeRate: number;
  };

  // === APPRENTISSAGE ===

  getModelPerformance: () => {
    precision: Record<AICategory, number>;
    recall: Record<AICategory, number>;
    f1Score: Record<AICategory, number>;
    confusionMatrix: Record<AICategory, Record<AICategory, number>>;
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Simuler la classification IA
function simulateClassification(text: string): {
  scores: Record<AICategory, number>;
  flaggedPhrases: AIClassification["flaggedPhrases"];
  toxicity: number;
} {
  const lowerText = text.toLowerCase();
  const scores: Record<AICategory, number> = {
    safe: 80,
    spam: 0,
    hate: 0,
    harassment: 0,
    violence: 0,
    sexual: 0,
    self_harm: 0,
    misinformation: 0,
    illegal: 0,
    copyright: 0
  };

  const flaggedPhrases: AIClassification["flaggedPhrases"] = [];

  for (const [category, { keywords, weight }] of Object.entries(CATEGORY_PATTERNS) as [AICategory, { keywords: string[]; weight: number }][]) {
    if (category === "safe") continue;

    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        scores[category] += weight;
        scores.safe -= weight * 0.5;
        flaggedPhrases.push({
          text: keyword,
          category,
          severity: weight / 40 * 100
        });
      }
    }
  }

  // Normaliser les scores entre 0 et 100
  for (const category of Object.keys(scores) as AICategory[]) {
    scores[category] = Math.max(0, Math.min(100, scores[category]));
  }

  // Calculer la toxicité globale
  const toxicity = Math.max(
    scores.hate,
    scores.harassment,
    scores.violence,
    scores.self_harm
  );

  return { scores, flaggedPhrases, toxicity };
}

function determineAction(confidence: number, category: AICategory, toxicity: number): "none" | "flag" | "hide" | "delete" | "escalate" {
  if (category === "safe" || confidence < ACTION_THRESHOLDS.none) return "none";

  // Actions urgentes pour certaines catégories
  if ((category === "self_harm" || category === "illegal") && confidence >= 60) {
    return "escalate";
  }

  if (confidence >= ACTION_THRESHOLDS.escalate || toxicity >= 90) return "escalate";
  if (confidence >= ACTION_THRESHOLDS.delete || toxicity >= 80) return "delete";
  if (confidence >= ACTION_THRESHOLDS.hide || toxicity >= 60) return "hide";
  if (confidence >= ACTION_THRESHOLDS.flag) return "flag";

  return "none";
}

const DEFAULT_CONFIG: AIModelConfig = {
  enabled: true,
  autoActionThreshold: 85,
  toxicityThreshold: 70,
  categoriesEnabled: ["spam", "hate", "harassment", "violence", "sexual", "self_harm", "illegal"],
  requireHumanReview: true,
  learningEnabled: true
};

export const useAIModerationStore = create<AIModerationState>((set, get) => ({
  classifications: [],
  config: DEFAULT_CONFIG,
  ready: true,

  classifyContent: (content) => {
    const startTime = Date.now();
    const { scores, flaggedPhrases, toxicity } = simulateClassification(content.text);

    // Trouver la catégorie principale (hors "safe")
    let primaryCategory: AICategory = "safe";
    let maxScore = 0;

    for (const [category, score] of Object.entries(scores) as [AICategory, number][]) {
      if (category !== "safe" && score > maxScore && score >= 30) {
        maxScore = score;
        primaryCategory = category;
      }
    }

    const confidence = primaryCategory === "safe" ? scores.safe : maxScore;
    const action = determineAction(confidence, primaryCategory, toxicity);

    const classification: AIClassification = {
      id: `ai_${uid()}`,
      contentId: content.id,
      contentType: content.type,
      contentText: content.text,
      contentAuthorHandle: content.authorHandle,
      primaryCategory,
      confidence,
      allScores: scores,
      recommendedAction: action,
      actionReason: action === "none"
        ? "Contenu jugé acceptable"
        : `Détection de contenu potentiellement ${primaryCategory} (confiance: ${confidence}%)`,
      flaggedPhrases,
      toxicityScore: toxicity,
      isToxic: toxicity >= get().config.toxicityThreshold,
      classifiedAt: new Date().toISOString(),
      modelVersion: "v1.0.0-simulated",
      processingTimeMs: Date.now() - startTime + Math.random() * 50,
      humanVerified: false
    };

    set({ classifications: [...get().classifications, classification] });
    return classification;
  },

  classifyBatch: (contents) => {
    return contents.map(content => get().classifyContent(content));
  },

  submitHumanFeedback: (classificationId, data) => {
    const { classifications } = get();
    const updated = classifications.map(c => {
      if (c.id !== classificationId) return c;
      return {
        ...c,
        humanVerified: true,
        humanVerdict: {
          correct: data.correct,
          actualCategory: data.actualCategory,
          verifiedBy: data.verifierHandle,
          verifiedAt: new Date().toISOString(),
          notes: data.notes
        }
      };
    });
    set({ classifications: updated });
  },

  updateConfig: (updates) => {
    set({ config: { ...get().config, ...updates } });
  },

  toggleCategory: (category, enabled) => {
    const { config } = get();
    const categories = enabled
      ? [...config.categoriesEnabled, category]
      : config.categoriesEnabled.filter(c => c !== category);
    set({ config: { ...config, categoriesEnabled: categories } });
  },

  getClassificationById: (id) => {
    return get().classifications.find(c => c.id === id);
  },

  getContentClassification: (contentId) => {
    return get().classifications.find(c => c.contentId === contentId);
  },

  getRecentClassifications: (limit = 100) => {
    return get().classifications
      .sort((a, b) => new Date(b.classifiedAt).getTime() - new Date(a.classifiedAt).getTime())
      .slice(0, limit);
  },

  getPendingReviews: () => {
    return get().classifications.filter(c =>
      !c.humanVerified &&
      c.recommendedAction !== "none" &&
      c.confidence < get().config.autoActionThreshold
    );
  },

  getFalsePositives: () => {
    return get().classifications.filter(c =>
      c.humanVerified &&
      c.humanVerdict?.correct === false &&
      c.primaryCategory !== "safe" &&
      c.humanVerdict?.actualCategory === "safe"
    );
  },

  getFalseNegatives: () => {
    return get().classifications.filter(c =>
      c.humanVerified &&
      c.humanVerdict?.correct === false &&
      c.primaryCategory === "safe" &&
      c.humanVerdict?.actualCategory !== "safe"
    );
  },

  getStats: () => {
    const { classifications } = get();
    const verified = classifications.filter(c => c.humanVerified);
    const correct = verified.filter(c => c.humanVerdict?.correct);
    const flagged = classifications.filter(c => c.recommendedAction !== "none");
    const autoActioned = classifications.filter(c =>
      c.recommendedAction !== "none" && c.confidence >= get().config.autoActionThreshold
    );

    const falsePositives = get().getFalsePositives();
    const falseNegatives = get().getFalseNegatives();

    const byCategory = classifications.reduce((acc, c) => {
      acc[c.primaryCategory] = (acc[c.primaryCategory] || 0) + 1;
      return acc;
    }, {} as Record<AICategory, number>);

    const avgConfidence = classifications.length > 0
      ? classifications.reduce((sum, c) => sum + c.confidence, 0) / classifications.length
      : 0;

    const avgProcessingTime = classifications.length > 0
      ? classifications.reduce((sum, c) => sum + c.processingTimeMs, 0) / classifications.length
      : 0;

    return {
      totalClassified: classifications.length,
      flaggedCount: flagged.length,
      autoActioned: autoActioned.length,
      humanVerified: verified.length,
      accuracy: verified.length > 0 ? Math.round((correct.length / verified.length) * 100) : 0,
      avgConfidence: Math.round(avgConfidence),
      avgProcessingTime: Math.round(avgProcessingTime),
      byCategory,
      falsePositiveRate: verified.length > 0
        ? Math.round((falsePositives.length / verified.length) * 100)
        : 0,
      falseNegativeRate: verified.length > 0
        ? Math.round((falseNegatives.length / verified.length) * 100)
        : 0
    };
  },

  getModelPerformance: () => {
    // Retourne des métriques de performance simulées
    const categories: AICategory[] = ["spam", "hate", "harassment", "violence", "sexual", "self_harm", "misinformation", "illegal", "copyright"];

    const precision: Record<AICategory, number> = {} as Record<AICategory, number>;
    const recall: Record<AICategory, number> = {} as Record<AICategory, number>;
    const f1Score: Record<AICategory, number> = {} as Record<AICategory, number>;
    const confusionMatrix: Record<AICategory, Record<AICategory, number>> = {} as Record<AICategory, Record<AICategory, number>>;

    for (const cat of categories) {
      precision[cat] = 80 + Math.random() * 15;
      recall[cat] = 75 + Math.random() * 20;
      f1Score[cat] = 2 * (precision[cat] * recall[cat]) / (precision[cat] + recall[cat]);
      confusionMatrix[cat] = {} as Record<AICategory, number>;
      for (const cat2 of categories) {
        confusionMatrix[cat][cat2] = cat === cat2 ? Math.floor(80 + Math.random() * 20) : Math.floor(Math.random() * 10);
      }
    }

    return { precision, recall, f1Score, confusionMatrix };
  }
}));

// Labels
export const AI_CATEGORY_LABELS: Record<AICategory, { label: string; icon: string; description: string }> = {
  safe: { label: "Sûr", icon: "✅", description: "Contenu acceptable" },
  spam: { label: "Spam", icon: "📧", description: "Contenu promotionnel non sollicité" },
  hate: { label: "Haine", icon: "😡", description: "Discours haineux" },
  harassment: { label: "Harcèlement", icon: "🎯", description: "Harcèlement ciblé" },
  violence: { label: "Violence", icon: "⚔️", description: "Contenu violent" },
  sexual: { label: "Sexuel", icon: "🔞", description: "Contenu sexuel explicite" },
  self_harm: { label: "Automutilation", icon: "💔", description: "Promotion de l'automutilation" },
  misinformation: { label: "Désinformation", icon: "📰", description: "Fausses informations" },
  illegal: { label: "Illégal", icon: "⚖️", description: "Activités illégales" },
  copyright: { label: "Copyright", icon: "©️", description: "Violation de droits d'auteur" }
};

export const AI_ACTION_LABELS: Record<AIClassification["recommendedAction"], { label: string; color: string }> = {
  none: { label: "Aucune", color: "green" },
  flag: { label: "Signaler", color: "amber" },
  hide: { label: "Masquer", color: "orange" },
  delete: { label: "Supprimer", color: "red" },
  escalate: { label: "Escalader", color: "purple" }
};
