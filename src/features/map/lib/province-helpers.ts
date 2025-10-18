import {
	findCountryByTag,
	findProvinceById,
	findRegionByProvinceId,
	MOCK_MAP_DATA,
} from '../data/mock-world';
import type { Province, ProvinceSummaryViewModel } from '../types';

const DEVELOPMENT_THRESHOLDS: Array<{
	threshold: number;
	label: ProvinceSummaryViewModel['developmentTier'];
}> = [
	{ threshold: 75, label: 'metropolis' },
	{ threshold: 50, label: 'established' },
	{ threshold: 30, label: 'growing' },
];

export const getProvinceDevelopmentTier = (
	development: number,
): ProvinceSummaryViewModel['developmentTier'] => {
	for (const entry of DEVELOPMENT_THRESHOLDS) {
		if (development >= entry.threshold) {
			return entry.label;
		}
	}
	return 'nascent';
};

export const getProvinceSummary = (
	provinceId: string | null,
): ProvinceSummaryViewModel | null => {
	if (!provinceId) {
		return null;
	}

	const province = findProvinceById(provinceId);
	if (!province) {
		return null;
	}

	const owner =
		findCountryByTag(province.ownerTag) ??
		MOCK_MAP_DATA.countries.find(
			(country) => country.tag === province.ownerTag,
		);
	const controller =
		findCountryByTag(province.controllerTag) ??
		MOCK_MAP_DATA.countries.find(
			(country) => country.tag === province.controllerTag,
		);
	const region = findRegionByProvinceId(province.id);

	return {
		province,
		owner,
		controller,
		region,
		developmentTier: getProvinceDevelopmentTier(province.development),
	};
};

export const getProvinceNeighbors = (
	provinceId: string,
	provinces: Province[],
): Province[] => {
	const target = provinces.find((item) => item.id === provinceId);
	if (!target) {
		return [];
	}
	return provinces.filter((candidate) =>
		target.neighbors.includes(candidate.id),
	);
};
