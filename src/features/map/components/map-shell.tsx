import { D3HexMap } from './d3-hex-map';
import { MapEventFeed } from './map-event-feed';
import { MapHud } from './map-hud';
import { MapLegend } from './map-legend';
import { MapModeToolbar } from './map-mode-toolbar';
import { MapTopBar } from './map-top-bar';
import { TilePanel } from './tile-panel';

export const MapShell = () => {
	return (
		<div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
			<div className="absolute inset-0">
				<D3HexMap />
			</div>
			<div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.12),transparent_60%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.15),transparent_55%)]" />
			<div className="pointer-events-none absolute inset-0 z-10">
				<div className="absolute left-0 top-0 h-full w-48 bg-gradient-to-r from-slate-950/80 via-slate-950/20 to-transparent" />
				<div className="absolute right-0 top-0 h-full w-48 bg-gradient-to-l from-slate-950/80 via-slate-950/20 to-transparent" />
			</div>
			<div className="pointer-events-none absolute inset-0 z-20">
				<div className="pointer-events-auto absolute left-1/2 top-8 flex w-full max-w-5xl -translate-x-1/2 justify-center px-6">
					<MapTopBar />
				</div>
				<div className="pointer-events-auto absolute left-8 top-32">
					<MapHud />
				</div>
				<div className="pointer-events-auto absolute left-8 top-1/2 flex -translate-y-1/2 flex-col gap-4">
					<MapModeToolbar />
					<MapLegend />
				</div>
				<div className="pointer-events-auto absolute right-8 top-1/2 -translate-y-1/2">
					<TilePanel />
				</div>
				<div className="pointer-events-auto absolute inset-x-0 bottom-8 flex justify-center px-6">
					<MapEventFeed />
				</div>
			</div>
		</div>
	);
};
