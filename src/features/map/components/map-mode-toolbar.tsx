import {
	Handshake,
	Layers,
	Mountain,
	TrendingUp,
	Warehouse,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';

import { MAP_MODES } from '../data/hex-world';
import { useHexMapInteraction } from '../hooks/use-hex-map-interaction';

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
	layers: Layers,
	mountain: Mountain,
	warehouse: Warehouse,
	'trending-up': TrendingUp,
	handshake: Handshake,
};

export const MapModeToolbar = () => {
	const { mapMode, setMapMode } = useHexMapInteraction();

	return (
		<section className="flex w-24 flex-col rounded-3xl border border-slate-800/70 bg-slate-950/85 p-4 shadow-lg shadow-slate-900/60 backdrop-blur">
			<span className="mb-3 text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">
				Modes
			</span>
			<nav className="flex flex-col gap-2">
				{MAP_MODES.map((mode) => {
					const Icon = ICONS[mode.icon];
					return (
						<button
							key={mode.id}
							type="button"
							onClick={() => setMapMode(mode.id)}
							className={cn(
								'group flex h-12 w-full flex-col items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-900/70 text-[11px] font-semibold uppercase tracking-wider text-slate-300 transition hover:border-slate-700 hover:bg-slate-900/90 hover:text-slate-50',
								mapMode === mode.id &&
									'border-sky-500/70 bg-slate-900/95 text-sky-100 shadow-lg shadow-sky-900/40',
							)}
						>
							{Icon ? (
								<Icon className="mb-1 h-5 w-5 text-slate-400 transition group-hover:text-sky-300" />
							) : null}
							<span>{mode.label.slice(0, 3)}</span>
						</button>
					);
				})}
			</nav>
		</section>
	);
};
