import { Activity, Building2, Compass, DollarSign, MapPin, Users, Waves } from 'lucide-react';
import type { ReactNode } from 'react';
import { useGeneratedCountries } from '../hooks/use-generated-countries';
import { useHexMapInteraction } from '../hooks/use-hex-map-interaction';
import { useMapInteraction } from '../hooks/use-map-interaction';

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

const formatCurrency = (value: number): string => {
	if (value >= 1_000_000_000) {
		return `$${(value / 1_000_000_000).toFixed(1)}B`;
	}
	return `$${Math.round(value / 1_000_000)}M`;
};

const TERRAIN_LABELS: Record<string, string> = {
	ocean: 'Ocean',
	coast: 'Coast',
	plains: 'Plains',
	forest: 'Forest',
	mountain: 'Mountains',
	desert: 'Desert',
};

const buildTerrainSummary = (
	breakdown: Record<string, number>,
): string => {
	const entries = Object.entries(breakdown)
		.filter(([terrain, count]) => terrain !== 'ocean' && count > 0)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([terrain, count]) => {
			const label = TERRAIN_LABELS[terrain] ?? terrain;
			return `${label} (${count})`;
	});
	return entries.length > 0 ? entries.join(', ') : 'Mixed terrain';
};

interface CardConfig {
	icon: ReactNode;
	label: string;
	value: string;
	hint?: string;
}

const describeTraffic = (activity: number): string => {
	if (activity < 20) return 'Calm';
	if (activity < 45) return 'Steady';
	if (activity < 70) return 'Busy';
	return 'Crowded';
};

const describeSeaState = (depth: number): string => {
	if (depth < 200) return 'Shallow coastal shelf';
	if (depth < 800) return 'Continental slope waters';
	return 'Deep blue water';
};

