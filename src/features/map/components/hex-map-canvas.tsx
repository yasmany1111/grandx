import { useCallback, useEffect, useRef, useState } from 'react';
import { getCountryByTag, HEX_MAP_DATA } from '../data/hex-world';
import { useHexMapInteraction } from '../hooks/use-hex-map-interaction';
import { getBorderColorForMode, getTileFill } from '../lib/hex-colors';
import {
	getHexCorners,
	HEX_SIZE,
	hexToPixel,
	pixelToHex,
} from '../lib/hex-grid';
import type { HexTile } from '../types';

export const HexMapCanvas = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

	const {
		mapMode,
		hoveredTileId,
		selectedTileId,
		setHoveredTile,
		setSelectedTile,
	} = useHexMapInteraction();

	// Calculate map bounds
	const mapBounds = useRef({ minX: 0, maxX: 0, minY: 0, maxY: 0 });

	useEffect(() => {
		let minX = Infinity;
		let maxX = -Infinity;
		let minY = Infinity;
		let maxY = -Infinity;

		for (const tile of HEX_MAP_DATA.tiles.values()) {
			const [x, y] = hexToPixel(tile.coord);
			minX = Math.min(minX, x);
			maxX = Math.max(maxX, x);
			minY = Math.min(minY, y);
			maxY = Math.max(maxY, y);
		}

		mapBounds.current = { minX, maxX, minY, maxY };

		// Center the map
		const centerX = (minX + maxX) / 2;
		const centerY = (minY + maxY) / 2;
		const canvas = canvasRef.current;
		if (canvas) {
			setViewOffset({
				x: canvas.width / 2 - centerX,
				y: canvas.height / 2 - centerY,
			});
		}
	}, []);

	// Render the map
	const renderMap = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Clear canvas
		ctx.fillStyle = '#020617'; // slate-950
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.save();
		ctx.translate(viewOffset.x, viewOffset.y);
		ctx.scale(zoom, zoom);

		const hexCorners = getHexCorners(HEX_SIZE);
		const borderColor = getBorderColorForMode(mapMode);

		// Render all tiles
		for (const tile of HEX_MAP_DATA.tiles.values()) {
			const [x, y] = hexToPixel(tile.coord);
			const owner = tile.ownerTag ? getCountryByTag(tile.ownerTag) : undefined;
			const fillColor = getTileFill(tile, mapMode, owner);

			const isHovered = tile.id === hoveredTileId;
			const isSelected = tile.id === selectedTileId;

			// Draw hexagon
			ctx.beginPath();
			hexCorners.forEach(([cx, cy], index) => {
				const px = x + cx;
				const py = y + cy;
				if (index === 0) {
					ctx.moveTo(px, py);
				} else {
					ctx.lineTo(px, py);
				}
			});
			ctx.closePath();

			// Fill
			ctx.fillStyle = fillColor;
			ctx.globalAlpha = isSelected ? 0.9 : isHovered ? 0.75 : 0.65;
			ctx.fill();

			// Border
			ctx.strokeStyle = isSelected ? '#f8fafc' : borderColor;
			ctx.lineWidth = isSelected ? 2.5 : 1;
			ctx.globalAlpha = isSelected ? 1 : 0.7;
			ctx.stroke();
		}

		ctx.restore();
	}, [viewOffset, zoom, mapMode, hoveredTileId, selectedTileId]);

	// Handle canvas resize
	useEffect(() => {
		const canvas = canvasRef.current;
		const container = containerRef.current;
		if (!canvas || !container) return;

		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;

			const { width, height } = entry.contentRect;
			canvas.width = width;
			canvas.height = height;
			renderMap();
		});

		resizeObserver.observe(container);
		return () => resizeObserver.disconnect();
	}, [renderMap]);

	// Render when dependencies change
	useEffect(() => {
		renderMap();
	}, [renderMap]);

	// Mouse interaction handlers
	const getCanvasMousePos = (
		e: React.MouseEvent<HTMLCanvasElement>,
	): [number, number] => {
		const canvas = canvasRef.current;
		if (!canvas) return [0, 0];

		const rect = canvas.getBoundingClientRect();
		const x = (e.clientX - rect.left - viewOffset.x) / zoom;
		const y = (e.clientY - rect.top - viewOffset.y) / zoom;
		return [x, y];
	};

	const getTileAtPosition = (x: number, y: number): HexTile | null => {
		const hexCoord = pixelToHex([x, y]);
		const tileId = `${hexCoord.q},${hexCoord.r}`;
		return HEX_MAP_DATA.tiles.get(tileId) || null;
	};

	const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (isDragging) {
			const dx = e.clientX - dragStart.x;
			const dy = e.clientY - dragStart.y;
			setViewOffset({
				x: viewOffset.x + dx,
				y: viewOffset.y + dy,
			});
			setDragStart({ x: e.clientX, y: e.clientY });
		} else {
			const [x, y] = getCanvasMousePos(e);
			const tile = getTileAtPosition(x, y);
			setHoveredTile(tile?.id || null);
		}
	};

	const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (e.button === 0) {
			// Left click
			const [x, y] = getCanvasMousePos(e);
			const tile = getTileAtPosition(x, y);
			setSelectedTile(tile?.id || null);
		} else if (e.button === 1 || e.button === 2) {
			// Middle or right click - start dragging
			setIsDragging(true);
			setDragStart({ x: e.clientX, y: e.clientY });
			e.preventDefault();
		}
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	const handleMouseLeave = () => {
		setHoveredTile(null);
		setIsDragging(false);
	};

	const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
		e.preventDefault();
		const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
		const newZoom = Math.max(0.5, Math.min(3, zoom * zoomFactor));
		setZoom(newZoom);
	};

	const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
		e.preventDefault();
	};

	return (
		<div ref={containerRef} className="h-full w-full">
			<canvas
				ref={canvasRef}
				onMouseMove={handleMouseMove}
				onMouseDown={handleMouseDown}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseLeave}
				onWheel={handleWheel}
				onContextMenu={handleContextMenu}
				className="cursor-grab active:cursor-grabbing"
			/>
		</div>
	);
};
