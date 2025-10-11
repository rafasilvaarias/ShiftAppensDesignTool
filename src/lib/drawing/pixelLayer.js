/**
 * Pixel layer drawing functions
 * Handles rendering of the pixel-based background layer
 */

import { createColorInterval } from './utils.js';

export function drawPixelLayer(p5, layers, pixel, xGrid, yGrid, colors, settings) {
  console.log('draw pixel layer');
  layers.pixel.clear();
  
  const colorInterval = createColorInterval(p5, colors, settings.colorSteps);
  
  for (let iX = 0; iX < xGrid; iX++) {
    for (let iY = 0; iY <= yGrid; iY++) {
      if (pixel[iX][iY]) {
        let x = iX * settings.gridSize;
        let y = iY * settings.gridSize;

        let colorIndex = pixel[iX][iY].colorIndex;

        layers.pixel.noStroke();
        layers.pixel.fill(colorInterval[Math.floor(colorIndex)]);
        layers.pixel.square(x, y, settings.gridSize);
      }
    }
  }
}