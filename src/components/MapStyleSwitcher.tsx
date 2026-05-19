import { Map as MapIcon, Satellite } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/index';
import { useTranslation } from '@/i18n/useTranslation';

export const MapStyleSwitcher = () => {
  const mapStyle = useAppStore((state) => state.mapStyle);
  const setMapStyle = useAppStore((state) => state.setMapStyle);
  const t = useTranslation();

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card/85 px-2 py-1.5 backdrop-blur-md shadow-lg shadow-black/20">
      <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
        {t.mapStyle.label}
      </span>
      <div className="inline-flex overflow-hidden rounded-md border border-border">
        <Button
          type="button"
          variant={mapStyle === 'street' ? 'default' : 'ghost'}
          onClick={() => setMapStyle('street')}
          aria-pressed={mapStyle === 'street'}
          className={`rounded-none px-3 py-1.5 text-[10px] tracking-widest uppercase ${
            mapStyle === 'street' ? '' : 'hover:bg-accent'
          }`}
          title={t.mapStyle.street}
        >
          <MapIcon className="mr-1.5 size-3.5" />
          {t.mapStyle.street}
        </Button>
        <Button
          type="button"
          variant={mapStyle === 'satellite' ? 'default' : 'ghost'}
          onClick={() => setMapStyle('satellite')}
          aria-pressed={mapStyle === 'satellite'}
          className={`rounded-none border-l border-border px-3 py-1.5 text-[10px] tracking-widest uppercase ${
            mapStyle === 'satellite' ? '' : 'hover:bg-accent'
          }`}
          title={t.mapStyle.satellite}
        >
          <Satellite className="mr-1.5 size-3.5" />
          {t.mapStyle.satellite}
        </Button>
      </div>
    </div>
  );
};
