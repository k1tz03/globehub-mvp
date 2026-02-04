import type { ExpressionSpecification } from "maplibre-gl";
import type { Post } from "./types";

/**
 * Color tokens for categories (kept constant to feel "brand / vector").
 * These are RGBA strings because MapLibre paint expects string colors.
 */
export const CATEGORY = {
  vibe: "rgba(217,70,239,0.55)", // fuchsia
  news: "rgba(56,189,248,0.55)", // sky
  event: "rgba(251,191,36,0.55)", // amber
  alert: "rgba(244,63,94,0.55)", // rose
} as const;

/**
 * NOTE (important):
 * MapLibre's TS types for style expressions are very strict (tuple-based).
 * If we return a plain array, TS widens it and Next build fails.
 * So we return `ExpressionSpecification` (cast) for each expression helper.
 */
export function categoryColorExpr(): ExpressionSpecification {
  return [
    "case",
    ["==", ["get", "category"], "alert"],
    CATEGORY.alert,
    ["==", ["get", "category"], "event"],
    CATEGORY.event,
    ["==", ["get", "category"], "news"],
    CATEGORY.news,
    CATEGORY.vibe,
  ] as unknown as ExpressionSpecification;
}

export function strokeColorExpr(): ExpressionSpecification {
  return [
    "case",
    ["==", ["get", "kind"], "promoted"],
    "rgba(255,180,0,0.95)",
    ["==", ["get", "followed"], true],
    "rgba(52,211,153,0.92)",
    "rgba(255,255,255,0.85)",
  ] as unknown as ExpressionSpecification;
}

// Back-compat alias (older code)
export function kindStrokeExpr(): ExpressionSpecification {
  return strokeColorExpr();
}

export function strokeWidthExpr(): ExpressionSpecification {
  return [
    "case",
    ["==", ["get", "kind"], "promoted"],
    2.8,
    ["==", ["get", "followed"], true],
    2.2,
    1.6,
  ] as unknown as ExpressionSpecification;
}

// Back-compat alias (older code)
export function kindStrokeWidthExpr(): ExpressionSpecification {
  return strokeWidthExpr();
}

export function signalOpacityExpr(): ExpressionSpecification {
  return [
    "case",
    ["==", ["get", "signal"], "strong"],
    1.0,
    ["==", ["get", "signal"], "weak"],
    0.75,
    0.55,
  ] as unknown as ExpressionSpecification;
}

export function buildTrailsGeoJSON(posts: Post[], follows: string[] = []) {
  const byHandle = new Map<string, { coords: [number, number][] }>();
  const safeFollows = follows || [];

  posts
    .filter((p) => typeof p.lon === "number" && typeof p.lat === "number")
    .sort((a, b) => new Date(a.createdAtISO).getTime() - new Date(b.createdAtISO).getTime())
    .forEach((p) => {
      const k = p.handle;
      const entry = byHandle.get(k) ?? { coords: [] };
      entry.coords.push([p.lon as number, p.lat as number]);
      // Keep last 6 points to avoid clutter
      if (entry.coords.length > 6) entry.coords.shift();
      byHandle.set(k, entry);
    });

  return {
    type: "FeatureCollection" as const,
    features: Array.from(byHandle.entries())
      .filter(([_, v]) => v.coords.length >= 2)
      .map(([handle, v]) => ({
        type: "Feature" as const,
        geometry: { type: "LineString" as const, coordinates: v.coords },
        properties: { handle, followed: safeFollows.includes(handle) },
      })),
  };
}
    
export function glowOpacityExpr(): ExpressionSpecification {
  // very subtle halo (scales better at long-term density)
  return [
    "case",
    ["==", ["get", "signal"], "strong"],
    0.18,
    ["==", ["get", "signal"], "weak"],
    0.12,
    0.08,
  ] as unknown as ExpressionSpecification;
}

export function glowRadiusExpr(): ExpressionSpecification {
  return [
    "case",
    ["==", ["get", "kind"], "promoted"],
    10,
    ["==", ["get", "followed"], true],
    9.5,
    8.5,
  ] as unknown as ExpressionSpecification;
}


export function trailsColorExpr(): ExpressionSpecification {
  // Followed trails are more visible; others stay subtle.
  return [
    "case",
    ["==", ["get", "followed"], true],
    "rgba(56,189,248,0.85)",
    "rgba(255,255,255,0.35)",
  ] as unknown as ExpressionSpecification;
}
