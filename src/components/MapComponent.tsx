import { useEffect, useRef, useState } from 'react';
import MapLibreGL from 'maplibre-gl';
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MapRoute,
  useMap,
} from '@/components/ui/map';
import { useAppStore } from '@/store/index';
import { useTranslation } from '@/i18n/useTranslation';
import { MapStyleSwitcher } from '@/components/MapStyleSwitcher';
import { polygonCenter } from '@/utils/convexHull';

const SATELLITE_STYLE: MapLibreGL.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles © Esri',
    },
  },
  layers: [
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'satellite',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// ── Inner: GeoJSON layers + map events ───────────────────────────────────────

interface MapLayersProps {
  onMapClick: (lat: number, lng: number) => void;
  onNodeClick: (id: string) => void;
  onNodeDrag: (id: string, lat: number, lng: number) => void;
  onAreaClick: (lineId: string) => void;
  isSelectingMode: boolean;
  isEditingNodes: boolean;
  isZoneDrawing: boolean;
}

function MapLayers({ onMapClick, onNodeClick, onNodeDrag, onAreaClick, isSelectingMode, isEditingNodes, isZoneDrawing }: MapLayersProps) {
  const { map, isLoaded } = useMap();
  const deploymentLines = useAppStore((s) => s.deploymentLines);
  const espNodes = useAppStore((s) => s.espNodes);
  const detections = useAppStore((s) => s.detections);

  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const onNodeClickRef = useRef(onNodeClick);
  onNodeClickRef.current = onNodeClick;
  const onNodeDragRef = useRef(onNodeDrag);
  onNodeDragRef.current = onNodeDrag;
  const onAreaClickRef = useRef(onAreaClick);
  onAreaClickRef.current = onAreaClick;
  const isSelectingRef = useRef(isSelectingMode);
  isSelectingRef.current = isSelectingMode;
  const isEditingRef = useRef(isEditingNodes);
  isEditingRef.current = isEditingNodes;
  const isZoneDrawingRef = useRef(isZoneDrawing);
  isZoneDrawingRef.current = isZoneDrawing;

  const protectedZones = useAppStore((s) => s.protectedZones);

  const draggingRef = useRef<{ id: string; moved: boolean } | null>(null);

  // Initialize sources and layers
  useEffect(() => {
    if (!map || !isLoaded) return;

    const emptyFC = (): GeoJSON.FeatureCollection => ({
      type: 'FeatureCollection',
      features: [],
    });

  map.addSource('deployment-lines', { type: 'geojson', data: emptyFC() });
  map.addSource('deployment-areas', { type: 'geojson', data: emptyFC() });
  map.addSource('area-labels', { type: 'geojson', data: emptyFC() });
  map.addSource('sensor-nodes', { type: 'geojson', data: emptyFC() });
  map.addSource('detections', { type: 'geojson', data: emptyFC() });
  map.addSource('protected-zones', { type: 'geojson', data: emptyFC() });

    // Deployment areas — cyan filled
    map.addLayer({
      id: 'deployment-areas-layer',
      type: 'fill',
      source: 'deployment-areas',
      paint: {
        'fill-color': '#00d4ff',
        'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.18, 0.1],
      },
    });

    // Area labels
    map.addLayer({
      id: 'area-labels-layer',
      type: 'symbol',
      source: 'area-labels',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans'],
        'text-size': 12,
        'text-anchor': 'center',
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#00d4ff',
        'text-halo-color': '#050c14',
        'text-halo-width': 1.5,
      },
    });

    // Deployment lines — cyan dashed
    map.addLayer({
      id: 'deployment-lines-layer',
      type: 'line',
      source: 'deployment-lines',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#00d4ff',
        'line-width': 2,
        'line-opacity': 0.7,
        'line-dasharray': [6, 3],
      },
    });

    // Sensor nodes — cyan dots
    map.addLayer({
      id: 'sensor-nodes-layer',
      type: 'circle',
      source: 'sensor-nodes',
      paint: {
        'circle-radius': ['case', ['boolean', ['feature-state', 'hover'], false], 6, 4],
        'circle-color': '#00d4ff',
        'circle-stroke-color': '#050c14',
        'circle-stroke-width': 1.5,
        'circle-opacity': 0.9,
      },
    });

    // Detection outer glow ring
    map.addLayer({
      id: 'detections-glow',
      type: 'circle',
      source: 'detections',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'intensity'],
          60, 20,
          100, 30,
        ],
        'circle-color': '#f59e0b',
        'circle-opacity': 0.12,
      },
    });

    // Detection inner circle
    map.addLayer({
      id: 'detections-inner',
      type: 'circle',
      source: 'detections',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'intensity'],
          60, 8,
          100, 13,
        ],
        'circle-color': '#f59e0b',
        'circle-stroke-color': '#f59e0b',
        'circle-stroke-width': 1,
        'circle-opacity': 0.75,
      },
    });

    // Protected zone fill
    map.addLayer({
      id: 'protected-zones-fill',
      type: 'fill',
      source: 'protected-zones',
      paint: {
        'fill-color': '#22c55e',
        'fill-opacity': 0.07,
      },
    });

    // Protected zone outline
    map.addLayer({
      id: 'protected-zones-outline',
      type: 'line',
      source: 'protected-zones',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#22c55e',
        'line-width': 2.5,
        'line-opacity': 0.85,
        'line-dasharray': [6, 3],
      },
    });

  const handleClick = (e: MapLibreGL.MapMouseEvent) => {
    if (draggingRef.current) return;
    if (isEditingRef.current) {
      const features = map.queryRenderedFeatures(e.point, { layers: ['sensor-nodes-layer'] });
      if (features.length > 0) {
        const id = features[0].properties?.id;
        if (id) onNodeClickRef.current(id);
        return;
      }
    }

    if (!isSelectingRef.current && !isEditingRef.current) {
      const areaFeatures = map.queryRenderedFeatures(e.point, { layers: ['deployment-areas-layer'] });
      if (areaFeatures.length > 0) {
        const id = areaFeatures[0].properties?.id;
        if (id) {
          onAreaClickRef.current(id);
          return;
        }
      }
    }

    if (!isSelectingRef.current && !isEditingRef.current && !isZoneDrawingRef.current) return;

    onMapClickRef.current(e.lngLat.lat, e.lngLat.lng);
  };

  let hoveredNodeId: string | null = null;
  let hoveredAreaId: string | null = null;
  const handleMouseMove = (e: MapLibreGL.MapMouseEvent) => {
    if (draggingRef.current) {
      draggingRef.current.moved = true;
      onNodeDragRef.current(draggingRef.current.id, e.lngLat.lat, e.lngLat.lng);
      return;
    }
    if (isEditingRef.current) {
      const features = map.queryRenderedFeatures(e.point, { layers: ['sensor-nodes-layer'] });
      if (features.length > 0) {
        map.getCanvas().style.cursor = 'grab';
        if (hoveredNodeId !== features[0].id) {
          if (hoveredNodeId) {
            map.setFeatureState({ source: 'sensor-nodes', id: hoveredNodeId }, { hover: false });
          }
          hoveredNodeId = features[0].id as string;
          map.setFeatureState({ source: 'sensor-nodes', id: hoveredNodeId }, { hover: true });
        }
      } else {
        map.getCanvas().style.cursor = 'crosshair';
        if (hoveredNodeId) {
          map.setFeatureState({ source: 'sensor-nodes', id: hoveredNodeId }, { hover: false });
          hoveredNodeId = null;
        }
      }
      return;
    }
    if (!isSelectingRef.current) {
      const areaFeatures = map.queryRenderedFeatures(e.point, { layers: ['deployment-areas-layer'] });
      if (areaFeatures.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        const areaId = areaFeatures[0].properties?.id as string;
        if (hoveredAreaId !== areaId) {
          if (hoveredAreaId) {
            map.setFeatureState({ source: 'deployment-areas', id: hoveredAreaId }, { hover: false });
          }
          hoveredAreaId = areaId;
          map.setFeatureState({ source: 'deployment-areas', id: hoveredAreaId }, { hover: true });
        }
      } else {
        map.getCanvas().style.cursor = '';
        if (hoveredAreaId) {
          map.setFeatureState({ source: 'deployment-areas', id: hoveredAreaId }, { hover: false });
          hoveredAreaId = null;
        }
      }
    }
  };

  const handleMouseDown = (e: MapLibreGL.MapMouseEvent) => {
    if (!isEditingRef.current) return;
    const features = map.queryRenderedFeatures(e.point, { layers: ['sensor-nodes-layer'] });
    if (features.length > 0) {
      e.preventDefault();
      const id = features[0].properties?.id;
      if (id) {
        draggingRef.current = { id, moved: false };
        map.getCanvas().style.cursor = 'grabbing';
        map.dragPan.disable();
      }
    }
  };

  const handleMouseUp = (e: MapLibreGL.MapMouseEvent) => {
    if (!draggingRef.current) return;
    const drag = draggingRef.current;
    if (drag.moved) {
      onNodeDragRef.current(drag.id, e.lngLat.lat, e.lngLat.lng);
    }
    draggingRef.current = null;
    map.getCanvas().style.cursor = isEditingRef.current ? 'crosshair' : '';
    map.dragPan.enable();
  };

  map.on('click', handleClick);
  map.on('mousemove', handleMouseMove);
  map.on('mousedown', handleMouseDown);
  map.on('mouseup', handleMouseUp);

  return () => {
    map.off('click', handleClick);
    map.off('mousemove', handleMouseMove);
    map.off('mousedown', handleMouseDown);
    map.off('mouseup', handleMouseUp);
    ['detections-inner', 'detections-glow', 'sensor-nodes-layer', 'area-labels-layer', 'deployment-lines-layer', 'deployment-areas-layer', 'protected-zones-outline', 'protected-zones-fill'].forEach(
      (id) => { try { if (map.getLayer(id)) map.removeLayer(id); } catch { /* ignore */ } }
    );
    ['detections', 'sensor-nodes', 'area-labels', 'deployment-lines', 'deployment-areas', 'protected-zones'].forEach(
      (id) => { try { if (map.getSource(id)) map.removeSource(id); } catch { /* ignore */ } }
    );
    };
  }, [map, isLoaded]);

  // Update deployment lines and areas
  useEffect(() => {
    if (!map || !isLoaded) return;

    // Lines
    const linesSrc = map.getSource('deployment-lines') as MapLibreGL.GeoJSONSource;
    linesSrc?.setData({
      type: 'FeatureCollection',
      features: deploymentLines.map((l) => ({
        type: 'Feature',
        properties: { id: l.id },
        geometry: {
          type: 'LineString',
          coordinates: l.points.length > 2
          ? [...l.points.map(p => [p.lng, p.lat]), [l.points[0].lng, l.points[0].lat]] // Close the loop visually
          : l.points.map(p => [p.lng, p.lat]),
        },
      })),
    });

    // Areas
    const areasSrc = map.getSource('deployment-areas') as MapLibreGL.GeoJSONSource;
    areasSrc?.setData({
      type: 'FeatureCollection',
      features: deploymentLines.filter(l => l.points.length > 2).map((l) => ({
        type: 'Feature',
        id: l.id,
        properties: { id: l.id, name: l.name || l.id },
        geometry: {
          type: 'Polygon',
          coordinates: [[...l.points.map(p => [p.lng, p.lat]), [l.points[0].lng, l.points[0].lat]]],
        },
      })),
    });

  }, [map, isLoaded, deploymentLines]);

  // Update area labels
  useEffect(() => {
    if (!map || !isLoaded) return;
    const src = map.getSource('area-labels') as MapLibreGL.GeoJSONSource;
    if (!src) return;
    src.setData({
      type: 'FeatureCollection',
      features: deploymentLines
        .filter((l) => l.points.length >= 3)
        .map((l) => {
          const centroid = polygonCenter(l.points);
          return {
            type: 'Feature' as const,
            properties: { id: l.id, name: l.name || l.id },
            geometry: {
              type: 'Point' as const,
              coordinates: [centroid.lng, centroid.lat],
            },
          };
        }),
    });
  }, [map, isLoaded, deploymentLines]);

  // Update sensor nodes
  useEffect(() => {
    if (!map || !isLoaded) return;
    const src = map.getSource('sensor-nodes') as MapLibreGL.GeoJSONSource;
    src?.setData({
      type: 'FeatureCollection',
      features: espNodes.map((n) => ({
        type: 'Feature',
        id: n.id, // required for feature state
        properties: { id: n.id },
        geometry: { type: 'Point', coordinates: [n.longitude, n.latitude] },
      })),
    });
  }, [map, isLoaded, espNodes]);

  // Update detections
  useEffect(() => {
    if (!map || !isLoaded) return;
    const currentNodes = useAppStore.getState().espNodes;
    const src = map.getSource('detections') as MapLibreGL.GeoJSONSource;
    src?.setData({
      type: 'FeatureCollection',
      features: detections
        .map((d) => {
          const node = currentNodes.find((n) => n.id === d.lineId);
          if (!node) return null;
          return {
            type: 'Feature' as const,
            properties: { intensity: d.intensity },
            geometry: {
              type: 'Point' as const,
              coordinates: [node.longitude, node.latitude],
            },
          };
        })
        .filter((f): f is NonNullable<typeof f> => f !== null),
    });
  }, [map, isLoaded, detections]);

  // Update protected zones
  useEffect(() => {
    if (!map || !isLoaded) return;
    const src = map.getSource('protected-zones') as MapLibreGL.GeoJSONSource;
    if (!src) return;
    src.setData({
      type: 'FeatureCollection',
      features: protectedZones
        .filter((z) => z.points.length >= 3)
        .map((z) => ({
          type: 'Feature' as const,
          id: z.id,
          properties: { id: z.id, name: z.name },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[...z.points.map((p) => [p.lng, p.lat]), [z.points[0].lng, z.points[0].lat]]],
          },
        })),
    });
  }, [map, isLoaded, protectedZones]);

  return null;
}

