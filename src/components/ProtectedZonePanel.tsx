import { useState } from 'react';
import { useAppStore } from '@/store/index';
import { useTranslation } from '@/i18n/useTranslation';
import type { ProtectedZone, EspNode } from '@/types/index';

const COST_DATA: Record<300 | 500 | 700, { costMin: number; costMax: number; weightMin: number; weightMax: number }> = {
  300: { costMin: 530, costMax: 600, weightMin: 3.0, weightMax: 4.0 },
  500: { costMin: 400, costMax: 480, weightMin: 2.0, weightMax: 2.8 },
  700: { costMin: 320, costMax: 380, weightMin: 1.5, weightMax: 2.0 },
};

function calcPerimeterM(points: Array<[number, number]>): number {
  if (points.length < 2) return 0;
  let total = 0;
  const closed = [...points, points[0]];
  for (let i = 1; i < closed.length; i++) {
    total += Math.sqrt(
      Math.pow(closed[i][0] - closed[i - 1][0], 2) +
      Math.pow(closed[i][1] - closed[i - 1][1], 2)
    ) * 111000;
  }
  return total;
}

function placeZoneSensors(zoneId: string, points: Array<[number, number]>, spacing: number): EspNode[] {
  const nodes: EspNode[] = [];
  const closed = [...points, points[0]];
  for (let i = 0; i < closed.length - 1; i++) {
    const p1 = closed[i];
    const p2 = closed[i + 1];
    const segM = Math.sqrt(
      Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2)
    ) * 111000;
    const steps = Math.floor(segM / spacing);
    const latStep = steps > 0 ? (p2[0] - p1[0]) / steps : 0;
    const lngStep = steps > 0 ? (p2[1] - p1[1]) / steps : 0;
    const count = steps > 0 ? steps : 1;
    for (let j = 0; j < count; j++) {
      const idx = nodes.length + 1;
      nodes.push({
        id: `${zoneId}-s${idx}`,
        name: `${zoneId}-s${idx}`,
        latitude: p1[0] + latStep * j,
        longitude: p1[1] + lngStep * j,
        lineId: zoneId,
        deploymentTime: Date.now() + nodes.length * 100,
      });
    }
  }
  return nodes;
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="font-mono text-xs font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

