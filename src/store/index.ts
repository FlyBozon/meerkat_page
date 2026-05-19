import { create } from 'zustand';
import { Detection, EspNode, DeploymentLine, MapStyleMode, Theme, ProtectedZone } from '@/types/index';
import type { Language } from '@/i18n/translations';
import { convexHull, isPointInPolygon } from '@/utils/convexHull';

function syncLinePolygon(lines: DeploymentLine[], nodes: EspNode[]): DeploymentLine[] {
  return lines.map((line) => {
    const lineNodes = nodes.filter((n) => n.lineId === line.id);
    if (lineNodes.length < 3) return line;

    const hull = convexHull(lineNodes.map((n) => ({ lat: n.latitude, lng: n.longitude })));
    if (hull.length < 3) return line;

    const changed = lineNodes.some((n) => {
      const sensorPt = { lat: n.latitude, lng: n.longitude };
      return !line.points.some(
        (p) => Math.abs(p.lat - sensorPt.lat) < 1e-9 && Math.abs(p.lng - sensorPt.lng) < 1e-9
      );
    });

    if (!changed && line.points.length >= hull.length) {
      const polygon = line.points;
      const hasOutside = lineNodes.some((n) => {
        const sensorPt = { lat: n.latitude, lng: n.longitude };
        const onEdge = polygon.some(
          (p) => Math.abs(p.lat - sensorPt.lat) < 1e-9 && Math.abs(p.lng - sensorPt.lng) < 1e-9
        );
        return !onEdge && !isPointInPolygon(sensorPt, polygon);
      });
      if (!hasOutside) return line;
    }

    return { ...line, points: hull };
  });
}

