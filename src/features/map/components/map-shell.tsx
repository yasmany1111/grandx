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
			<div className="pointer-events-none absolute inset-0 z-20">
				{/* Date header - top left, full width, no margins */}
				<div className="pointer-events-auto absolute left-0 top-0 w-full">
					<MapTopBar />
				</div>

				{/* Hovered country info - bottom left */}
				<div className="pointer-events-auto absolute bottom-0 left-0">
					<MapHud />
				</div>

				{/* Selection info - left middle */}
				<div className="pointer-events-auto absolute left-0 top-1/2 -translate-y-1/2">
					<TilePanel />
				</div>

				{/* Map modes - bottom right, no margins */}
				<div className="pointer-events-auto absolute bottom-0 right-0 flex flex-col gap-4">
					<MapLegend />
					<MapModeToolbar />
				</div>
			</div>
		</div>
	);
};
