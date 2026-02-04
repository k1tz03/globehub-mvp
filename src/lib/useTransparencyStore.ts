"use client";

import { create } from "zustand";

export interface TransparencyReport {
  id: string;
  period: {
    start: string;
    end: string;
    type: "monthly" | "quarterly" | "annual";
  };

  // Métriques de modération
  moderation: {
    totalReports: number;
    reportsByCategory: Record<string, number>;
    actionsCount: {
      contentRemoved: number;
      contentHidden: number;
      accountsSuspended: number;
      accountsBanned: number;
      warningsIssued: number;
    };
    averageResponseTime: number; // heures
    automatedActions: number;
    manualActions: number;
  };

  // Métriques d'appels
  appeals: {
    totalAppeals: number;
    appealsByType: Record<string, number>;
    resolved: number;
    approved: number;
    rejected: number;
    averageResolutionTime: number; // heures
  };

  // Demandes légales
  legalRequests: {
    governmentRequests: number;
    courtOrders: number;
    contentRemovedByLaw: number;
    accountsDisabledByLaw: number;
    countriesRequesting: string[];
  };

  // Demandes RGPD
  privacy: {
    dataExportRequests: number;
    dataDeletionRequests: number;
    averageProcessingTime: number; // jours
    completionRate: number; // %
  };

  // Sécurité
  security: {
    securityIncidents: number;
    dataBreaches: number;
    accountCompromises: number;
    phishingAttempts: number;
  };

  // Contenu
  content: {
    totalPosts: number;
    postsRemoved: number;
    removalReasons: Record<string, number>;
    aiDetectedContent: number;
    userReportedContent: number;
  };

  // Méta
  generatedAt: string;
  generatedBy: string;
  status: "draft" | "published" | "archived";
  publishedAt?: string;
  downloadUrl?: string;
}

interface TransparencyState {
  reports: TransparencyReport[];
  ready: boolean;

  // Génération
  generateReport: (periodType: "monthly" | "quarterly" | "annual", startDate: string, adminHandle: string) => TransparencyReport;

  // Publication
  publishReport: (reportId: string) => void;
  archiveReport: (reportId: string) => void;

  // Requêtes
  getReportById: (id: string) => TransparencyReport | undefined;
  getPublishedReports: () => TransparencyReport[];
  getLatestReport: () => TransparencyReport | undefined;

