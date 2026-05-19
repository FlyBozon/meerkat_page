import { useAppStore } from '@/store/index';
import { useTranslation } from '@/i18n/useTranslation';

export const DetectionPanel = () => {
const detections = useAppStore((s) => s.detections);
const espNodes = useAppStore((s) => s.espNodes);
const t = useTranslation();

  const recent = detections.slice(-50).reverse();

  return (
    <div className="h-full bg-card/85 backdrop-blur-md border border-border rounded-xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            {t.detectionPanel.title}
          </span>
          {recent.length > 0 && (
            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
            </span>
          )}
        </div>
        {recent.length > 0 && (
          <span className="font-mono text-xs font-semibold text-amber-400 tabular-nums">
            {recent.length}
          </span>
        )}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {recent.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 py-8">
            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center opacity-30">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" strokeWidth="2" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              {t.detectionPanel.noDetections}
            </span>
          </div>
        ) : (
          recent.map((d) => {
            const node = espNodes.find((n) => n.id === d.lineId);
            const intensity = Math.round(d.intensity);
            const freq = Math.round(d.frequency);

            return (
              <div
                key={d.id}
                className="animate-detection rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 flex-shrink-0"
              >
                <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-amber-400 font-medium truncate">
                  {node?.name ?? node?.id ?? 'UNK'}
                </span>
                  <span className="font-mono text-[10px] text-muted-foreground flex-shrink-0 tabular-nums">
                    {new Date(d.timestamp).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  {/* Intensity bar */}
                  <div className="flex-1 flex items-center gap-1.5">
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${intensity}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-amber-400/80 tabular-nums w-7 text-right">
                      {intensity}%
                    </span>
                  </div>
                  {/* Frequency */}
                  <span className="font-mono text-[10px] text-muted-foreground flex-shrink-0 tabular-nums">
                    {freq} dB
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
