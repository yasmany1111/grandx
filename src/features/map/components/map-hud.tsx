import { DollarSign, Globe, Users } from 'lucide-react';
import { useGeneratedCountries } from '../hooks/use-generated-countries';
import { useHexMapInteraction } from '../hooks/use-hex-map-interaction';

export const MapHud = () => {
	const { hoveredTileId, mapMode } = useHexMapInteraction();
	const { getCountryById } = useGeneratedCountries();
	const country = getCountryById(hoveredTileId);

	return (
		<div className="flex items-start gap-4">
			<div className="flex w-80 flex-col gap-2 rounded-tr-3xl border border-slate-800/70 bg-slate-950/85 p-4 text-xs text-slate-300 shadow-lg shadow-slate-950/60">
				<span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">
					Hovered Country
				</span>
				{country ? (
					<>
						<p className="text-base font-semibold text-slate-100">
							{country.name}
						</p>
						<p className="text-[11px] uppercase tracking-widest text-slate-500">
							{country.government} · {mapMode.toUpperCase()}
						</p>
						<div className="mt-2 grid grid-cols-2 gap-2">
							<div className="flex items-center gap-2 rounded-2xl border border-slate-900/70 bg-slate-900/60 px-3 py-2">
								<Users className="h-4 w-4 text-slate-400" />
								<span>{country.population.toLocaleString()}</span>
							</div>
							<div className="flex items-center gap-2 rounded-2xl border border-slate-900/70 bg-slate-900/60 px-3 py-2">
								<DollarSign className="h-4 w-4 text-green-300" />
								<span>${(country.gdp / 1000000).toFixed(1)}M</span>
							</div>
							<div className="col-span-2 flex items-center gap-2 rounded-2xl border border-slate-900/70 bg-slate-900/60 px-3 py-2">
								<Globe className="h-4 w-4 text-blue-300" />
								<span>{country.hexIds.length} territories</span>
							</div>
						</div>
					</>
				) : (
					<p className="text-slate-500">
						Pan across the globe to see country information.
					</p>
				)}
			</div>
		</div>
	);
};