  // Export
  exportReportAsJSON: (reportId: string) => string;
  exportReportAsCSV: (reportId: string) => string;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Générer des données de démo réalistes
function generateMockData(periodType: "monthly" | "quarterly" | "annual"): Omit<TransparencyReport, "id" | "period" | "generatedAt" | "generatedBy" | "status"> {
  const multiplier = periodType === "monthly" ? 1 : periodType === "quarterly" ? 3 : 12;

  return {
    moderation: {
      totalReports: Math.floor(150 * multiplier * (0.8 + Math.random() * 0.4)),
      reportsByCategory: {
        spam: Math.floor(45 * multiplier),
        hate_speech: Math.floor(25 * multiplier),
        harassment: Math.floor(30 * multiplier),
        violence: Math.floor(15 * multiplier),
        misinformation: Math.floor(20 * multiplier),
        other: Math.floor(15 * multiplier),
      },
      actionsCount: {
        contentRemoved: Math.floor(80 * multiplier),
        contentHidden: Math.floor(40 * multiplier),
        accountsSuspended: Math.floor(15 * multiplier),
        accountsBanned: Math.floor(5 * multiplier),
        warningsIssued: Math.floor(60 * multiplier),
      },
      averageResponseTime: Math.floor(4 + Math.random() * 8),
      automatedActions: Math.floor(100 * multiplier),
      manualActions: Math.floor(50 * multiplier),
    },
    appeals: {
      totalAppeals: Math.floor(30 * multiplier),
      appealsByType: {
        post_deleted: Math.floor(15 * multiplier),
        post_hidden: Math.floor(8 * multiplier),
        account_suspended: Math.floor(5 * multiplier),
        account_banned: Math.floor(2 * multiplier),
      },
      resolved: Math.floor(28 * multiplier),
      approved: Math.floor(8 * multiplier),
      rejected: Math.floor(20 * multiplier),
      averageResolutionTime: Math.floor(24 + Math.random() * 24),
    },
    legalRequests: {
      governmentRequests: Math.floor(2 * multiplier),
      courtOrders: Math.floor(1 * multiplier),
      contentRemovedByLaw: Math.floor(3 * multiplier),
      accountsDisabledByLaw: Math.floor(1 * multiplier),
      countriesRequesting: ["France", "Allemagne", "Belgique"].slice(0, Math.floor(Math.random() * 3) + 1),
    },
    privacy: {
      dataExportRequests: Math.floor(25 * multiplier),
      dataDeletionRequests: Math.floor(10 * multiplier),
      averageProcessingTime: Math.floor(5 + Math.random() * 10),
      completionRate: Math.floor(95 + Math.random() * 5),
    },
    security: {
      securityIncidents: Math.floor(2 * multiplier),
      dataBreaches: 0,
      accountCompromises: Math.floor(5 * multiplier),
      phishingAttempts: Math.floor(15 * multiplier),
    },
    content: {
      totalPosts: Math.floor(50000 * multiplier),
      postsRemoved: Math.floor(120 * multiplier),
      removalReasons: {
        spam: Math.floor(40 * multiplier),
        hate_speech: Math.floor(20 * multiplier),
        violence: Math.floor(15 * multiplier),
        harassment: Math.floor(25 * multiplier),
        illegal: Math.floor(5 * multiplier),
        copyright: Math.floor(15 * multiplier),
      },
      aiDetectedContent: Math.floor(80 * multiplier),
      userReportedContent: Math.floor(70 * multiplier),
    },
  };
}

const STORAGE_KEY = "globehub_transparency_v1";

// Rapports de démo
const demoReports: TransparencyReport[] = [
  {
    id: "report_2024_01",
    period: {
      start: "2024-01-01T00:00:00Z",
      end: "2024-01-31T23:59:59Z",
      type: "monthly",
    },
    ...generateMockData("monthly"),
    generatedAt: "2024-02-01T10:00:00Z",
    generatedBy: "admin",
    status: "published",
    publishedAt: "2024-02-02T09:00:00Z",
    downloadUrl: "/reports/transparency_2024_01.pdf",
  },
];

export const useTransparencyStore = create<TransparencyState>((set, get) => ({
  reports: demoReports,
  ready: true,

  generateReport: (periodType, startDate, adminHandle) => {
    const start = new Date(startDate);
    let end: Date;

    switch (periodType) {
      case "monthly":
        end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
      case "quarterly":
        end = new Date(start);
        end.setMonth(end.getMonth() + 3);
        end.setDate(0);
        break;
      case "annual":
        end = new Date(start);
        end.setFullYear(end.getFullYear() + 1);
        end.setDate(0);
        break;
    }

    const report: TransparencyReport = {
      id: `report_${uid()}`,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        type: periodType,
      },
      ...generateMockData(periodType),
      generatedAt: new Date().toISOString(),
      generatedBy: adminHandle,
      status: "draft",
    };

    set({ reports: [...get().reports, report] });
    return report;
  },

  publishReport: (reportId) => {
    const { reports } = get();
    const updated = reports.map(r => {
      if (r.id !== reportId) return r;
      return {
        ...r,
        status: "published" as const,
        publishedAt: new Date().toISOString(),
        downloadUrl: `/reports/transparency_${r.id}.pdf`,
      };
    });
    set({ reports: updated });
  },

  archiveReport: (reportId) => {
    const { reports } = get();
    const updated = reports.map(r => {
      if (r.id !== reportId) return r;
      return { ...r, status: "archived" as const };
    });
    set({ reports: updated });
  },

  getReportById: (id) => {
    return get().reports.find(r => r.id === id);
  },

  getPublishedReports: () => {
    return get().reports.filter(r => r.status === "published");
  },

  getLatestReport: () => {
    const published = get().getPublishedReports();
    return published.sort((a, b) =>
      new Date(b.period.end).getTime() - new Date(a.period.end).getTime()
    )[0];
  },

  exportReportAsJSON: (reportId) => {
    const report = get().getReportById(reportId);
    if (!report) return "";
    return JSON.stringify(report, null, 2);
  },

  exportReportAsCSV: (reportId) => {
    const report = get().getReportById(reportId);
    if (!report) return "";

    const rows = [
      ["Catégorie", "Métrique", "Valeur"],
      ["Modération", "Total signalements", report.moderation.totalReports],
      ["Modération", "Contenu supprimé", report.moderation.actionsCount.contentRemoved],
      ["Modération", "Comptes suspendus", report.moderation.actionsCount.accountsSuspended],
      ["Modération", "Temps de réponse moyen (h)", report.moderation.averageResponseTime],
      ["Appels", "Total appels", report.appeals.totalAppeals],
      ["Appels", "Approuvés", report.appeals.approved],
      ["Appels", "Rejetés", report.appeals.rejected],
      ["RGPD", "Demandes export", report.privacy.dataExportRequests],
      ["RGPD", "Demandes suppression", report.privacy.dataDeletionRequests],
      ["Sécurité", "Incidents", report.security.securityIncidents],
      ["Contenu", "Total posts", report.content.totalPosts],
      ["Contenu", "Posts supprimés", report.content.postsRemoved],
    ];

    return rows.map(row => row.join(",")).join("\n");
  },
}));

export const REPORT_CATEGORY_LABELS: Record<string, string> = {
  spam: "Spam",
  hate_speech: "Discours haineux",
  harassment: "Harcèlement",
  violence: "Violence",
  misinformation: "Désinformation",
  illegal: "Contenu illégal",
  copyright: "Droit d'auteur",
  other: "Autre",
};
