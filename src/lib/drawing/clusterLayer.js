/**
 * Cluster layer drawing functions with Rough.js charcoal effect
 * Handles rendering of clustered shapes with hand-drawn, textured outlines
 */

import { createColorInterval } from './utils.js';

/**
 * Use a hash-based pseudo-random function for even distribution, deterministic for same input
 */
function pseudoRandom(x, y, seed = 0) {
  // Simple 2D hash, deterministic for same x, y, seed
  let n = Math.sin(x * 127.1 + y * 311.7 + seed * 101.3) * 43758.5453;
  return n - Math.floor(n); // [0,1)
}

/**
 * Check if a pixel belongs to a cluster with the target color index
 */
function isClusterPixel(pixel, x, y, xGrid, yGrid, targetColorIndex) {
  if (x < 0 || y < 0 || x >= xGrid || y >= yGrid) return false;
  const p = pixel[x][y];
  return p && Math.floor(p.colorIndex) === targetColorIndex;
}

/**
 * Find all connected pixels in a cluster using flood fill algorithm
 */
function getCluster(pixel, iX, iY, targetColorIndex, visited, xGrid, yGrid) {
  const stack = [{ x: iX, y: iY }];
  const cluster = [];

  while (stack.length) {
    const { x, y } = stack.pop();
    if (x < 0 || y < 0 || x >= xGrid || y >= yGrid) continue;
    if (visited[x][y] || !pixel[x][y]) continue;
    if (Math.floor(pixel[x][y].colorIndex) !== targetColorIndex) continue;

    visited[x][y] = true;
    cluster.push({ x, y });

    // Only 4-connected neighbors — no diagonals
    stack.push({ x: x + 1, y });
    stack.push({ x: x - 1, y });
    stack.push({ x, y: y + 1 });
    stack.push({ x, y: y - 1 });
  }

  return cluster;
}

/**
 * Generate cluster points for rendering
 */
function generateClusterPoints(settings, offX, offY, p5) {
  const clusterPoints = [];
  
  for (let i = 0; i < settings.clusterCount; i++) {
    const nx = i * 3000 + offX; // spacing factor + offset
    const ny = i * 3000 + offY;

    const x = Math.floor(pseudoRandom(nx, ny, 1) * (settings.canvasWidth / settings.gridSize));
    const y = Math.floor(pseudoRandom(nx + 1000, ny + 1000, 2) * (settings.canvasHeight / settings.gridSize));

    const color = p5.noise(nx, ny); // 0–1 value for color mapping

    clusterPoints.push({ x, y, color });
  }
  
  return clusterPoints;
}

/**
 * Create a string key for coordinates
 */
function key(x, y) {
  return `${x},${y}`;
}

