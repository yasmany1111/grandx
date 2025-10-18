import { Building2, DollarSign, Globe, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useHexMapInteraction } from '../hooks/use-hex-map-interaction';

interface CountryData {
	ADMIN: string;
	ISO_A2: string;
	ISO_A3: string;
	POP_EST: number;
	GDP_MD_EST: number;
	CONTINENT: string;
	REGION_UN: string;
	SUBREGION: string;
	ECONOMY: string;
	INCOME_GRP: string;
}

const DETAILS_EMPTY_STATE = (
	<div className="flex w-96 flex-col items-center justify-center rounded-3xl border border-slate-800/70 bg-slate-950/80 p-6 text-center shadow-xl shadow-slate-950/60">
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
	const [countryData, setCountryData] = useState<CountryData | null>(null);

	useEffect(() => {
		if (!selectedTileId) {
			setCountryData(null);
			return;
		}

		// Fetch country data
		fetch('/src/assets/datasets/baisc.geojson')
			.then((res) => res.json())
			.then((data) => {
				const country = data.features.find(
					(f: any) => f.properties.ISO_A2 === selectedTileId,
				);
				if (country) {
					setCountryData(country.properties);
				} else {
					setCountryData(null);
				}
			})
			.catch((error) => {
				console.error('Error loading country data:', error);
				setCountryData(null);
			});
	}, [selectedTileId]);

	if (!countryData) {
		return DETAILS_EMPTY_STATE;
	}

	return (
		<div className="flex w-96 flex-col gap-4 rounded-3xl border border-slate-800/70 bg-slate-950/85 p-6 shadow-xl shadow-slate-950/70 backdrop-blur">
			<header className="flex items-start justify-between">
				<div>
					<p className="text-xs uppercase tracking-widest text-slate-500">
						Country
					</p>
					<h2 className="text-2xl font-semibold text-slate-100">
						{countryData.ADMIN}
					</h2>
					<p className="text-xs text-slate-400">
						{countryData.ISO_A2} • {countryData.ISO_A3}
					</p>
				</div>
				<div className="flex flex-col items-end gap-1 text-right">
					<span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
						Region
					</span>
					<p className="rounded-full border border-slate-800/70 bg-slate-900/80 px-3 py-1 text-sm font-medium text-slate-200">
						{countryData.SUBREGION || countryData.CONTINENT}
					</p>
				</div>
			</header>

			<section className="grid grid-cols-2 gap-3 text-slate-200">
				<div className="flex flex-col gap-1 rounded-2xl border border-slate-900/70 bg-slate-900/60 p-3">
					<span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
						<Users className="h-4 w-4 text-slate-400" /> Population
					</span>
					<span className="text-lg font-semibold text-slate-100">
						{formatNumber(countryData.POP_EST)}
					</span>
					<p className="text-xs text-slate-500">Estimated population (2017)</p>
				</div>

				<div className="flex flex-col gap-1 rounded-2xl border border-slate-900/70 bg-slate-900/60 p-3">
					<span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
						<DollarSign className="h-4 w-4 text-green-300" /> GDP
					</span>
					<span className="text-lg font-semibold text-slate-100">
						${formatNumber(countryData.GDP_MD_EST)}M
					</span>
					<p className="text-xs text-slate-500">GDP estimate (2016)</p>
				</div>

				<div className="flex flex-col gap-1 rounded-2xl border border-slate-900/70 bg-slate-900/60 p-3">
					<span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
						<Globe className="h-4 w-4 text-blue-300" /> Continent
					</span>
					<span className="text-sm font-semibold text-slate-100">
						{countryData.CONTINENT}
					</span>
					<p className="text-xs text-slate-500">{countryData.REGION_UN}</p>
				</div>

				<div className="flex flex-col gap-1 rounded-2xl border border-slate-900/70 bg-slate-900/60 p-3">
					<span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
						<Building2 className="h-4 w-4 text-violet-300" /> Economy
					</span>
					<span className="text-xs font-semibold text-slate-100">
						{countryData.ECONOMY?.replace(/^\d+\.\s*/, '') || 'N/A'}
					</span>
					<p className="text-xs text-slate-500">
						{countryData.INCOME_GRP?.replace(/^\d+\.\s*/, '') || 'N/A'}
					</p>
				</div>
			</section>

			{countryData.ECONOMY && (
				<footer className="rounded-2xl border border-slate-900/70 bg-slate-900/50 p-4 text-xs text-slate-400">
					<span className="font-semibold uppercase tracking-wider text-slate-500">
						Economic Classification:
					</span>
					<p className="mt-2 leading-5">{countryData.ECONOMY}</p>
				</footer>
			)}
		</div>
	);
};