interface AppStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;

  mapStyle: MapStyleMode;
  setMapStyle: (mapStyle: MapStyleMode) => void;

  language: Language;
  setLanguage: (language: Language) => void;

  deploymentLines: DeploymentLine[];
  addDeploymentLine: (line: DeploymentLine) => void;
  updateDeploymentLine: (id: string, updates: Partial<DeploymentLine>) => void;
  removeDeploymentLine: (id: string) => void;
  clearDeploymentLines: () => void;

  espNodes: EspNode[];
  addEspNode: (node: EspNode) => void;
  addEspNodes: (nodes: EspNode[]) => void;
  removeEspNode: (id: string) => void;
  updateEspNode: (id: string, updates: Partial<Pick<EspNode, 'latitude' | 'longitude' | 'name'>>) => void;
  clearEspNodes: () => void;
  removeEspNodesByLineId: (lineId: string) => void;

  detections: Detection[];
  addDetection: (detection: Detection) => void;
  clearDetections: () => void;

  dronePositions: Array<[number, number]>;
  setDronePositions: (positions: Array<[number, number]>) => void;

  selectedLineId: string | null;
  setSelectedLineId: (id: string | null) => void;

  missionPoints: Array<[number, number]>;
  addMissionPoint: (point: [number, number]) => void;
  removeLastMissionPoint: () => void;
  clearMissionPoints: () => void;

  isSelectingMode: boolean;
  setIsSelectingMode: (isSelecting: boolean) => void;

  isEditingNodes: boolean;
  setIsEditingNodes: (isEditing: boolean) => void;
  editingLineId: string | null;
  setEditingLineId: (id: string | null) => void;

  // ── Protected zones ───────────────────────────────────────────────────────
  protectedZones: ProtectedZone[];
  addProtectedZone: (zone: ProtectedZone) => void;
  removeProtectedZone: (id: string) => void;
  clearProtectedZones: () => void;

  zoneDrawingActive: boolean;
  setZoneDrawingActive: (b: boolean) => void;
  zonePoints: Array<[number, number]>;
  addZonePoint: (p: [number, number]) => void;
  removeLastZonePoint: () => void;
  clearZonePoints: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  theme: 'auto',
  setTheme: (theme) => set({ theme }),

  mapStyle: 'street',
  setMapStyle: (mapStyle) => set({ mapStyle }),

  
  language: 'pl',
  setLanguage: (language) => set({ language }),

  deploymentLines: [],
  addDeploymentLine: (line) =>
    set((state) => ({ deploymentLines: [...state.deploymentLines, line] })),
  updateDeploymentLine: (id, updates) =>
    set((state) => ({
      deploymentLines: state.deploymentLines.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    })),
  removeDeploymentLine: (id) =>
    set((state) => ({ deploymentLines: state.deploymentLines.filter((l) => l.id !== id) })),
  clearDeploymentLines: () => set({ deploymentLines: [] }),

  
  espNodes: [],
  addEspNode: (node) =>
    set((state) => {
      const espNodes = [...state.espNodes, node];
      return {
        espNodes,
        deploymentLines: syncLinePolygon(state.deploymentLines, espNodes),
      };
    }),
  addEspNodes: (nodes) =>
    set((state) => {
      const espNodes = [...state.espNodes, ...nodes];
      return {
        espNodes,
        deploymentLines: syncLinePolygon(state.deploymentLines, espNodes),
      };
    }),
  removeEspNode: (id) =>
    set((state) => {
      const removed = state.espNodes.find((n) => n.id === id);
      const espNodes = state.espNodes.filter((n) => n.id !== id);
      if (removed) {
        const remaining = espNodes.filter((n) => n.lineId === removed.lineId);
        if (remaining.length >= 3) {
          return { espNodes, deploymentLines: syncLinePolygon(state.deploymentLines, espNodes) };
        }
      }
      return { espNodes };
    }),
  updateEspNode: (id, updates) =>
    set((state) => {
      const espNodes = state.espNodes.map((n) =>
        n.id === id ? { ...n, ...updates } : n
      );
      if ('latitude' in updates || 'longitude' in updates) {
        const node = espNodes.find((n) => n.id === id);
        if (node) {
          return { espNodes, deploymentLines: syncLinePolygon(state.deploymentLines, espNodes) };
        }
      }
      return { espNodes };
    }),
  clearEspNodes: () => set({ espNodes: [] }),
  removeEspNodesByLineId: (lineId) =>
    set((state) => ({
      espNodes: state.espNodes.filter((n) => n.lineId !== lineId),
    })),

  detections: [],
  addDetection: (detection) =>
    set((state) => ({ detections: [...state.detections, detection] })),
  clearDetections: () => set({ detections: [] }),

  dronePositions: [],
  setDronePositions: (positions) => set({ dronePositions: positions }),

  selectedLineId: null,
  setSelectedLineId: (id) => set({ selectedLineId: id }),

  missionPoints: [],
  addMissionPoint: (point) =>
    set((state) => ({ missionPoints: [...state.missionPoints, point] })),
  removeLastMissionPoint: () =>
    set((state) => ({ missionPoints: state.missionPoints.slice(0, -1) })),
  clearMissionPoints: () => set({ missionPoints: [] }),

  isSelectingMode: false,
  setIsSelectingMode: (isSelecting) => set({ isSelectingMode: isSelecting }),

  isEditingNodes: false,
  setIsEditingNodes: (isEditing) => set({ isEditingNodes: isEditing }),
  editingLineId: null,
  setEditingLineId: (id) => set({ editingLineId: id }),

  // ── Protected zones ───────────────────────────────────────────────────────
  protectedZones: [],
  addProtectedZone: (zone) =>
    set((state) => ({ protectedZones: [...state.protectedZones, zone] })),
  removeProtectedZone: (id) =>
    set((state) => ({ protectedZones: state.protectedZones.filter((z) => z.id !== id) })),
  clearProtectedZones: () => set({ protectedZones: [] }),

  zoneDrawingActive: false,
  setZoneDrawingActive: (b) => set({ zoneDrawingActive: b }),
  zonePoints: [],
  addZonePoint: (p) =>
    set((state) => ({ zonePoints: [...state.zonePoints, p] })),
  removeLastZonePoint: () =>
    set((state) => ({ zonePoints: state.zonePoints.slice(0, -1) })),
  clearZonePoints: () => set({ zonePoints: [] }),
}));
