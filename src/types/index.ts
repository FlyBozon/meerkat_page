export interface Detection {
  id: string;
  lineId: string;
  timestamp: number;
  intensity: number; 
  frequency: number; 
}

export interface EspNode {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  lineId: string;
  deploymentTime?: number;
}

export interface DeploymentLine {
  id: string;
  name: string;
  points: Array<{lat: number, lng: number}>;
  spacing: 300 | 500 | 700;
  createdAt: number;
  costMin?: number;
  costMax?: number;
  weightMin?: number;
  weightMax?: number;
  distanceKm?: number;
  // Fence infrastructure
  fenceHasCabling?: boolean;
  fenceCableType?: string;
  fenceHasPower?: boolean;
  fencePowerVoltageV?: number;
  fencePostSpacingM?: number;
}

export interface DroneRoute {
  id: string;
  waypoints: Array<{
    lat: number;
    lng: number;
  }>;
  status: 'planning' | 'flying' | 'completed' | 'cancelled';
  createdAt: number;
}

export type Theme = 'light' | 'dark' | 'auto';
export type MapStyleMode = 'street' | 'satellite';

export interface ProtectedZone {
  id: string;
  name: string;
  points: Array<{ lat: number; lng: number }>;
  perimeterM: number;
  hasSensors: boolean;
  sensorSpacing: 300 | 500 | 700;
  sensorCount: number;
  costMin: number;
  costMax: number;
  weightMin: number;
  weightMax: number;
  createdAt: number;
}
