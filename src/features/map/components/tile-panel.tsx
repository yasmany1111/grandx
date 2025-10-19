import { Building2, DollarSign, MapPin, Users } from 'lucide-react';
import { useGeneratedCountries } from '../hooks/use-generated-countries';
import { useHexMapInteraction } from '../hooks/use-hex-map-interaction';

const DETAILS_EMPTY_STATE = (
	<div className="flex w-96 flex-col items-center justify-center rounded-r-3xl border border-slate-800/70 bg-slate-950/80 p-6 text-center shadow-xl shadow-slate-950/60">
		<p className="text-sm font-medium text-slate-400">
			Select a country to inspect its profile.
		</p>
		<p className="mt-2 text-xs text-slate-500">
			Tip: toggle map modes to explore different visualizations.
		</p>
	</div>
);

const formatNumber = (value: number): string => value.toLocaleString();

export const TilePanel = () => {
	const { selectedTileId } = useHexMapInteraction();
	const { getCountryById } = useGeneratedCountries();
	const country = getCountryById(selectedTileId);

	if (!country) {
		return DETAILS_EMPTY_STATE;
	}

	return (
		<div className="flex w-96 flex-col gap-4 rounded-r-3xl border border-slate-800/70 bg-slate-950/85 p-6 shadow-xl shadow-slate-950/70 backdrop-blur">
			<header className="flex items-start justify-between">
				<div>
					<p className="text-xs uppercase tracking-widest text-slate-500">
						Country
					</p>
					<h2 className="text-2xl font-semibold text-slate-100">
						{country.name}
					</h2>
					<p className="text-xs text-slate-400">{country.id}</p>
				</div>
				<div className="flex flex-col items-end gap-1 text-right">
					<span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
						Government
					</span>
					<p className="rounded-full border border-slate-800/70 bg-slate-900/80 px-3 py-1 text-sm font-medium text-slate-200">
						{country.government}
					</p>
				</div>
			</header>

			<section className="grid grid-cols-2 gap-3 text-slate-200">
				<div className="flex flex-col gap-1 rounded-2xl border border-slate-900/70 bg-slate-900/60 p-3">
					<span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
						<Users className="h-4 w-4 text-slate-400" /> Population
					</span>
					<span className="text-lg font-semibold text-slate-100">
						{formatNumber(country.population)}
					</span>
					<p className="text-xs text-slate-500">Total inhabitants</p>
				</div>

				<div className="flex flex-col gap-1 rounded-2xl border border-slate-900/70 bg-slate-900/60 p-3">
					<span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
						<DollarSign className="h-4 w-4 text-green-300" /> GDP
					</span>
					<span className="text-lg font-semibold text-slate-100">
						${formatNumber(Math.floor(country.gdp / 1000000))}M
					</span>
					<p className="text-xs text-slate-500">Gross Domestic Product</p>
				</div>

				<div className="flex flex-col gap-1 rounded-2xl border border-slate-900/70 bg-slate-900/60 p-3">
					<span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
						<MapPin className="h-4 w-4 text-blue-300" /> Territories
					</span>
					<span className="text-lg font-semibold text-slate-100">
						{country.hexIds.length}
					</span>
					<p className="text-xs text-slate-500">Controlled provinces</p>
				</div>

				<div className="flex flex-col gap-1 rounded-2xl border border-slate-900/70 bg-slate-900/60 p-3">
					<span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
						<Building2 className="h-4 w-4 text-violet-300" /> Capital
					</span>
					<span className="text-sm font-semibold text-slate-100">
						{country.capital || 'Unknown'}
					</span>
					<p className="text-xs text-slate-500">National capital</p>
				</div>
			</section>

			<footer className="rounded-2xl border border-slate-900/70 bg-slate-900/50 p-4 text-xs text-slate-400">
				<span className="font-semibold uppercase tracking-wider text-slate-500">
					National Statistics:
				</span>
				<div className="mt-2 space-y-1 leading-5">
					<p>
						GDP per capita:{' '}
						<span className="text-slate-200">
							${formatNumber(Math.floor(country.gdp / country.population))}
						</span>
					</p>
					<p>
						Avg. territory pop:{' '}
						<span className="text-slate-200">
							{formatNumber(
								Math.floor(country.population / country.hexIds.length),
							)}
						</span>
					</p>
				</div>
			</footer>
		</div>
	);
};
