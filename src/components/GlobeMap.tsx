"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import maplibregl, { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { LayerToggles, Post, ProjectionMode, GroupMember } from "@/lib/types";
import {
  buildTrailsGeoJSON,
  categoryColorExpr,
  glowOpacityExpr,
  glowRadiusExpr,
  signalOpacityExpr,
  strokeColorExpr,
  strokeWidthExpr,
  trailsColorExpr,
} from "@/lib/mapStyle";

// Type pour les membres de groupe affichés sur la carte
export type GroupMemberOnMap = GroupMember & {
  groupId: string;
  groupName: string;
  avatar?: string;
  username?: string;
};

const LIGHT_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

type ThemeMode = "light" | "dark";

function postsToGeoJSON(posts: Post[], follows: string[]) {
  return {
    type: "FeatureCollection" as const,
    features: posts
      .filter((p) => typeof p.lon === "number" && typeof p.lat === "number")
      .map((p) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [p.lon as number, p.lat as number] },
        properties: {
          id: p.id,
          kind: p.kind,
          category: p.category,
          signal: p.signal,
          followed: (follows || []).includes(p.handle),
        },
      })),
  };
}

function membersToGeoJSON(members: GroupMemberOnMap[]) {
  return {
    type: "FeatureCollection" as const,
    features: members
      .filter((m) => m.shareLocation && typeof m.lon === "number" && typeof m.lat === "number")
      .map((m) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [m.lon as number, m.lat as number] },
        properties: {
          id: m.userHandle,
          handle: m.userHandle,
          username: m.username || m.userHandle,
          avatar: m.avatar || "",
          isOnline: m.isOnline ?? false,
          groupId: m.groupId,
          groupName: m.groupName,
          role: m.role,
        },
      })),
  };
}

function projectionType(mode: ProjectionMode) {
  return mode === "globe" ? "globe" : "mercator";
}

function safeSetProjection(map: MapLibreMap, mode: ProjectionMode) {
  const apply = () => {
    try {
      map.setProjection({ type: projectionType(mode) });
    } catch {
      // ignore during style swap
    }
  };

  if (map.isStyleLoaded()) apply();
  else map.once("style.load", apply);
}

function makeHeartImageData(size = 64) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";

  // Simple heart path (monochrome), works well as SDF icon
  const x = size / 2;
  const y = size / 2 + 2;
  const topCurveHeight = size * 0.23;

  ctx.beginPath();
  ctx.moveTo(x, y + topCurveHeight);
  ctx.bezierCurveTo(x, y, x - size * 0.25, y, x - size * 0.25, y + topCurveHeight);
  ctx.bezierCurveTo(x - size * 0.25, y + size * 0.45, x, y + size * 0.55, x, y + size * 0.72);
  ctx.bezierCurveTo(x, y + size * 0.55, x + size * 0.25, y + size * 0.45, x + size * 0.25, y + topCurveHeight);
  ctx.bezierCurveTo(x + size * 0.25, y, x, y, x, y + topCurveHeight);
  ctx.closePath();
  ctx.fill();

  // MapLibre types accept ImageData; avoids TS mismatch with HTMLCanvasElement
  return ctx.getImageData(0, 0, size, size);
}


