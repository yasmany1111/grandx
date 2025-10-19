import { DollarSign, Globe, MapPin, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useGeneratedCountries } from '../hooks/use-generated-countries';
import { useHexMapInteraction } from '../hooks/use-hex-map-interaction';
import { useMapInteraction } from '../hooks/use-map-interaction';

const formatCurrency = (value: number): string => {
	if (value >= 1_000_000_000) {
		return `$${(value / 1_000_000_000).toFixed(1)}B`;
	}
	return `$${(value / 1_000_000).toFixed(1)}M`;
};

const TERRAIN_LABELS: Record<string, string> = {
	ocean: 'Ocean',
	coast: 'Coast',
	plains: 'Plains',
	forest: 'Forest',
	mountain: 'Mountains',
	desert: 'Desert',
};

export const MapHud = () => {
	const { hoveredTileId, mapMode } = useHexMapInteraction();
	const { hoveredProvinceId, selectedProvinceId } = useMapInteraction();
	const { getCountryById, getProvinceById } = useGeneratedCountries();
	const country = getCountryById(hoveredTileId);
	const province = useMemo(() => {
		const candidateId = hoveredProvinceId ?? selectedProvinceId ?? null;
		if (!candidateId) {
			return null;
		}
		const candidate = getProvinceById(candidateId);
		if (!candidate) {
			return null;
		}
		if (country && candidate.countryId !== country.id) {
			return null;
		}
		return candidate;
	}, [country, getProvinceById, hoveredProvinceId, selectedProvinceId]);

	return (
		<div className="flex items-start gap-4">
			<div className="flex w-80 flex-col gap-2 rounded-tr-3xl border border-slate-800/70 bg-slate-950/85 p-4 text-xs text-slate-300 shadow-lg shadow-slate-950/60">
				<span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">
					Hovered Region
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
								<span>{formatCurrency(country.gdp)}</span>
							</div>
							<div className="col-span-2 flex items-center gap-2 rounded-2xl border border-slate-900/70 bg-slate-900/60 px-3 py-2">
								<Globe className="h-4 w-4 text-blue-300" />
								<span>
									{country.territories.length} territories · Avg dev{' '}
									{country.averageDevelopment}
								</span>
							</div>
							{province ? (
								<div className="col-span-2 flex items-center gap-2 rounded-2xl border border-slate-900/70 bg-slate-900/60 px-3 py-2">
									<MapPin className="h-4 w-4 text-violet-300" />
									<span>
										Province: {province.name} ·{' '}
										{TERRAIN_LABELS[province.terrain] ?? province.terrain} · Pop{' '}
										{province.population.toLocaleString()}
									</span>
								</div>
							) : null}
						</div>
					</>
				) : province ? (
					<div className="flex flex-col gap-2 text-slate-300">
						<p className="text-base font-semibold text-slate-100">
							{province.name}
						</p>
						<p className="text-[11px] uppercase tracking-widest text-slate-500">
							Unclaimed Waters · {mapMode.toUpperCase()}
						</p>
						<div className="mt-2 grid grid-cols-1 gap-2">
							<div className="flex items-center gap-2 rounded-2xl border border-slate-900/70 bg-slate-900/60 px-3 py-2">
								<Globe className="h-4 w-4 text-blue-300" />
								<span>
									{TERRAIN_LABELS[province.terrain] ?? province.terrain} · Depth{' '}
									{province.elevation} fathoms
								</span>
							</div>
							<div className="flex items-center gap-2 rounded-2xl border border-slate-900/70 bg-slate-900/60 px-3 py-2">
								<MapPin className="h-4 w-4 text-violet-300" />
								<span>
									Shipping lanes steady · Activity {province.development}%
								</span>
							</div>
						</div>
					</div>
				) : (
					<p className="text-slate-500">
						Pan across the globe to see country information.
					</p>
				)}
			</div>
		</div>
	);
};
