import type {
	Country,
	MapConceptData,
	Province,
	ProvinceSummaryViewModel,
	Region,
} from '../types';

const DEVELOPMENT_THRESHOLDS: Array<{ threshold: number; label: ProvinceSummaryViewModel['developmentTier'] }> = [
	{ threshold: 75, label: 'metropolis' },
	{ threshold: 50, label: 'established' },
	{ threshold: 30, label: 'growing' },
];

export const getProvinceDevelopmentTier = (development: number): ProvinceSummaryViewModel['developmentTier'] => {
	for (const entry of DEVELOPMENT_THRESHOLDS) {
		if (development >= entry.threshold) {
			return entry.label;
		}
	}
	return 'nascent';
};

export const getProvinceSummary = (
	provinceId: string | null,
	data: MapConceptData,
): ProvinceSummaryViewModel | null => {
	if (!provinceId) {
		return null;
	}

	const province = data.provinces.find((item) => item.id === provinceId);
	if (!province) {
		return null;
	}

	const findCountry = (tag: string): Country | undefined =>
		data.countries.find((country) => country.tag === tag);

	const owner = findCountry(province.ownerTag);
	const controller = findCountry(province.controllerTag);
	const region = data.regions.find((item) => item.provinceIds.includes(province.id));

	return {
		province,
		owner,
		controller,
		region,
		developmentTier: getProvinceDevelopmentTier(province.development),
	};
};

export const getProvinceNeighbors = (provinceId: string, provinces: Province[]): Province[] => {
	const target = provinces.find((item) => item.id === provinceId);
	if (!target) {
		return [];
	}
	return provinces.filter((candidate) => target.neighbors.includes(candidate.id));
};