export const ProtectedZonePanel = () => {
  const [expanded, setExpanded] = useState(false);
  const [hasSensors, setHasSensors] = useState(true);
  const [spacing, setSpacing] = useState<300 | 500 | 700>(500);

  const zoneDrawingActive    = useAppStore((s) => s.zoneDrawingActive);
  const setZoneDrawingActive = useAppStore((s) => s.setZoneDrawingActive);
  const zonePoints           = useAppStore((s) => s.zonePoints);
  const clearZonePoints      = useAppStore((s) => s.clearZonePoints);
  const protectedZones       = useAppStore((s) => s.protectedZones);
  const addProtectedZone     = useAppStore((s) => s.addProtectedZone);
  const addEspNodes          = useAppStore((s) => s.addEspNodes);
  const removeProtectedZone  = useAppStore((s) => s.removeProtectedZone);
  const removeEspNodesByLineId = useAppStore((s) => s.removeEspNodesByLineId);
  const t = useTranslation();
  const z = t.zone;

  const perimeterM  = calcPerimeterM(zonePoints);
  const canDeploy   = zonePoints.length >= 3;
  const cd          = COST_DATA[spacing];
  const sensorCount = hasSensors && canDeploy ? Math.floor(perimeterM / spacing) : 0;
  const perimeterKm = perimeterM / 1000;

  function handleToggleDrawing() {
    if (zoneDrawingActive) {
      setZoneDrawingActive(false);
    } else {
      clearZonePoints();
      setZoneDrawingActive(true);
    }
  }

  function handleDeploy() {
    if (!canDeploy) return;
    const zoneId = `zone-${Date.now()}`;
    const name   = `Obiekt ${protectedZones.length + 1}`;
    const pts    = zonePoints.map(([lat, lng]) => ({ lat, lng }));

    const zone: ProtectedZone = {
      id: zoneId,
      name,
      points: pts,
      perimeterM: Math.round(perimeterM),
      hasSensors,
      sensorSpacing: spacing,
      sensorCount,
      costMin:   hasSensors ? Math.round(cd.costMin   * perimeterKm) : 0,
      costMax:   hasSensors ? Math.round(cd.costMax   * perimeterKm) : 0,
      weightMin: hasSensors ? Math.round(cd.weightMin * perimeterKm * 10) / 10 : 0,
      weightMax: hasSensors ? Math.round(cd.weightMax * perimeterKm * 10) / 10 : 0,
      createdAt: Date.now(),
    };

    addProtectedZone(zone);

    if (hasSensors) {
      addEspNodes(placeZoneSensors(zoneId, zonePoints, spacing));
    }

    clearZonePoints();
    setZoneDrawingActive(false);
  }

  function handleRemoveZone(id: string) {
    removeProtectedZone(id);
    removeEspNodesByLineId(id);
  }

  return (
    <div className="bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden w-72 max-w-[18rem] flex flex-col transition-all duration-200">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-pointer flex-shrink-0 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span className="font-mono text-[10px] text-emerald-400 tracking-widest uppercase">
            {z.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {protectedZones.length > 0 && (
            <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
              {protectedZones.length}
            </span>
          )}
          <svg
            className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
          >
            <path strokeLinecap="round" d="M19 9l-7 7-7-7" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 px-3 pb-3">

          {/* ── Boundary drawing ── */}
          <div className="space-y-2">
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
              {z.perimeter}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={handleToggleDrawing}
                className={`flex-1 px-2.5 py-2 rounded-lg border text-[10px] font-mono tracking-wider uppercase font-semibold transition-all ${
                  zoneDrawingActive
                    ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
                    : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:border-border/80'
                }`}
              >
                {zoneDrawingActive ? `✏ ${z.drawing}` : `✏ ${z.draw}`}
              </button>
              {zonePoints.length > 0 && (
                <button
                  onClick={() => { clearZonePoints(); setZoneDrawingActive(false); }}
                  className="px-2.5 py-2 rounded-lg border border-border bg-muted/20 text-muted-foreground hover:text-destructive hover:border-destructive/50 text-[10px] font-mono uppercase tracking-wider transition-all"
                >
                  {z.clear}
                </button>
              )}
            </div>

            {zoneDrawingActive && (
              <p className="font-mono text-[10px] text-emerald-400 animate-pulse tracking-wider">
                KLIKNIJ MAPĘ · 2× LUB PRZYCISK — ZAKOŃCZ
              </p>
            )}

            {zonePoints.length > 0 && (
              <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span>{zonePoints.length} {z.points}</span>
                {perimeterM > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-foreground font-semibold">{Math.round(perimeterM).toLocaleString()} m</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Sensors toggle ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
                {z.sensors}
              </span>
              <button
                onClick={() => setHasSensors((v) => !v)}
                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${hasSensors ? 'bg-emerald-500' : 'bg-muted'}`}
                role="switch"
                aria-checked={hasSensors}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${hasSensors ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>

            {hasSensors && (
              <>
                <div className="grid grid-cols-3 gap-1.5">
                  {([300, 500, 700] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setSpacing(v)}
                      className={`py-2 rounded-lg border text-center transition-all ${
                        spacing === v
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
                          : 'border-border bg-muted/20 text-muted-foreground hover:border-border/80 hover:text-foreground'
                      }`}
                    >
                      <div className="font-mono text-xs font-semibold">{v}m</div>
                    </button>
                  ))}
                </div>

                {canDeploy && perimeterM > 0 && (
                  <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-1.5">
                    <DataRow label={z.count} value={String(sensorCount)} />
                    <DataRow
                      label={z.cost}
                      value={`${Math.round(cd.costMin * perimeterKm).toLocaleString()} – ${Math.round(cd.costMax * perimeterKm).toLocaleString()}`}
                    />
                    <DataRow
                      label={z.weight}
                      value={`${(Math.round(cd.weightMin * perimeterKm * 10) / 10).toFixed(1)} – ${(Math.round(cd.weightMax * perimeterKm * 10) / 10).toFixed(1)}`}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Deploy button ── */}
          <button
            onClick={handleDeploy}
            disabled={!canDeploy}
            className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-mono text-[10px] tracking-widest uppercase font-semibold hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/30"
          >
            {canDeploy ? z.deploy : z.needPoints}
          </button>

          {/* ── Deployed zones list ── */}
          {protectedZones.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-border/50">
              <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
                {z.objects}
              </span>
              {protectedZones.map((zone) => (
                <div
                  key={zone.id}
                  className="border border-border rounded-lg p-2.5 bg-muted/20 flex items-start gap-2"
                >
                  <div className="w-1 self-stretch rounded-full bg-emerald-500/70 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[10px] font-semibold truncate block">{zone.name}</span>
                    <div className="font-mono text-[9px] text-muted-foreground mt-0.5">
                      {(zone.perimeterM / 1000).toFixed(2)} km obwód
                      {zone.hasSensors && ` · ${zone.sensorCount} czujn.`}
                    </div>
                    {zone.hasSensors && zone.costMin > 0 && (
                      <div className="font-mono text-[9px] text-muted-foreground">
                        {zone.costMin.toLocaleString()}–{zone.costMax.toLocaleString()} PLN
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveZone(zone.id)}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors text-base leading-none flex-shrink-0 mt-0.5"
                    title="Usuń obiekt"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
