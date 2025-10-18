import { DollarSign, Globe, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useHexMapInteraction } from '../hooks/use-hex-map-interaction';

interface CountryData {
	ADMIN: string;
	ISO_A2: string;
	POP_EST: number;
	GDP_MD_EST: number;
	CONTINENT: string;
}

export const MapHud = () => {
	const { hoveredTileId, mapMode } = useHexMapInteraction();
	const [countryData, setCountryData] = useState<CountryData | null>(null);

	useEffect(() => {
		if (!hoveredTileId) {
			setCountryData(null);
			return;
		}

		// Fetch country data
		fetch('/src/assets/datasets/baisc.geojson')
			.then((res) => res.json())
			.then((data) => {
				const country = data.features.find(
					(f: any) => f.properties.ISO_A2 === hoveredTileId,
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
	}, [hoveredTileId]);

	return (
		<div className="flex items-start gap-4">
			<div className="flex w-80 flex-col gap-2 rounded-3xl border border-slate-800/70 bg-slate-950/85 p-4 text-xs text-slate-300 shadow-lg shadow-slate-950/60">
				<span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">
					Hovered Country
				</span>
				{countryData ? (
					<>
						<p className="text-base font-semibold text-slate-100">
							{countryData.ADMIN} ({countryData.ISO_A2})
						</p>
						<p className="text-[11px] uppercase tracking-widest text-slate-500">
							{countryData.CONTINENT} · {mapMode.toUpperCase()}
						</p>
						<div className="mt-2 grid grid-cols-2 gap-2">
							<div className="flex items-center gap-2 rounded-2xl border border-slate-900/70 bg-slate-900/60 px-3 py-2">
								<Users className="h-4 w-4 text-slate-400" />
								<span>{countryData.POP_EST.toLocaleString()}</span>
							</div>
							<div className="flex items-center gap-2 rounded-2xl border border-slate-900/70 bg-slate-900/60 px-3 py-2">
								<DollarSign className="h-4 w-4 text-green-300" />
								<span>${countryData.GDP_MD_EST.toLocaleString()}M</span>
							</div>
							<div className="col-span-2 flex items-center gap-2 rounded-2xl border border-slate-900/70 bg-slate-900/60 px-3 py-2">
								<Globe className="h-4 w-4 text-blue-300" />
								<span>{countryData.CONTINENT}</span>
							</div>
						</div>
					</>
				) : (
					<p className="text-slate-500">
						Pan across the globe to see country information.
					</p>
				)}
			</div>
			<div className="flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/85 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-400 shadow-inner shadow-slate-950/60">
				<span>View Mode</span>
				<span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-200">
					{mapMode.toUpperCase()}
				</span>
			</div>
		</div>
	);
};
