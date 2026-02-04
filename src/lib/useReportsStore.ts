"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { Report, ReportReason, ReportCategory } from "./types";

const REPORTS_KEY = "globehub_reports_v1";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function safeParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

// Signalements de démo
const demoReports: Report[] = [
  {
    id: "rep_001",
    category: "post",
    targetId: "post_003",
    reporterId: "user_camille",
    reporterHandle: "camille",
    reason: "spam",
    details: "Ce post semble être du spam promotionnel",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "pending",
  },
  {
    id: "rep_002",
    category: "post",
    targetId: "post_005",
    reporterId: "user_emma",
    reporterHandle: "emma",
    reason: "misinformation",
    details: "Information factuelle incorrecte",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: "reviewed",
    reviewedBy: "admin",
    reviewedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    actionTaken: "Post marqué comme potentiellement trompeur",
  },
  {
    id: "rep_003",
    category: "user",
    targetId: "user_spam123",
    reporterId: "user_noah",
    reporterHandle: "noah",
    reason: "harassment",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "actioned",
    reviewedBy: "admin",
    reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    actionTaken: "Compte suspendu pour 7 jours",
  },
];

export function useReportsStore() {
  const [reports, setReports] = useState<Report[]>([]);
  const [ready, setReady] = useState(false);

  // Charger les données
  useEffect(() => {
    const savedReports = safeParse<Report[]>(localStorage.getItem(REPORTS_KEY));
    if (savedReports && savedReports.length > 0) {
      setReports(savedReports);
    } else {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(demoReports));
      setReports(demoReports);
    }
    setReady(true);
  }, []);

  // Sauvegarder
  const saveReports = useCallback((newReports: Report[]) => {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(newReports));
    setReports(newReports);
  }, []);

  // Créer un signalement
  const createReport = useCallback((
    report: Omit<Report, "id" | "createdAt" | "status">
  ): Report => {
    const newReport: Report = {
      ...report,
      id: `rep_${uid()}`,
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    saveReports([newReport, ...reports]);
    return newReport;
  }, [reports, saveReports]);

  // Mettre à jour un signalement
  const updateReport = useCallback((id: string, updates: Partial<Report>) => {
    saveReports(reports.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, [reports, saveReports]);

  // Reviewer un signalement
  const reviewReport = useCallback((
    id: string, 
    reviewerHandle: string, 
    status: "reviewed" | "dismissed" | "actioned",
    actionTaken?: string
  ) => {
    saveReports(reports.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          status,
          reviewedBy: reviewerHandle,
          reviewedAt: new Date().toISOString(),
          actionTaken,
        };
      }
      return r;
    }));
  }, [reports, saveReports]);

  // Supprimer un signalement
  const deleteReport = useCallback((id: string) => {
    saveReports(reports.filter((r) => r.id !== id));
  }, [reports, saveReports]);

  // Signalements en attente
  const pendingReports = useMemo(() => {
    return reports.filter((r) => r.status === "pending");
  }, [reports]);

  // Signalements par catégorie
  const reportsByCategory = useMemo(() => {
    return {
      post: reports.filter((r) => r.category === "post"),
      user: reports.filter((r) => r.category === "user"),
      message: reports.filter((r) => r.category === "message"),
      comment: reports.filter((r) => r.category === "comment"),
    };
  }, [reports]);

  // Statistiques
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayReports = reports.filter((r) => r.createdAt.startsWith(today));
    
    return {
      total: reports.length,
      pending: pendingReports.length,
      reviewed: reports.filter((r) => r.status === "reviewed").length,
      actioned: reports.filter((r) => r.status === "actioned").length,
      dismissed: reports.filter((r) => r.status === "dismissed").length,
      todayCount: todayReports.length,
    };
  }, [reports, pendingReports]);

  return {
    reports,
    pendingReports,
    reportsByCategory,
    stats,
    ready,
    createReport,
    updateReport,
    reviewReport,
    deleteReport,
  };
}