export function drawClusterLayer(p5, layers, pixel, xGrid, yGrid, colors, settings, offX, offY, roughCanvas) {
  console.log('draw cluster layer with rough.js');
  layers.clusters.clear();

  // Initialize Rough.js canvas if not provided
  if (!roughCanvas) {
    roughCanvas = rough.canvas(layers.clusters.canvas);
  }

  // --- STEP 0: Build color interval ---
  const colorInterval = createColorInterval(p5, colors, settings.colorSteps);

  const clusterPoints = generateClusterPoints(settings, offX, offY, p5);
  const visited = Array.from({ length: xGrid }, () => Array(yGrid).fill(false));

  let clustersFound = 0;

  // --- MAIN LOOP: Use clusterPoints array ---
  for (let point of clusterPoints) {
    const iX = Math.floor(point.x);
    const iY = Math.floor(point.y);

    if (!pixel[iX] || !pixel[iX][iY] || visited[iX][iY]) continue;

    // Map 0–1 color value to color interval index
    const targetColorIndex = pixel[iX][iY] ? Math.floor(pixel[iX][iY].colorIndex) : -1;

    const cluster = getCluster(pixel, iX, iY, targetColorIndex, visited, xGrid, yGrid);
    if (cluster.length === 0) continue;

    clustersFound++;

    // --- STEP 1: Gather all corners and their source pixels ---
    const cornerSources = new Map();
    for (let { x, y } of cluster) {
      const corners = [
        { cx: x, cy: y },
        { cx: x + 1, cy: y },
        { cx: x, cy: y + 1 },
        { cx: x + 1, cy: y + 1 },
      ];
      for (let c of corners) {
        const k = key(c.cx, c.cy);
        if (!cornerSources.has(k)) cornerSources.set(k, []);
        cornerSources.get(k).push({ x, y });
      }
    }

    // --- STEP 2: Build vertex list and record duplicates ---
    const vertexes = [];
    const duplicatedKeys = new Set();

    for (let [coord, pixelsFrom] of cornerSources.entries()) {
      const count = pixelsFrom.length;
      const [vx, vy] = coord.split(',').map(Number);

      if (count < 4) {
        if (count === 2) {
          const a = pixelsFrom[0];
          const b = pixelsFrom[1];
          const dx = Math.abs(a.x - b.x);
          const dy = Math.abs(a.y - b.y);
          if (dx === 1 && dy === 1) {
            vertexes.push({ x: vx, y: vy });
            vertexes.push({ x: vx, y: vy });
            duplicatedKeys.add(coord);
            continue;
          }
        }
        vertexes.push({ x: vx, y: vy });
      }
    }

    if (vertexes.length < 3) continue;

    // --- STEP 3: Trace the shape logically ---
    const shape = [];
    const start = vertexes.pop();
    shape.push(start);
    let current = start;
    let lastDir = null;

    while (vertexes.length > 0) {
      const candidates = [];

      for (let i = 0; i < vertexes.length; i++) {
        const v = vertexes[i];
        const dx = v.x - current.x;
        const dy = v.y - current.y;

        if (!((Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0))) continue;

        // XOR border condition
        if (dx !== 0) {
          const minX = Math.min(current.x, v.x);
          const y = current.y;
          const a = isClusterPixel(pixel, minX, y - 1, xGrid, yGrid, targetColorIndex);
          const b = isClusterPixel(pixel, minX, y, xGrid, yGrid, targetColorIndex);
          if ((a && !b) || (!a && b)) {
            candidates.push({ i, dir: 'h', vertex: v, key: key(v.x, v.y) });
          }
        } else {
          const x = current.x;
          const minY = Math.min(current.y, v.y);
          const a = isClusterPixel(pixel, x - 1, minY, xGrid, yGrid, targetColorIndex);
          const b = isClusterPixel(pixel, x, minY, xGrid, yGrid, targetColorIndex);
          if ((a && !b) || (!a && b)) {
            candidates.push({ i, dir: 'v', vertex: v, key: key(v.x, v.y) });
          }
        }
      }

      if (candidates.length === 0) break;

      let chosen;
      if (candidates.length === 1 || lastDir === null) {
        chosen = candidates[0];
      } else {
        const perp = candidates.find(c => c.dir !== lastDir);

        if (perp) {
          const singles = candidates.filter(
            c => c.dir !== lastDir && !duplicatedKeys.has(c.key)
          );
          chosen = singles[0] || perp;
        } else {
          const sameDirSingles = candidates.filter(
            c => c.dir === lastDir && !duplicatedKeys.has(c.key)
          );
          chosen = sameDirSingles[0] || candidates[0];
        }
      }

      vertexes.splice(chosen.i, 1);
      shape.push(chosen.vertex);
      current = chosen.vertex;
      lastDir = chosen.dir;
    }

    // --- STEP 5: Compute color ---
    let index = Math.floor(p5.map(point.color, 0, 1, 0, settings.colorSteps - 1 + 0.9999));
    let clusterColor = colorInterval[index];

    // Convert p5.color to hex string for Rough.js
    const r = p5.red(clusterColor);
    const g = p5.green(clusterColor);
    const b = p5.blue(clusterColor);
    const a = p5.alpha(clusterColor) / 255;
    const colorString = `rgba(${r}, ${g}, ${b}, ${a})`;

    // --- STEP 6: Draw the traced polygon with Rough.js charcoal effect ---
    // Convert shape vertices to coordinate array for Rough.js
    const points = shape.map(v => [
      v.x * settings.gridSize,
      v.y * settings.gridSize
    ]);

    // Charcoal brush settings - adjust these for different effects
    const strokeWidth = 2 * settings.gridSize / 20;
    
    // Draw multiple passes for charcoal texture
    const passes = 3; // More passes = darker, more textured
    
    for (let pass = 0; pass < passes; pass++) {
      roughCanvas.polygon(points, {
        stroke: colorString,
        strokeWidth: strokeWidth, // Vary stroke width
        roughness: 0.5 + pass * 0.5, // High roughness for sketchy effect
        bowing: 0.5, // Slight curve to lines
        disableMultiStroke: false, // Multiple strokes for texture
        strokeLineDash: pass === 0 ? [] : [0.01, 0.4 + pass * 0.1, 0.4 + pass], // Dashed on later passes for texture
        strokeLineDashOffset: 0.1 * pass,
        simplification: 0, // Keep all points
        preserveVertices: true,
        seed: clustersFound * 1000 + pass // Deterministic randomness per cluster
      });
    }
  }

  console.log(`Clusters drawn: ${clustersFound}`);
  settings.clustersCount = clustersFound;
  return roughCanvas;
}