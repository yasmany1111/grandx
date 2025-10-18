import { Flame, Gem, Shield, Users } from 'lucide-react';

import { useMapInteraction } from '../hooks/use-map-interaction';
import { getProvinceSummary } from '../lib/province-helpers';

export const MapHud = () => {
	const { hoveredProvinceId, mapMode } = useMapInteraction();
	const summary = getProvinceSummary(hoveredProvinceId);

	return (
		<div className="flex items-start gap-4">
			<div className="flex w-80 flex-col gap-2 rounded-3xl border border-slate-800/70 bg-slate-950/85 p-4 text-xs text-slate-300 shadow-lg shadow-slate-950/60">
				<span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">
					Hovered Province
				</span>
				{summary ? (
					<>
						<p className="text-base font-semibold text-slate-100">{summary.province.name}</p>
						<p className="text-[11px] uppercase tracking-widest text-slate-500">
							{summary.owner?.name ?? 'Unclaimed'} · {mapMode.toUpperCase()}
						</p>
						<div className="mt-2 grid grid-cols-2 gap-2">
							<div className="flex items-center gap-2 rounded-2xl border border-slate-900/70 bg-slate-900/60 px-3 py-2">
								<Users className="h-4 w-4 text-slate-400" />
								<span>{summary.province.population.toLocaleString()}</span>
							</div>
							<div className="flex items-center gap-2 rounded-2xl border border-slate-900/70 bg-slate-900/60 px-3 py-2">
								<Shield className="h-4 w-4 text-sky-300" />
								<span>Supply {summary.province.supplyLimit}</span>
							</div>
							<div className="flex items-center gap-2 rounded-2xl border border-slate-900/70 bg-slate-900/60 px-3 py-2">
								<Gem className="h-4 w-4 text-amber-300" />
								<span>Dev {summary.province.development}</span>
							</div>
							<div className="flex items-center gap-2 rounded-2xl border border-slate-900/70 bg-slate-900/60 px-3 py-2">
								<Flame className="h-4 w-4 text-rose-300" />
								<span>{summary.developmentTier}</span>
							</div>
						</div>
					</>
				) : (
					<p className="text-slate-500">Pan across the map to surface province intel cards.</p>
				)}
			</div>
			<div className="flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/85 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-400 shadow-inner shadow-slate-950/60">
				<span>Fog of War</span>
				<span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-200">ON</span>
			</div>
		</div>
	);
};
