import { useState } from 'react';
import { useAppStore } from '@/store/index';

export function DeploymentPanel() {
  const deploymentLines = useAppStore((s) => s.deploymentLines);
  const espNodes = useAppStore((s) => s.espNodes);
  const removeDeploymentLine = useAppStore((s) => s.removeDeploymentLine);
  const removeEspNodesByLineId = useAppStore((s) => s.removeEspNodesByLineId);
  const updateDeploymentLine = useAppStore((s) => s.updateDeploymentLine);
  const setIsEditingNodes = useAppStore((s) => s.setIsEditingNodes);
  const setEditingLineId = useAppStore((s) => s.setEditingLineId);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState('');

  const handleEdit = (id: string) => {
    setEditingLineId(id);
    setIsEditingNodes(true);
  };

  const startEditingName = (lineId: string, currentName: string) => {
    setEditingName(lineId);
    setNameValue(currentName);
  };

  const saveName = (lineId: string) => {
    if (nameValue.trim()) {
      updateDeploymentLine(lineId, { name: nameValue.trim() });
    }
    setEditingName(null);
  };

  const handleDelete = (id: string) => {
    removeDeploymentLine(id);
    removeEspNodesByLineId(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden w-72 max-w-[18rem] flex flex-col transition-all duration-200">
      {/* Compact / expanded header - single row, same height as buttons */}
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-pointer flex-shrink-0 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="font-mono text-[10px] text-accent tracking-widest uppercase">
          Edytor tras
        </span>
        <div className="flex items-center gap-1.5">
          {deploymentLines.length > 0 && (
            <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
              {deploymentLines.length}
            </span>
          )}
          <svg
            className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" d="M19 9l-7 7-7-7" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="space-y-2 px-3 pb-3 max-h-80 overflow-y-auto">
          {deploymentLines.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              Brak zapisanych tras.
            </p>
          ) : (
            deploymentLines.map((line) => {
              const lineNodes = espNodes.filter((n) => n.lineId === line.id);
              const isDeleteConfirm = deleteConfirm === line.id;

              return (
                <div
                  key={line.id}
                  className="border border-border rounded-lg p-2.5 bg-muted/20"
                >
                  <div className="flex items-center justify-between mb-1">
                    {editingName === line.id ? (
                      <input
                        type="text"
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        onBlur={() => saveName(line.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveName(line.id);
                          if (e.key === 'Escape') setEditingName(null);
                        }}
                        autoFocus
                        className="font-mono text-[10px] font-semibold bg-background border border-accent rounded px-1 py-0.5 w-full max-w-[140px] text-foreground outline-none"
                      />
                    ) : (
                      <span
                        className="font-mono text-[10px] font-semibold truncate max-w-[140px] cursor-pointer hover:text-accent transition-colors"
                        onClick={() => startEditingName(line.id, line.name || line.id)}
                        title="Kliknij, aby edytować nazwę"
                      >
                        {line.name || line.id}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                    <span>Punkty: {line.points.length}</span>
                    <span>Czujniki: {lineNodes.length}</span>
                  </div>
                  {(line.fenceHasCabling || line.fenceHasPower || line.fencePostSpacingM) && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {line.fenceHasCabling && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-muted/40 text-muted-foreground border border-border/60">
                          🔌 {line.fenceCableType || 'kabel'}
                        </span>
                      )}
                      {line.fenceHasPower && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-muted/40 text-muted-foreground border border-border/60">
                          ⚡ {line.fencePowerVoltageV ? `${line.fencePowerVoltageV}V` : 'prąd'}
                        </span>
                      )}
                      {line.fencePostSpacingM && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-muted/40 text-muted-foreground border border-border/60">
                          ⚫ co {line.fencePostSpacingM}m
                        </span>
                      )}
                    </div>
                  )}

                  {isDeleteConfirm ? (
                    <div className="space-y-2">
                      <p className="text-[10px] text-destructive">
                        Czy na pewno chcesz usunąć?
                      </p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleDelete(line.id)}
                          className="flex-1 px-2 py-1 text-[10px] bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
                        >
                          Tak
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="flex-1 px-2 py-1 text-[10px] bg-muted text-muted-foreground rounded hover:bg-muted/80"
                        >
                          Nie
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleEdit(line.id)}
                        className="flex-1 px-2 py-1 text-[10px] bg-accent text-accent-foreground rounded hover:bg-accent/90"
                      >
                        Edytuj
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(line.id)}
                        className="flex-1 px-2 py-1 text-[10px] bg-destructive/20 text-destructive rounded hover:bg-destructive/30"
                      >
                        Usuń
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
