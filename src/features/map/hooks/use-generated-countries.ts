import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	type GeneratedCountry,
	type GeneratedProvince,
	generateCountries,
} from '../lib/country-generator';

export type ResolvedProvince = GeneratedProvince & { countryId: string | null };

let cachedCountries: GeneratedCountry[] | null = null;
const oceanProvinceRegistry = new Map<string, ResolvedProvince>();

export const useGeneratedCountries = (
	gridRadius: number = 16,
	numCountries: number = 20,
) => {
	const [countries, setCountries] = useState<GeneratedCountry[]>([]);

	useEffect(() => {
		if (cachedCountries) {
			setCountries(cachedCountries);
		} else {
			const generated = generateCountries(gridRadius, numCountries);
			cachedCountries = generated;
			setCountries(generated);
		}
	}, [gridRadius, numCountries]);

	const getCountryById = (id: string | null): GeneratedCountry | null => {
		if (!id) return null;
		return countries.find((c) => c.id === id) || null;
	};

	const provinceIndex = useMemo(() => {
		const index = new Map<string, ResolvedProvince>();
		for (const country of countries) {
			for (const province of country.territories) {
				index.set(province.id, { ...province, countryId: country.id });
			}
		}
		return index;
	}, [countries]);

	const registerOceanProvince = useCallback(
		(
			province: GeneratedProvince & { countryId?: string | null },
		): ResolvedProvince => {
			const identifier = province.id;
			const existing = oceanProvinceRegistry.get(identifier);
			if (existing) {
				return existing;
			}
			const stored: ResolvedProvince = { ...province, countryId: null };
			oceanProvinceRegistry.set(identifier, stored);
			return stored;
		},
		[],
	);

	const getProvinceById = (id: string | null): ResolvedProvince | null => {
		if (!id) return null;
		return provinceIndex.get(id) ?? oceanProvinceRegistry.get(id) ?? null;
	};

	return { countries, getCountryById, getProvinceById, registerOceanProvince };
};
