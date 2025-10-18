import { getCountryByTag, getTileById } from '../data/hex-world';
import type { TileSummaryViewModel } from '../types';

export const getTileSummary = (
	tileId: string | null,
): TileSummaryViewModel | null => {
	if (!tileId) {
		return null;
	}

	const tile = getTileById(tileId);
	if (!tile) {
		return null;
	}

	const owner = tile.ownerTag ? getCountryByTag(tile.ownerTag) : undefined;
	const controller = tile.controllerTag
		? getCountryByTag(tile.controllerTag)
		: undefined;

	return {
		tile,
		owner,
		controller,
	};
};
