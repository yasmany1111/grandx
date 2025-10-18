import { Building2, LineChart, Users, Wheat } from 'lucide-react';

import { useMapInteraction } from '../hooks/use-map-interaction';
import { getProvinceSummary } from '../lib/province-helpers';

const DETAILS_EMPTY_STATE = (
	<div className="flex w-96 flex-col items-center justify-center rounded-3xl border border-slate-800/70 bg-slate-950/80 p-6 text-center shadow-xl shadow-slate-950/60">
		<p className="text-sm font-medium text-slate-400">
			Select a province to inspect its profile.
		</p>
		<p className="mt-2 text-xs text-slate-500">
			Tip: toggle map modes to explore political, economic, and diplomatic
			layers.
		</p>
	</div>
);

const formatNumber = (value: number): string => value.toLocaleString();

export const ProvincePanel = () => {
	const { selectedProvinceId } = useMapInteraction();
	const summary = getProvinceSummary(selectedProvinceId);

	if (!summary) {
		return DETAILS_EMPTY_STATE;
	}

	const { province, owner, controller, region } = summary;

	return (
		<div className="flex w-96 flex-col gap-4 rounded-3xl border border-slate-800/70 bg-slate-950/85 p-6 shadow-xl shadow-slate-950/70 backdrop-blur">
			<header className="flex items-start justify-between">
				<div>
					<p className="text-xs uppercase tracking-widest text-slate-500">
						Province
					</p>
					<h2 className="text-2xl font-semibold text-slate-100">
						{province.name}
					</h2>
					<p className="text-xs text-slate-400">
						Region: {region?.name ?? 'Unassigned'}
					</p>
				</div>
				<div className="flex flex-col items-end gap-1 text-right">
					<span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
						Controller
					</span>
					<p className="rounded-full border border-slate-800/70 bg-slate-900/80 px-3 py-1 text-sm font-medium text-slate-200">
						{controller?.name ?? 'Unoccupied'}
					</p>
					{owner && owner.tag !== controller?.tag ? (
						<span className="text-xs text-rose-400/80">Occupied territory</span>
					) : null}
				</div>
			</header>
			<section className="grid grid-cols-2 gap-3 text-slate-200">
				<div className="flex flex-col gap-1 rounded-2xl border border-slate-900/70 bg-slate-900/60 p-3">
					<span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
						<Users className="h-4 w-4 text-slate-400" /> Population
					</span>
					<span className="text-lg font-semibold text-slate-100">
						{formatNumber(province.population)}
					</span>
					<p className="text-xs text-slate-500">
						Diverse workforce supporting local industries.
					</p>
				</div>
				<div className="flex flex-col gap-1 rounded-2xl border border-slate-900/70 bg-slate-900/60 p-3">
					<span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
						<Wheat className="h-4 w-4 text-sky-300" /> Supply limit
					</span>
					<span className="text-lg font-semibold text-slate-100">
						{province.supplyLimit}
					</span>
					<p className="text-xs text-slate-500">
						Supports {province.supplyLimit * 1000} men before attrition.
					</p>
				</div>
				<div className="flex flex-col gap-1 rounded-2xl border border-slate-900/70 bg-slate-900/60 p-3">
					<span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
						<LineChart className="h-4 w-4 text-amber-300" /> Development
					</span>
					<span className="text-lg font-semibold text-slate-100">
						{province.development}
					</span>
					<p className="text-xs text-slate-500">
						Currently classified as {summary.developmentTier} hub.
					</p>
				</div>
				<div className="flex flex-col gap-1 rounded-2xl border border-slate-900/70 bg-slate-900/60 p-3">
					<span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
						<Building2 className="h-4 w-4 text-violet-300" /> Strategic notes
					</span>
					<span className="text-sm text-slate-300">
						{province.terrain === 'mountain'
							? 'Mountain fort candidate; excellent choke point.'
							: province.terrain === 'coast'
								? 'Coastal trade hub with naval access.'
								: 'Invest in civilian industry to unlock tier-II production.'}
					</span>
				</div>
			</section>
			<footer className="rounded-2xl border border-slate-900/70 bg-slate-900/50 p-4 text-xs text-slate-400">
				<span className="font-semibold uppercase tracking-wider text-slate-500">
					Diplomatic context:
				</span>
				<p className="mt-2 leading-5">
					{owner
						? `${owner.name} considers ${province.name} a core territory. Maintaining stability here improves national legitimacy.`
						: `${province.name} sits outside formal national structures.`}
				</p>
			</footer>
		</div>
	);
};
