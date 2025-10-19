import { useEffect, useState } from 'react';
import {
	type GeneratedCountry,
	generateCountries,
} from '../lib/country-generator';

let cachedCountries: GeneratedCountry[] | null = null;

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

	return { countries, getCountryById };
};
