import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAppStore } from '@/store/index';
import { DeploymentLine, EspNode } from '@/types/index';
import { useTranslation } from '@/i18n/useTranslation';

const COST_DATA: Record<300 | 500 | 700, { costMin: number; costMax: number; weightMin: number; weightMax: number }> = {
  300: { costMin: 530, costMax: 600, weightMin: 3.0, weightMax: 4.0 },
  500: { costMin: 400, costMax: 480, weightMin: 2.0, weightMax: 2.8 },
  700: { costMin: 320, costMax: 380, weightMin: 1.5, weightMax: 2.0 },
};

export const DeploymentDialog = () => {
  const [spacing, setSpacing] = useState<300 | 500 | 700>(500);
  const [isOpen, setIsOpen] = useState(false);

  // Fence infrastructure state
  const [hasCabling, setHasCabling]   = useState(false);
  const [cableType, setCableType]     = useState('');
  const [hasPower, setHasPower]       = useState(false);
  const [powerVoltage, setPowerVoltage] = useState<number | ''>('');
  const [postSpacing, setPostSpacing] = useState<number | ''>('');

  const missionPoints = useAppStore((s) => s.missionPoints);
  const addDeploymentLine = useAppStore((s) => s.addDeploymentLine);
  const addEspNodes = useAppStore((s) => s.addEspNodes);
  const clearMissionPoints = useAppStore((s) => s.clearMissionPoints);
  const t = useTranslation();

  const isSelectingMode = useAppStore((s) => s.isSelectingMode);
  const setIsSelectingMode = useAppStore((s) => s.setIsSelectingMode);
  
  const setIsEditingNodes = useAppStore((s) => s.setIsEditingNodes);
  const setEditingLineId = useAppStore((s) => s.setEditingLineId);

  const startPlanning = () => {
    setIsSelectingMode(true);
    setIsEditingNodes(false);
  };

  const routeReady = missionPoints.length > 1;

  const calcDistKm = (): number => {
    if (!routeReady) return 0;
    let distM = 0;
    const polygonCoords = [...missionPoints];
    if (polygonCoords.length > 2) {
      polygonCoords.push(polygonCoords[0]); // close loop
    }
    for (let i = 1; i < polygonCoords.length; i++) {
      distM += Math.sqrt(
        Math.pow(polygonCoords[i][0] - polygonCoords[i-1][0], 2) +
          Math.pow(polygonCoords[i][1] - polygonCoords[i-1][1], 2)
      ) * 111000;
    }
    return distM / 1000;
  };

  const distKm = calcDistKm();
  const distM = Math.round(distKm * 1000);
  const sensorCount = distM > 0 ? Math.floor(distM / spacing) + 1 : 0;
  const cd = COST_DATA[spacing];

  const deploymentLines = useAppStore((s) => s.deploymentLines);

  const handleDeploy = () => {
    if (!routeReady) return;

    const areaIndex = deploymentLines.length + 1;
    const lineId = `area-${areaIndex}`;
    const lineName = `area-${areaIndex}`;

    const pointsMapped = missionPoints.map(p => ({ lat: p[0], lng: p[1] }));

    const line: DeploymentLine = {
      id: lineId,
      name: lineName,
      points: pointsMapped,
      spacing,
      createdAt: Date.now(),
      distanceKm: Math.round(distKm * 100) / 100,
      costMin: Math.round(cd.costMin * distKm),
      costMax: Math.round(cd.costMax * distKm),
      weightMin: Math.round(cd.weightMin * distKm * 10) / 10,
      weightMax: Math.round(cd.weightMax * distKm * 10) / 10,
      fenceHasCabling: hasCabling,
      fenceCableType:  hasCabling && cableType.trim() ? cableType.trim() : undefined,
      fenceHasPower:   hasPower,
      fencePowerVoltageV: hasPower && powerVoltage !== '' ? Number(powerVoltage) : undefined,
      fencePostSpacingM:  postSpacing !== '' ? Number(postSpacing) : undefined,
    };

    const nodes: EspNode[] = [];
    const polygonCoords = [...missionPoints];
    if (polygonCoords.length > 2) {
      polygonCoords.push(polygonCoords[0]);
    }

    // Place nodes along segments
    for (let i = 0; i < polygonCoords.length - 1; i++) {
      const p1 = polygonCoords[i];
      const p2 = polygonCoords[i+1];
      const segDist = Math.sqrt(Math.pow(p2[0]-p1[0], 2) + Math.pow(p2[1]-p1[1], 2)) * 111000;

      const steps = Math.floor(segDist / spacing);
      const latStep = steps > 0 ? (p2[0] - p1[0]) / steps : 0;
      const lngStep = steps > 0 ? (p2[1] - p1[1]) / steps : 0;

      const stepCount = steps > 0 ? steps : 1;
      for (let j = 0; j < stepCount; j++) {
        const sensorIndex = nodes.length + 1;
        nodes.push({
          id: `${lineName}-sensor-${sensorIndex}`,
          name: `${lineName}-sensor-${sensorIndex}`,
          latitude: p1[0] + latStep * j,
          longitude: p1[1] + lngStep * j,
          lineId,
          deploymentTime: Date.now() + nodes.length * 100,
        });
      }
    }

    // Add final point just in case it's not a closed loop
    if (polygonCoords.length === 2) {
      const pLast = polygonCoords[1];
      const sensorIndex = nodes.length + 1;
      nodes.push({
        id: `${lineName}-sensor-${sensorIndex}`,
        name: `${lineName}-sensor-${sensorIndex}`,
        latitude: pLast[0],
        longitude: pLast[1],
        lineId,
        deploymentTime: Date.now() + nodes.length * 100,
      });
    }

    addDeploymentLine(line);
    addEspNodes(nodes);
    clearMissionPoints();
    setIsOpen(false);
    
    // Switch to manual edit mode immediately
    setEditingLineId(lineId);
    setIsEditingNodes(true);
    setIsSelectingMode(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {routeReady ? (
        <DialogTrigger asChild>
          <button
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-mono tracking-widest uppercase font-semibold transition-all shadow-lg bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent/20"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t.deploymentDialog.deploy}
          </button>
        </DialogTrigger>
      ) : (
        <button
          onClick={startPlanning}
          disabled={isSelectingMode}
          className={`w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-mono tracking-widest uppercase font-semibold transition-all shadow-lg ${
            isSelectingMode
              ? 'bg-card/85 backdrop-blur-md border border-border text-muted-foreground cursor-default shadow-black/20 opacity-70'
              : 'bg-card/85 backdrop-blur-md border border-border text-foreground hover:bg-muted/50 cursor-pointer shadow-black/20'
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          {t.map.planRoute}
        </button>
      )}

      <DialogContent className="sm:max-w-sm bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm tracking-widest uppercase text-foreground">
            {t.deploymentDialog.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {/* Route summary */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              {t.deploymentDialog.subtitle}
            </span>
            <div className="space-y-1.5 mt-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  Liczba punktów: {missionPoints.length}
                </span>
              </div>
              {distM > 0 && (
                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                    {t.deploymentDialog.distance}
                  </span>
                  <span className="font-mono text-sm font-semibold text-accent tabular-nums">
                    {distM.toLocaleString()} m
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Spacing selector */}
          <div className="space-y-2">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              {t.deploymentDialog.sensorSpacing}
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {([300, 500, 700] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setSpacing(v)}
                  className={`py-2.5 rounded-lg border text-center transition-all ${
                    spacing === v
                      ? 'border-accent/60 bg-accent/10 text-accent'
                      : 'border-border bg-muted/20 text-muted-foreground hover:border-border/80 hover:text-foreground'
                  }`}
                >
                  <div className="font-mono text-sm font-semibold">{v}m</div>
                  <div className="font-mono text-[9px] opacity-70 mt-0.5 uppercase">
                    {v === 300
                      ? t.deploymentDialog.spacingOptions.dense
                      : v === 500
                      ? t.deploymentDialog.spacingOptions.standard
                      : t.deploymentDialog.spacingOptions.wide}
                  </div>
                </button>
              ))}
            </div>
            {sensorCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  {t.deploymentDialog.sensorsCount}
                </span>
                <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
                  {nodesCountApprox(distM, spacing, missionPoints.length)}
                </span>
              </div>
            )}
          </div>

          {/* Cost/weight estimate */}
          {distKm > 0 && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                {t.deploymentDialog.costRange}
              </span>
              <div className="space-y-1.5 mt-1">
                <DataRow
                  label="PLN"
                  value={`${Math.round(cd.costMin * distKm).toLocaleString()} – ${Math.round(cd.costMax * distKm).toLocaleString()}`}
                />
                <DataRow
                  label="kg"
                  value={`${(Math.round(cd.weightMin * distKm * 10) / 10).toFixed(1)} – ${(Math.round(cd.weightMax * distKm * 10) / 10).toFixed(1)}`}
                />
              </div>
            </div>
          )}

          {/* Fence infrastructure */}
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              {t.deploymentDialog.fenceInfra}
            </span>

            {/* Cabling */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  {t.deploymentDialog.fenceCabling}
                </span>
                <Toggle checked={hasCabling} onChange={setHasCabling} />
              </div>
              {hasCabling && (
                <input
                  type="text"
                  placeholder={t.deploymentDialog.fenceCableType}
                  value={cableType}
                  onChange={(e) => setCableType(e.target.value)}
                  className="w-full bg-background border border-border rounded px-2 py-1 font-mono text-xs text-foreground outline-none focus:border-accent"
                />
              )}
            </div>

            {/* Power */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  {t.deploymentDialog.fencePower}
                </span>
                <Toggle checked={hasPower} onChange={setHasPower} />
              </div>
              {hasPower && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={powerVoltage}
                    onChange={(e) => setPowerVoltage(e.target.value === '' ? '' : Number(e.target.value))}
                    className="flex-1 bg-background border border-border rounded px-2 py-1 font-mono text-xs text-foreground outline-none focus:border-accent"
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">V</span>
                </div>
              )}
            </div>

            {/* Post spacing */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider flex-1">
                {t.deploymentDialog.fencePostSpacing}
              </span>
              <input
                type="number"
                min={0}
                placeholder="—"
                value={postSpacing}
                onChange={(e) => setPostSpacing(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-20 bg-background border border-border rounded px-2 py-1 font-mono text-xs text-foreground outline-none focus:border-accent text-right"
              />
              <span className="font-mono text-[10px] text-muted-foreground">m</span>
            </div>
          </div>

          {/* Deploy button */}
          <button
            onClick={handleDeploy}
            disabled={!routeReady}
            className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground font-mono text-xs tracking-widest uppercase font-semibold hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20"
          >
            {t.deploymentDialog.deploy}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="font-mono text-xs font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-accent' : 'bg-muted'}`}
      role="switch"
      aria-checked={checked}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${checked ? 'right-0.5' : 'left-0.5'}`} />
    </button>
  );
}

function nodesCountApprox(distM: number, spacing: number, pointsCount: number) {
  if (distM === 0) return 0;
  return Math.floor(distM / spacing) + (pointsCount === 2 ? 1 : 0);
}