export default function GlobeMap({
  theme,
  postsOnMap,
  onSelectPostId,
  onPostClick,
  focus,
  onCenterChange,
  projection,
  layers,
  follows,
  selectedPostId,
  groupMembers,
  onMemberClick,
  selectedMemberHandle,
}: {
  theme: ThemeMode;
  postsOnMap: Post[];
  onSelectPostId: (id: string) => void;
  onPostClick?: (id: string, screenPos: { x: number; y: number }) => void;
  focus: { lon: number; lat: number } | null;
  onCenterChange: (c: { lon: number; lat: number }) => void;
  projection: ProjectionMode;
  layers: LayerToggles;
  follows?: string[];
  selectedPostId?: string | null;
  groupMembers?: GroupMemberOnMap[];
  onMemberClick?: (member: GroupMemberOnMap, screenPos: { x: number; y: number }) => void;
  selectedMemberHandle?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const rafRef = useRef<number | null>(null);
  const pulseTRef = useRef<number>(0);
  const [popupScreenPos, setPopupScreenPos] = useState<{ x: number; y: number } | null>(null);

  const styleUrl = useMemo(() => (theme === "dark" ? DARK_STYLE : LIGHT_STYLE), [theme]);

  // Calculer la position écran d'un post
  const getScreenPosition = useCallback((post: Post): { x: number; y: number } | null => {
    const map = mapRef.current;
    if (!map || typeof post.lon !== "number" || typeof post.lat !== "number") return null;
    
    const point = map.project([post.lon, post.lat]);
    return { x: point.x, y: point.y };
  }, []);

  // Mettre à jour la position écran du post sélectionné lors du mouvement
  // Utilise requestAnimationFrame pour synchroniser avec le rendu de la carte
  const popupRafRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPostId) {
      setPopupScreenPos(null);
      lastPosRef.current = null;
      return;
    }

    const selectedPost = postsOnMap.find(p => p.id === selectedPostId);
    if (!selectedPost) {
      setPopupScreenPos(null);
      lastPosRef.current = null;
      return;
    }

    let isUpdating = false;

    const updatePosition = () => {
      if (isUpdating) return;
      isUpdating = true;

      // Utiliser RAF pour synchroniser avec le rendu
      popupRafRef.current = requestAnimationFrame(() => {
        const pos = getScreenPosition(selectedPost);
        if (pos) {
          // Éviter les mises à jour si la position n'a pas changé significativement
          const last = lastPosRef.current;
          if (!last || Math.abs(pos.x - last.x) > 0.5 || Math.abs(pos.y - last.y) > 0.5) {
            lastPosRef.current = pos;
            setPopupScreenPos(pos);
          }
        }
        isUpdating = false;
      });
    };

    // Position initiale
    updatePosition();

    // Écouter "render" au lieu de "move" pour une meilleure synchronisation
    map.on("render", updatePosition);

    return () => {
      map.off("render", updatePosition);
      if (popupRafRef.current) {
        cancelAnimationFrame(popupRafRef.current);
      }
    };
  }, [selectedPostId, postsOnMap, getScreenPosition]);

  const stopPulse = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const pulseActiveRef = useRef(false);
  const lastPulseUpdateRef = useRef(0);

  const startPulse = () => {
    const map = mapRef.current;
    if (!map || pulseActiveRef.current) return; // Éviter de démarrer si déjà actif
    stopPulse();
    pulseActiveRef.current = true;

    const tick = (timestamp: number) => {
      const m = mapRef.current;
      if (!m || !pulseActiveRef.current) return;

      // Throttle à ~30fps pour les animations (suffisant et plus léger)
      if (timestamp - lastPulseUpdateRef.current < 33) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastPulseUpdateRef.current = timestamp;

      pulseTRef.current += 0.033; // Ajusté pour 30fps
      const t = pulseTRef.current;

      // Subtle heart pulse (scale + opacity)
      const s = 0.34 + (Math.sin(t * 2.2) * 0.05 + 0.05); // ~0.34..0.44
      const o = 0.14 + (Math.sin(t * 2.2) * 0.06 + 0.06); // ~0.14..0.26

      try {
        const ids = ["posts-heart-1", "posts-heart-2"];
        for (const id of ids) {
          if (m.getLayer(id)) {
            m.setLayoutProperty(id, "icon-size", s);
            m.setPaintProperty(id, "icon-opacity", o);
          }
        }
      } catch {
        // ignore during style swaps
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const stopPulseComplete = () => {
    pulseActiveRef.current = false;
    stopPulse();
  };

  const ensureSourcesAndLayers = (map: MapLibreMap) => {
    if (!map.getSource("posts")) {
      map.addSource("posts", { type: "geojson", data: postsToGeoJSON(postsOnMap, follows ?? []) });
    }
    if (!map.getSource("trails")) {
      map.addSource("trails", { type: "geojson", data: buildTrailsGeoJSON(postsOnMap, follows ?? []) });
    }

    if (!map.getLayer("trails-line")) {
      map.addLayer({
        id: "trails-line",
        type: "line",
        source: "trails",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-width": 2.3, "line-color": trailsColorExpr(), "line-opacity": 0.0 },
      });
    }

    if (!map.getLayer("posts-heat")) {
      map.addLayer({
        id: "posts-heat",
        type: "heatmap",
        source: "posts",
        paint: { "heatmap-intensity": 1.0, "heatmap-radius": 26, "heatmap-opacity": 0.0 },
      });
    }

    // Heart SDF image
    if (!map.hasImage("gh-heart")) {
      map.addImage("gh-heart", makeHeartImageData(64), { sdf: true });
    }

    // Only strong signals get hearts to avoid clutter
    const heartFilter: any = ["==", ["get", "signal"], "strong"];

    if (!map.getLayer("posts-heart-1")) {
      map.addLayer({
        id: "posts-heart-1",
        type: "symbol",
        source: "posts",
        filter: heartFilter,
        layout: {
          "icon-image": "gh-heart",
          "icon-size": 0.38,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-offset": [1.6, 0.0],
        },
        paint: { "icon-color": categoryColorExpr(), "icon-opacity": 0.0 },
      });
    }

    if (!map.getLayer("posts-heart-2")) {
      map.addLayer({
        id: "posts-heart-2",
        type: "symbol",
        source: "posts",
        filter: heartFilter,
        layout: {
          "icon-image": "gh-heart",
          "icon-size": 0.38,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-offset": [-1.2, 1.2],
        },
        paint: { "icon-color": categoryColorExpr(), "icon-opacity": 0.0 },
      });
    }

    // Discreet halo (scales better)
    if (!map.getLayer("posts-glow")) {
      map.addLayer({
        id: "posts-glow",
        type: "circle",
        source: "posts",
        paint: {
          "circle-radius": glowRadiusExpr(),
          "circle-color": [
            "case",
            ["==", ["get", "kind"], "promoted"],
            "rgba(255,180,0,0.10)",
            ["==", ["get", "followed"], true],
            "rgba(56,189,248,0.08)",
            "rgba(255,255,255,0.06)",
          ],
          "circle-blur": 0.75,
          "circle-opacity": glowOpacityExpr(),
        },
      });
    }

    if (!map.getLayer("posts-dots")) {
      map.addLayer({
        id: "posts-dots",
        type: "circle",
        source: "posts",
        paint: {
          "circle-radius": ["case", ["==", ["get", "kind"], "promoted"], 6.8, ["==", ["get", "followed"], true], 6.6, 6.0],
          "circle-stroke-width": strokeWidthExpr(),
          "circle-stroke-color": strokeColorExpr(),
          "circle-color": categoryColorExpr(),
          "circle-opacity": signalOpacityExpr(),
        },
      });
    }

    // === GROUP MEMBERS LAYERS ===
    if (!map.getSource("group-members")) {
      map.addSource("group-members", { type: "geojson", data: membersToGeoJSON(groupMembers ?? []) });
    }

    // Member outer glow (pulsing for online members)
    if (!map.getLayer("members-glow")) {
      map.addLayer({
        id: "members-glow",
        type: "circle",
        source: "group-members",
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "isOnline"], true],
            18,
            14
          ],
          "circle-color": [
            "case",
            ["==", ["get", "isOnline"], true],
            "rgba(16, 185, 129, 0.25)", // emerald for online
            "rgba(163, 163, 163, 0.15)" // gray for offline
          ],
          "circle-blur": 0.6,
          "circle-opacity": 0.8,
        },
      });
    }

    // Member main circle (avatar placeholder)
    if (!map.getLayer("members-circle")) {
      map.addLayer({
        id: "members-circle",
        type: "circle",
        source: "group-members",
        paint: {
          "circle-radius": 12,
          "circle-color": [
            "case",
            ["==", ["get", "role"], "owner"],
            "rgba(217, 70, 239, 0.9)", // fuchsia for owner
            ["==", ["get", "role"], "admin"],
            "rgba(251, 191, 36, 0.9)", // amber for admin
            ["==", ["get", "role"], "moderator"],
            "rgba(56, 189, 248, 0.9)", // sky for moderator
            "rgba(168, 85, 247, 0.85)" // purple for members
          ],
          "circle-stroke-width": 3,
          "circle-stroke-color": [
            "case",
            ["==", ["get", "isOnline"], true],
            "#10b981", // emerald border for online
            "#ffffff"
          ],
          "circle-opacity": 1.0,
        },
      });
    }

    // Member label (username)
    if (!map.getLayer("members-label")) {
      map.addLayer({
        id: "members-label",
        type: "symbol",
        source: "group-members",
        layout: {
          "text-field": ["get", "username"],
          "text-size": 11,
          "text-offset": [0, 1.8],
          "text-anchor": "top",
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
        paint: {
          "text-color": "#374151",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
          "text-opacity": 0.95,
        },
      });
    }

    // Online status indicator dot
    if (!map.getLayer("members-online-dot")) {
      map.addLayer({
        id: "members-online-dot",
        type: "circle",
        source: "group-members",
        filter: ["==", ["get", "isOnline"], true],
        paint: {
          "circle-radius": 5,
          "circle-color": "#10b981",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-translate": [8, -8], // Position en haut à droite
        },
      });
    }

    // click/hover
    const onClickDots = (e: any) => {
      const f = e.features?.[0];
      const id = (f?.properties as any)?.id as string | undefined;
      if (id) {
        onSelectPostId(id);
        // Appeler onPostClick avec la position écran si disponible
        if (onPostClick && e.point) {
          onPostClick(id, { x: e.point.x, y: e.point.y });
        }
      }
    };
    const onEnter = () => (map.getCanvas().style.cursor = "pointer");
    const onLeave = () => (map.getCanvas().style.cursor = "");

    map.off("click", "posts-dots", onClickDots);
    map.on("click", "posts-dots", onClickDots);
    map.off("mouseenter", "posts-dots", onEnter);
    map.off("mouseleave", "posts-dots", onLeave);
    map.on("mouseenter", "posts-dots", onEnter);
    map.on("mouseleave", "posts-dots", onLeave);

    // Member click/hover handlers
    const onClickMember = (e: any) => {
      const f = e.features?.[0];
      const props = f?.properties as any;
      if (props?.handle && onMemberClick) {
        const member: GroupMemberOnMap = {
          userId: props.handle,
          userHandle: props.handle,
          username: props.username,
          avatar: props.avatar,
          isOnline: props.isOnline,
          role: props.role,
          groupId: props.groupId,
          groupName: props.groupName,
          joinedAt: "",
          shareLocation: true,
          lat: f?.geometry?.coordinates?.[1],
          lon: f?.geometry?.coordinates?.[0],
        };
        onMemberClick(member, { x: e.point.x, y: e.point.y });
      }
    };

    // Bind member events
    map.off("click", "members-circle", onClickMember);
    map.on("click", "members-circle", onClickMember);
    map.off("mouseenter", "members-circle", onEnter);
    map.off("mouseleave", "members-circle", onLeave);
    map.on("mouseenter", "members-circle", onEnter);
    map.on("mouseleave", "members-circle", onLeave);

    // toggles
    map.setPaintProperty("trails-line", "line-opacity", layers.trails ? 0.9 : 0.0);
    map.setPaintProperty("posts-heat", "heatmap-opacity", layers.heat ? 0.55 : 0.0);

    if (layers.pulse) startPulse();
    else {
      stopPulseComplete();
      try {
        if (map.getLayer("posts-heart-1")) map.setPaintProperty("posts-heart-1", "icon-opacity", 0.0);
        if (map.getLayer("posts-heart-2")) map.setPaintProperty("posts-heart-2", "icon-opacity", 0.0);
      } catch {}
    }
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: styleUrl,
        center: [8, 30],
        zoom: 1.35,
      });

      map.on("error", (e) => {
        console.error("MapLibre error:", e);
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-left");

      map.on("load", () => {
        safeSetProjection(map, projection);

        const c = map.getCenter();
        onCenterChange({ lon: c.lng, lat: c.lat });

        ensureSourcesAndLayers(map);

        map.on("moveend", () => {
          const cc = map.getCenter();
          onCenterChange({ lon: cc.lng, lat: cc.lat });
        });
      });

      mapRef.current = map;
    } catch (err) {
      console.error("Failed to initialize map:", err);
    }

    return () => {
      stopPulseComplete();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme swap
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    (map as any).setStyle(styleUrl, { diff: false });

    const rebuild = () => {
      safeSetProjection(map, projection);
      ensureSourcesAndLayers(map);
      const src = map.getSource("posts") as GeoJSONSource | undefined;
      if (src) src.setData(postsToGeoJSON(postsOnMap, follows ?? []));
      const tr = map.getSource("trails") as GeoJSONSource | undefined;
      if (tr) tr.setData(buildTrailsGeoJSON(postsOnMap, follows ?? []));
      const memSrc = map.getSource("group-members") as GeoJSONSource | undefined;
      if (memSrc) memSrc.setData(membersToGeoJSON(groupMembers ?? []));
    };

    map.once("style.load", rebuild);
    return () => {
      map.off("style.load", rebuild);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    safeSetProjection(map, projection);
  }, [projection]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    try {
      if (map.getLayer("trails-line")) map.setPaintProperty("trails-line", "line-opacity", layers.trails ? 0.9 : 0.0);
      if (map.getLayer("posts-heat")) map.setPaintProperty("posts-heat", "heatmap-opacity", layers.heat ? 0.55 : 0.0);
    } catch {}

    if (layers.pulse) startPulse();
    else {
      stopPulseComplete();
      try {
        if (map.getLayer("posts-heart-1")) map.setPaintProperty("posts-heart-1", "icon-opacity", 0.0);
        if (map.getLayer("posts-heart-2")) map.setPaintProperty("posts-heart-2", "icon-opacity", 0.0);
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers.pulse, layers.heat, layers.trails]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource("posts") as GeoJSONSource | undefined;
    if (src) src.setData(postsToGeoJSON(postsOnMap, follows ?? []));
    const tr = map.getSource("trails") as GeoJSONSource | undefined;
    if (tr) tr.setData(buildTrailsGeoJSON(postsOnMap, follows ?? []));
  }, [postsOnMap, follows]);

  // Update group members on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const memSrc = map.getSource("group-members") as GeoJSONSource | undefined;
    if (memSrc) {
      memSrc.setData(membersToGeoJSON(groupMembers ?? []));
    }
  }, [groupMembers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    
    // Animation fluide avec zoom progressif
    const currentZoom = map.getZoom();
    const targetZoom = Math.max(currentZoom, 4);
    
    map.flyTo({ 
      center: [focus.lon, focus.lat], 
      zoom: targetZoom,
      duration: 1500,
      essential: true,
      curve: 1.42, // Courbe d'animation (1.42 est la valeur par défaut)
      easing: (t: number) => {
        // Easing ease-out cubic pour une animation plus naturelle
        return 1 - Math.pow(1 - t, 3);
      }
    });
  }, [focus]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full z-[1]" />;
}
