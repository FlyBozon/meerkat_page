import { MapComponent } from '@/components/MapComponent';
import { DeploymentDialog } from '@/components/DeploymentDialog';
import { DetectionPanel } from '@/components/DetectionPanel';
import { DeploymentPanel } from '@/components/ui/deployment-panel';
import { ProtectedZonePanel } from '@/components/ProtectedZonePanel';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { DetectionSimulator } from '@/components/DetectionSimulator';
import { useAppStore } from '@/store/index';
import { useTranslation } from '@/i18n/useTranslation';

function App() {
  const deploymentLines = useAppStore((s) => s.deploymentLines);
  const espNodes = useAppStore((s) => s.espNodes);
  const detections = useAppStore((s) => s.detections);
  const t = useTranslation();

  const isActive = espNodes.length > 0;

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground">
      {/* ── Header ── */}
      <header className="h-14 border-b border-border flex-shrink-0 flex items-center px-5 gap-4 bg-card/90 backdrop-blur-sm z-50 relative">
        {/* Logo + status */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className={`animate-status-ping absolute inline-flex h-full w-full rounded-full ${isActive ? 'bg-accent' : 'bg-muted-foreground'} opacity-60`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-accent' : 'bg-muted-foreground'}`} />
          </span>
          <span className="font-mono font-semibold text-sm tracking-[0.3em] text-foreground uppercase">
            EUDIS
          </span>
          <span className="hidden sm:block h-4 w-px bg-border" />
          <span className="hidden sm:block font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            {isActive ? 'System Active' : 'Standby'}
          </span>
        </div>

        {/* Stats */}
        <div className="ml-auto flex items-center gap-5 sm:gap-8">
          <div className="flex items-center gap-5 sm:gap-7">
            <StatReadout value={deploymentLines.length} label={t.stats.routes} />
            <StatReadout value={espNodes.length} label={t.stats.sensors} />
            <StatReadout
              value={detections.length}
              label={t.stats.detections}
              highlight={detections.length > 0}
            />
          </div>
          <span className="h-4 w-px bg-border hidden sm:block" />
          <LanguageSwitch />
          <ThemeSwitcher />
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 relative overflow-hidden">
        <MapComponent />

        {/* Floating right command panel */}
        <div className="absolute top-4 right-4 bottom-4 w-72 flex flex-col gap-2.5 z-20 pointer-events-none">
          {/* 1. Deployment Dialog - top */}
          <div className="pointer-events-auto flex-shrink-0">
            <DeploymentDialog />
          </div>

          {/* 2. Protected Zone Panel */}
          <div className="pointer-events-auto flex-shrink-0">
            <ProtectedZonePanel />
          </div>

          {/* 3. Detection Panel - middle */}
          <div className="pointer-events-auto flex-1 min-h-0">
            <DetectionPanel />
          </div>
          
          {/* 3. Deployment Panel (edit polys) - bottom */}
          <div className="pointer-events-auto flex-shrink-0">
            <DeploymentPanel />
          </div>
        </div>
      </main>

      <DetectionSimulator />
    </div>
  );
}

function StatReadout({
  value,
  label,
  highlight = false,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={`font-mono text-base font-semibold leading-none tabular-nums transition-colors ${
          highlight ? 'text-amber-400' : 'text-foreground'
        }`}
      >
        {value}
      </div>
      <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5 leading-none">
        {label}
      </div>
    </div>
  );
}

export default App;