export const TilePanel = () => {
	const { selectedTileId } = useHexMapInteraction();
	const { selectedProvinceId, hoveredProvinceId } = useMapInteraction();
	const { getCountryById, getProvinceById } = useGeneratedCountries();

	const candidateProvinceId = selectedProvinceId ?? hoveredProvinceId ?? null;
	const provinceCandidate = candidateProvinceId ? getProvinceById(candidateProvinceId) : null;

	const selectedCountry = getCountryById(selectedTileId);
	const owningCountry =
		provinceCandidate?.countryId != null ? getCountryById(provinceCandidate.countryId) : null;
	const activeCountry = selectedCountry ?? owningCountry ?? null;

	const provinceMatchesCountry =
		activeCountry && provinceCandidate && provinceCandidate.countryId === activeCountry.id;
	const isStandaloneOcean =
		!activeCountry && provinceCandidate?.terrain === 'ocean';

	const activeProvince =
		provinceMatchesCountry || isStandaloneOcean ? provinceCandidate : null;

	if (!activeCountry && !activeProvince) {
		return DETAILS_EMPTY_STATE;
	}

	const renderStatCard = (
		card: CardConfig,
		variant: 'summary' | 'province' = 'summary',
		key?: string,
	) => (
		<div
			key={key ?? card.label}
			className="flex flex-col gap-1 rounded-2xl border border-slate-900/70 bg-slate-900/60 p-3"
		>
			<span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
				{card.icon}
				{card.label}
			</span>
			<span
				className={`${
					variant === 'summary' ? 'text-lg' : 'text-base'
				} font-semibold text-slate-100`}
			>
				{card.value}
			</span>
			{card.hint ? <p className="text-xs text-slate-500">{card.hint}</p> : null}
		</div>
	);

	const landTerritories =
		activeCountry?.territories.filter((province) => province.terrain !== 'ocean') ?? [];
	const territoryCount = activeCountry ? landTerritories.length : 0;
	const avgSupplyLimit =
		activeCountry && territoryCount > 0
			? Math.round(activeCountry.supplyCapacity / territoryCount)
			: 0;
	const totalSupplyTroops = activeCountry ? activeCountry.supplyCapacity * 1000 : 0;
	const gdpPerCapita =
		activeCountry && activeCountry.population > 0
			? activeCountry.gdp / activeCountry.population
			: 0;
	const terrainSummary = activeCountry
		? buildTerrainSummary(activeCountry.terrainBreakdown)
		: 'Open water';
	const oceanActivity =
		activeProvince?.terrain === 'ocean' ? activeProvince.development : 0;
	const oceanDepth =
		activeProvince?.terrain === 'ocean' ? activeProvince.elevation : 0;

	const summaryCards: CardConfig[] = activeCountry
		? [
				{
					icon: <Users className="h-4 w-4 text-slate-400" />,
					label: 'Population',
					value: formatNumber(activeCountry.population),
					hint: 'Total inhabitants',
				},
				{
					icon: <DollarSign className="h-4 w-4 text-green-300" />,
					label: 'GDP',
					value: formatCurrency(activeCountry.gdp),
					hint: 'Gross Domestic Product',
				},
				{
					icon: <MapPin className="h-4 w-4 text-blue-300" />,
					label: 'Territories',
					value: `${territoryCount}`,
					hint:
						territoryCount > 0
							? `Avg supply limit · ${avgSupplyLimit}k troops`
							: 'No land holdings recorded',
				},
				{
					icon: <Building2 className="h-4 w-4 text-violet-300" />,
					label: 'Capital',
					value: activeCountry.capital || 'Unknown',
					hint: `Province ID: ${activeCountry.capitalProvinceId || '—'}`,
				},
		  ]
		: [
				{
					icon: <Waves className="h-4 w-4 text-blue-300" />,
					label: 'Status',
					value: 'Unclaimed waters',
					hint: 'No sovereign control; navigation rights open.',
				},
				{
					icon: <Activity className="h-4 w-4 text-emerald-300" />,
					label: 'Surface traffic',
					value: `${describeTraffic(oceanActivity)} · ${oceanActivity}% activity`,
					hint: 'Merchant convoys keep charts updated.',
				},
				{
					icon: <Compass className="h-4 w-4 text-slate-300" />,
					label: 'Depth',
					value: `${oceanDepth} fathoms`,
					hint: describeSeaState(oceanDepth),
				},
				{
					icon: <MapPin className="h-4 w-4 text-violet-300" />,
					label: 'Strategic note',
					value: 'Reserve for naval patrol zones',
					hint: 'Designate fisheries or refueling corridors as needed.',
				},
		  ];

	const provinceCards: CardConfig[] = activeProvince
		? activeProvince.terrain === 'ocean'
			? [
					{
						icon: <Waves className="h-4 w-4 text-blue-300" />,
						label: 'Status',
						value: 'International waters',
						hint: 'Charts maintained by hydrographic offices.',
					},
					{
						icon: <Activity className="h-4 w-4 text-emerald-300" />,
						label: 'Traffic index',
						value: `${activeProvince.development}%`,
						hint: `${describeTraffic(activeProvince.development)} shipping lanes.`,
					},
					{
						icon: <Compass className="h-4 w-4 text-slate-300" />,
						label: 'Depth',
						value: `${activeProvince.elevation} fathoms`,
						hint: describeSeaState(activeProvince.elevation),
					},
					{
						icon: <DollarSign className="h-4 w-4 text-green-300" />,
						label: 'Resource outlook',
						value: 'Stable yields',
						hint: 'Potential fisheries and offshore deposits.',
					},
			  ]
			: [
					{
						icon: <Users className="h-4 w-4 text-slate-400" />,
						label: 'Population',
						value: formatNumber(activeProvince.population),
						hint: 'Diverse workforce supporting local industries.',
					},
					{
						icon: <Activity className="h-4 w-4 text-amber-300" />,
						label: 'Development',
						value: `${activeProvince.development}`,
						hint: 'Current investment and infrastructure rating.',
					},
					{
						icon: <Building2 className="h-4 w-4 text-sky-300" />,
						label: 'Supply limit',
						value: `${activeProvince.supplyLimit}`,
						hint: `Supports ${formatNumber(activeProvince.supplyLimit * 1000)} troops before attrition.`,
					},
					{
						icon: <DollarSign className="h-4 w-4 text-green-300" />,
						label: 'Local GDP',
						value: formatCurrency(activeProvince.gdp),
						hint: 'Annual economic contribution.',
					},
			  ]
		: [];

	const headerLabel = activeCountry ? 'Country' : 'Ocean Region';
	const headerTitle = activeCountry
		? activeCountry.name
		: activeProvince?.name ?? 'Uncharted Waters';
	const headerSubline = activeCountry
		? activeCountry.id
		: TERRAIN_LABELS[activeProvince?.terrain ?? 'ocean'];
	const headerBadgeLabel = activeCountry ? 'Government' : 'Sovereignty';
	const headerBadgeValue = activeCountry ? activeCountry.government : 'International';

	const isProvinceSelected =
		activeProvince && activeProvince.id === selectedProvinceId;
	const provinceLabel =
		activeProvince?.terrain === 'ocean' ? 'Sea zone' : 'Province';

	return (
		<div className="flex w-96 flex-col gap-4 rounded-r-3xl border border-slate-800/70 bg-slate-950/85 p-6 shadow-xl shadow-slate-950/70 backdrop-blur">
			<header className="flex items-start justify-between">
				<div>
					<p className="text-xs uppercase tracking-widest text-slate-500">
						{headerLabel}
					</p>
					<h2 className="text-2xl font-semibold text-slate-100">{headerTitle}</h2>
					<p className="text-xs text-slate-400">{headerSubline}</p>
				</div>
				<div className="flex flex-col items-end gap-1 text-right">
					<span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
						{headerBadgeLabel}
					</span>
					<p className="rounded-full border border-slate-800/70 bg-slate-900/80 px-3 py-1 text-sm font-medium text-slate-200">
						{headerBadgeValue}
					</p>
				</div>
			</header>

			<section className="grid grid-cols-2 gap-3 text-slate-200">
				{summaryCards.map((card) =>
					renderStatCard(card, 'summary', `${card.label}-${card.value}`),
				)}
			</section>

			{activeProvince ? (
				<section className="flex flex-col gap-3 rounded-2xl border border-slate-900/70 bg-slate-900/60 p-4 text-slate-200">
					<header className="flex items-center justify-between">
						<div>
							<p className="text-xs uppercase tracking-widest text-slate-500">
								{provinceLabel}
							</p>
							<h3 className="text-xl font-semibold text-slate-100">
								{activeProvince.name}
							</h3>
							<p className="text-xs text-slate-400">
								{TERRAIN_LABELS[activeProvince.terrain] ?? activeProvince.terrain}
							</p>
						</div>
						<span
							className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wider ${
								isProvinceSelected
									? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
									: 'border-slate-700 bg-slate-800/80 text-slate-300'
							}`}
						>
							{isProvinceSelected ? 'Selected' : 'Hovered'}
						</span>
					</header>
					<div className="grid grid-cols-2 gap-3 text-sm">
						{provinceCards.map((card) =>
							renderStatCard(card, 'province', `${card.label}-${card.value}`),
						)}
					</div>
				</section>
			) : null}

			{activeCountry ? (
				<footer className="rounded-2xl border border-slate-900/70 bg-slate-900/50 p-4 text-xs text-slate-400">
					<span className="font-semibold uppercase tracking-wider text-slate-500">
						National Statistics:
					</span>
					<div className="mt-2 space-y-1 leading-5">
						<p>
							GDP per capita:{' '}
							<span className="text-slate-200">
								{formatCurrency(Math.round(gdpPerCapita))}
							</span>
						</p>
						<p>
							Avg. territory pop:{' '}
							<span className="text-slate-200">
								{territoryCount > 0
									? formatNumber(
											Math.floor(activeCountry.population / territoryCount),
										)
									: '—'}
							</span>
						</p>
						<p>
							Supply capacity:{' '}
							<span className="text-slate-200">
								{formatNumber(totalSupplyTroops)} troops
							</span>
						</p>
						<p>
							Terrain mix:{' '}
							<span className="text-slate-200">{terrainSummary}</span>
						</p>
						<p>
							Avg. development:{' '}
							<span className="text-slate-200">
								{activeCountry.averageDevelopment}
							</span>
						</p>
					</div>
				</footer>
			) : null}
		</div>
	);
};