// ── Inner: cursor controller ─────────────────────────────────────────────────

function CursorController({ crosshair }: { crosshair: boolean }) {
  const { map } = useMap();
  useEffect(() => {
    if (!map) return;
    map.getCanvas().style.cursor = crosshair ? 'crosshair' : '';
  }, [map, crosshair]);
  return null;
}

// ── Search bar ───────────────────────────────────────────────────────────────

type SearchResult = { name: string; lat: number; lon: number };

interface SearchBarProps {
  onLocationSelect: (lat: number, lon: number) => void;
  t: ReturnType<typeof useTranslation>;
}

function SearchBar({ onLocationSelect, t }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [show, setShow] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const search = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); setShow(false); return; }
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=pl&limit=10`,
          { signal: ctrl.signal }
        );
        const data = await res.json();
        const unique = data
          .filter((item: SearchResult, idx: number, arr: SearchResult[]) =>
            idx === arr.findIndex(
              (x) =>
                Math.abs(parseFloat(String(x.lat)) - parseFloat(String(item.lat))) < 0.0001 &&
                Math.abs(parseFloat(String(x.lon)) - parseFloat(String(item.lon))) < 0.0001
            )
          )
          .slice(0, 5);
        setResults(unique);
        setShow(true);
        setSelectedIdx(0);
      } catch (e) {
        if ((e as Error)?.name !== 'AbortError') setResults([]);
      }
    }, 500);
  };

  const select = (r: SearchResult) => {
    onLocationSelect(Number(r.lat), Number(r.lon));
    setQuery('');
    setResults([]);
    setShow(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!show || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => (i + 1) % results.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => (i - 1 + results.length) % results.length); }
    if (e.key === 'Enter') { e.preventDefault(); if (results[selectedIdx]) select(results[selectedIdx]); }
    if (e.key === 'Escape') { e.preventDefault(); setShow(false); }
  };

  return (
    <div className="w-72">
      <div className="relative flex items-center bg-card/85 backdrop-blur-md border border-border rounded-lg px-3 py-2 shadow-xl shadow-black/30 gap-2">
        <svg className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" strokeWidth="2" />
          <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder={t.map.searchPlaceholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
          onKeyDown={onKeyDown}
          onFocus={() => results.length > 0 && setShow(true)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground font-mono text-foreground"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setShow(false); }}
            className="text-muted-foreground hover:text-foreground transition-colors text-base leading-none"
          >
            ×
          </button>
        )}
      </div>

      {show && results.length > 0 && (
        <div className="mt-1 bg-card/90 backdrop-blur-md border border-border rounded-lg overflow-hidden shadow-xl shadow-black/40">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => select(r)}
              className={`w-full px-3 py-2 text-left text-xs transition-colors border-b border-border/50 last:border-b-0 ${
                i === selectedIdx ? 'bg-accent/10 text-accent' : 'hover:bg-muted/50 text-foreground'
              }`}
            >
              <div className="truncate font-medium">{r.name}</div>
              <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                {Number(r.lat).toFixed(4)}°  {Number(r.lon).toFixed(4)}°
              </div>
            </button>
          ))}
          <div className="px-3 py-1 text-[9px] font-mono text-muted-foreground bg-muted/20 border-t border-border/50 tracking-wider">
            ↑↓ NAVIGATE · ENTER SELECT · ESC CLOSE
          </div>
        </div>
      )}

      {show && results.length === 0 && query.length >= 2 && (
        <div className="mt-1 bg-card/90 backdrop-blur-md border border-border rounded-lg p-3 shadow-xl shadow-black/40">
          <p className="text-xs font-mono text-muted-foreground text-center tracking-wider">{t.map.noResults.toUpperCase()}</p>
        </div>
      )}
    </div>
  );
}

// ── Route planning stepper (map overlay) ────────────────────────────────────

interface RoutePlannerProps {
  missionPoints: Array< [number, number]>;
  onDone: () => void;
  onClose: () => void;
  onRemoveLastPoint: () => void;
  t: ReturnType<typeof useTranslation>;
}

function RoutePlannerPanel({
  missionPoints,
  onDone,
  onClose,
  onRemoveLastPoint,
  t,
}: RoutePlannerProps) {
  
  let distM = 0;
  if (missionPoints.length > 1) {
    for (let i = 1; i < missionPoints.length; i++) {
      distM += Math.sqrt(
        Math.pow(missionPoints[i][0] - missionPoints[i-1][0], 2) +
        Math.pow(missionPoints[i][1] - missionPoints[i-1][1], 2)
      ) * 111000;
    }
  }

  return (
    <div className="bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-2xl shadow-black/50 p-4 w-72">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-accent tracking-widest uppercase">
            {t.map.planRoute}
          </span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">
          ×
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="min-w-0 w-full">
            <div className="text-xs font-medium text-foreground mb-2">{missionPoints.length === 0 ? t.map.selectStart : t.map.addPoint}</div>
            
            <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
              {missionPoints.map((pt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {pt[0].toFixed(4)}° {pt[1].toFixed(4)}°
                  </span>
                </div>
              ))}
            </div>

            <div className="font-mono text-[10px] text-accent animate-pulse mt-2">
              {t.map.clickOnMap}
            </div>
          </div>
        </div>
      </div>

      {distM > 0 && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{t.map.distance}</span>
          <span className="font-mono text-sm font-semibold text-accent tabular-nums">{Math.round(distM).toLocaleString()} m</span>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={onRemoveLastPoint}
          disabled={missionPoints.length === 0}
          className="flex-1 px-3 py-1.5 text-xs font-mono tracking-wider uppercase border border-border rounded hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {t.map.removePoint}
        </button>
        <button
          onClick={onDone}
          disabled={missionPoints.length < 2}
          className="flex-1 px-3 py-1.5 text-xs font-mono tracking-wider uppercase bg-accent text-accent-foreground rounded hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {t.map.done}
        </button>
      </div>
    </div>
  );
}

// ── Node Editor Overlay ──────────────────────────────────────────────────────

function NodeEditorPanel({
  onDone,
  t,
}: {
  onDone: () => void;
  t: ReturnType<typeof useTranslation>;
}) {
  const editingLineId = useAppStore((s) => s.editingLineId);
  const espNodes = useAppStore((s) => s.espNodes);
  const updateEspNode = useAppStore((s) => s.updateEspNode);

  const lineNodes = espNodes.filter((n) => n.lineId === editingLineId);

  return (
    <div className="bg-card/90 backdrop-blur-md border border-accent rounded-xl shadow-2xl shadow-accent/20 p-4 w-80 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] text-accent tracking-widest uppercase">{t.map.editSensors}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {t.map.editSensorsHint}
      </p>

      <div className="space-y-1.5 mb-4">
        {lineNodes.map((node) => (
          <div key={node.id} className="flex items-center gap-2">
            <input
              type="text"
              value={node.name || node.id}
              onChange={(e) => updateEspNode(node.id, { name: e.target.value })}
              className="flex-1 text-[10px] font-mono bg-background border border-border rounded px-2 py-1 text-foreground outline-none focus:border-accent"
            />
          </div>
        ))}
        {lineNodes.length === 0 && (
          <p className="text-[10px] text-muted-foreground italic">Brak czujników do edycji.</p>
        )}
      </div>

      <button
        onClick={onDone}
        className="w-full px-3 py-1.5 text-xs font-mono tracking-wider uppercase bg-accent text-accent-foreground rounded hover:bg-accent/90 transition-colors font-semibold"
      >
        {t.map.done}
      </button>
    </div>
  );
}

// ── Route summary (after planning, not in selection mode) ────────────────────

interface RouteSummaryProps {
  missionPoints: Array<[number, number]>;
  onEdit: () => void;
  onRemove: () => void;
  t: ReturnType<typeof useTranslation>;
}

function RouteSummary({ missionPoints, onEdit, onRemove, t }: RouteSummaryProps) {
  let distM = 0;
  if (missionPoints.length > 1) {
    for (let i = 1; i < missionPoints.length; i++) {
      distM += Math.sqrt(
        Math.pow(missionPoints[i][0] - missionPoints[i-1][0], 2) +
        Math.pow(missionPoints[i][1] - missionPoints[i-1][1], 2)
      ) * 111000;
    }
  }

  return (
    <div className="bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-2xl shadow-black/50 p-4 w-72">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] text-accent tracking-widest uppercase">{t.map.plannedRoute}</span>
        <button onClick={onRemove} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">
          ×
        </button>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">
            {missionPoints.length} punktów
          </span>
        </div>
      </div>
      {distM > 0 && (
        <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{t.map.distance}</span>
          <span className="font-mono text-sm font-semibold text-accent tabular-nums">{Math.round(distM).toLocaleString()} m</span>
        </div>
      )}
      <button
        onClick={onEdit}
        className="mt-3 w-full px-3 py-1.5 text-xs font-mono tracking-wider uppercase bg-accent text-accent-foreground rounded hover:bg-accent/90 transition-colors font-semibold"
      >
        {t.map.editRoute}
      </button>
    </div>
  );
}

// ── Zone drawing overlay panel ────────────────────────────────────────────────

function ZonePlannerPanel({
  zonePoints,
  onDone,
  onClose,
  onUndo,
}: {
  zonePoints: Array<[number, number]>;
  onDone: () => void;
  onClose: () => void;
  onUndo: () => void;
}) {
  let perimeterM = 0;
  if (zonePoints.length > 1) {
    const closed = [...zonePoints, zonePoints[0]];
    for (let i = 1; i < closed.length; i++) {
      perimeterM += Math.sqrt(
        Math.pow(closed[i][0] - closed[i - 1][0], 2) +
        Math.pow(closed[i][1] - closed[i - 1][1], 2)
      ) * 111000;
    }
  }

  return (
    <div className="bg-card/90 backdrop-blur-md border border-emerald-600/50 rounded-xl shadow-2xl shadow-emerald-900/40 p-4 w-72">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[10px] text-emerald-400 tracking-widest uppercase">
            Rysowanie granicy
          </span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">
          ×
        </button>
      </div>

      <div className="font-mono text-[10px] text-emerald-400 animate-pulse mb-3 tracking-wider">
        KLIKNIJ MAPĘ — DODAJ PUNKT · 2× LUB GOTOWE — ZAKOŃCZ
      </div>

      <div className="max-h-28 overflow-y-auto space-y-1 mb-3 pr-1">
        {zonePoints.map((pt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="font-mono text-[10px] text-muted-foreground">
              {pt[0].toFixed(4)}° {pt[1].toFixed(4)}°
            </span>
          </div>
        ))}
      </div>

      {perimeterM > 0 && (
        <div className="mb-3 pt-2 border-t border-border flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Obwód</span>
          <span className="font-mono text-sm font-semibold text-emerald-400 tabular-nums">
            {Math.round(perimeterM).toLocaleString()} m
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onUndo}
          disabled={zonePoints.length === 0}
          className="flex-1 px-3 py-1.5 text-xs font-mono tracking-wider uppercase border border-border rounded hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ↩ Cofnij
        </button>
        <button
          onClick={onDone}
          disabled={zonePoints.length < 3}
          className="flex-1 px-3 py-1.5 text-xs font-mono tracking-wider uppercase bg-emerald-600 text-white rounded hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          ✓ Gotowe
        </button>
      </div>
    </div>
  );
}

// ── Main MapComponent ─────────────────────────────────────────────────────────

export const MapComponent = () => {
  const isSelectingMode = useAppStore((s) => s.isSelectingMode);
  const setIsSelectingMode = useAppStore((s) => s.setIsSelectingMode);
  
  const isEditingNodes = useAppStore((s) => s.isEditingNodes);
  const setIsEditingNodes = useAppStore((s) => s.setIsEditingNodes);

  const missionPoints = useAppStore((s) => s.missionPoints);
  const addMissionPoint = useAppStore((s) => s.addMissionPoint);
  const removeLastMissionPoint = useAppStore((s) => s.removeLastMissionPoint);
  const clearMissionPoints = useAppStore((s) => s.clearMissionPoints);

  const espNodes = useAppStore((s) => s.espNodes);
  const addEspNode = useAppStore((s) => s.addEspNode);
  const removeEspNode = useAppStore((s) => s.removeEspNode);
  const updateEspNode = useAppStore((s) => s.updateEspNode);
  const editingLineId = useAppStore((s) => s.editingLineId);
  const setEditingLineId = useAppStore((s) => s.setEditingLineId);

  const dronePositions = useAppStore((s) => s.dronePositions);
  const mapStyle = useAppStore((s) => s.mapStyle);
  const theme = useAppStore((s) => s.theme);

  const zoneDrawingActive    = useAppStore((s) => s.zoneDrawingActive);
  const setZoneDrawingActive = useAppStore((s) => s.setZoneDrawingActive);
  const zonePoints           = useAppStore((s) => s.zonePoints);
  const addZonePoint         = useAppStore((s) => s.addZonePoint);
  const removeLastZonePoint  = useAppStore((s) => s.removeLastZonePoint);
  const clearZonePoints      = useAppStore((s) => s.clearZonePoints);

  const mapRef = useRef<MapLibreGL.Map | null>(null);
  const t = useTranslation();
  const mapStyleProp = mapStyle === 'satellite' ? SATELLITE_STYLE : undefined;
  const mapTheme = theme === 'auto' ? undefined : theme;

  const handleMapClick = (lat: number, lng: number) => {
    if (zoneDrawingActive) {
      addZonePoint([lat, lng]);
      return;
    }
    if (isEditingNodes && editingLineId) {
      const manualSensorIndex = espNodes.filter(n => n.lineId === editingLineId).length + 1;
      const lineName = editingLineId;
      const sensorName = `${lineName}-sensor-${manualSensorIndex}`;
      addEspNode({
        id: sensorName,
        name: sensorName,
        latitude: lat,
        longitude: lng,
        lineId: editingLineId,
        deploymentTime: Date.now(),
      });
      return;
    }
    if (!isSelectingMode) return;
    addMissionPoint([lat, lng]);
  };

  const handleNodeClick = (id: string) => {
    if (isEditingNodes) {
      removeEspNode(id);
    }
  };

  const handleNodeDrag = (id: string, lat: number, lng: number) => {
    updateEspNode(id, { latitude: lat, longitude: lng });
  };

  const handleAreaClick = (lineId: string) => {
    setEditingLineId(lineId);
    setIsEditingNodes(true);
  };

  const handleLocationSelect = (lat: number, lon: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lon, lat], zoom: 13, duration: 1200 });
    }
  };

  const startPlanning = () => {
    setIsSelectingMode(true);
    setIsEditingNodes(false);
  };

  const stopPlanning = () => {
    setIsSelectingMode(false);
  };

  const stopEditing = () => {
    setIsEditingNodes(false);
  }

  const hasRoute = missionPoints.length > 0;

  // Prepare active route coordinates for MapRoute
  let activeRouteCoords: number[][] = [];
  if (missionPoints.length > 0) {
    activeRouteCoords = missionPoints.map(p => [p[1], p[0]]); // MapRoute expects [lng, lat]
    if (missionPoints.length > 2) {
      // Close loop visually for route line
      activeRouteCoords.push([missionPoints[0][1], missionPoints[0][0]]);
    }
  }

  // Prepare zone preview coordinates
  let activeZoneCoords: [number, number][] = [];
  if (zonePoints.length > 0) {
    activeZoneCoords = zonePoints.map(p => [p[1], p[0]] as [number, number]);
    if (zonePoints.length > 2) {
      activeZoneCoords.push([zonePoints[0][1], zonePoints[0][0]]);
    }
  }

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        center={[19.0, 52.0]}
        zoom={6}
        theme={mapTheme}
        mapStyle={mapStyleProp}
        className="w-full h-full"
      >
        <MapControls
          position="bottom-left"
          showZoom
          showCompass
          showFullscreen
        />
        <CursorController crosshair={isSelectingMode || isEditingNodes || zoneDrawingActive} />
      <MapLayers
        onMapClick={handleMapClick}
        onNodeClick={handleNodeClick}
        onNodeDrag={handleNodeDrag}
        onAreaClick={handleAreaClick}
        isSelectingMode={isSelectingMode}
        isEditingNodes={isEditingNodes}
        isZoneDrawing={zoneDrawingActive}
      />

        {/* Drone markers */}
        {dronePositions.map((pos, i) => (
          <MapMarker key={`drone-${i}`} longitude={pos[1]} latitude={pos[0]}>
            <MarkerContent>
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 rounded-full bg-purple-500/30 animate-ping" />
                <div className="relative w-4 h-4 rounded-full bg-purple-500 border-2 border-purple-300 shadow-lg shadow-purple-500/60 drone-marker-pulse" />
              </div>
            </MarkerContent>
          </MapMarker>
        ))}

        {/* Mission route line (in-progress) */}
        {activeRouteCoords.length > 1 && (
          <>
            <MapRoute
              coordinates={activeRouteCoords as [number, number][]}
              color="#3a1600"
              width={7}
              opacity={0.7}
              interactive={false}
            />
            <MapRoute
              coordinates={activeRouteCoords as [number, number][]}
              color="#ff4fd8"
              width={3}
              opacity={1}
              dashArray={[8, 4]}
              interactive={false}
            />
          </>
        )}

        {/* Zone boundary preview (in-progress drawing) */}
        {activeZoneCoords.length > 1 && (
          <>
            <MapRoute
              coordinates={activeZoneCoords}
              color="#052e14"
              width={7}
              opacity={0.7}
              interactive={false}
            />
            <MapRoute
              coordinates={activeZoneCoords}
              color="#22c55e"
              width={2.5}
              opacity={1}
              dashArray={[8, 4]}
              interactive={false}
            />
          </>
        )}
      </Map>

      {/* ── Map Overlays ── */}

      {/* Search — top left */}
      <div className="absolute top-4 left-4 z-10 flex items-start gap-2">
        <SearchBar onLocationSelect={handleLocationSelect} t={t} />
      </div>

      {/* Map style — bottom left, next to map controls */}
      <div className="absolute bottom-2 left-12 z-10 flex items-end mb-0.5">
        <MapStyleSwitcher />
      </div>

      {/* Zone planner panel — appears when drawing a zone boundary */}
      {zoneDrawingActive && (
        <div className="absolute top-4 right-80 z-10">
          <ZonePlannerPanel
            zonePoints={zonePoints}
            onDone={() => setZoneDrawingActive(false)}
            onClose={() => { setZoneDrawingActive(false); clearZonePoints(); }}
            onUndo={removeLastZonePoint}
          />
        </div>
      )}

      {/* Route planner panel — top right when in selection mode */}
      {isSelectingMode && !isEditingNodes && (
        <div className="absolute top-4 right-80 z-10">
          <RoutePlannerPanel
            missionPoints={missionPoints}
            onDone={stopPlanning}
            onClose={stopPlanning}
            onRemoveLastPoint={removeLastMissionPoint}
            t={t}
          />
        </div>
      )}

      {/* Node editor panel */}
      {isEditingNodes && (
        <div className="absolute top-4 right-80 z-10">
          <NodeEditorPanel onDone={stopEditing} t={t} />
        </div>
      )}

      {/* Route summary — top right when route set and not in selection mode */}
      {hasRoute && !isSelectingMode && !isEditingNodes && (
        <div className="absolute top-4 right-80 z-10">
          <RouteSummary
            missionPoints={missionPoints}
            onEdit={startPlanning}
            onRemove={clearMissionPoints}
            t={t}
          />
        </div>
      )}
    </div>
  );
};
