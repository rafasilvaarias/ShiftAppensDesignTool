/**
 * Image processing functions for the Shift Appens Design Tool
 * Handles image analysis, pixel data processing, and color/symbol mapping
 */

export function processImage(p5, img, pixel, xGrid, yGrid, settings, offX, offY) {
  console.log('process image');
  img.resize(settings.canvasWidth, settings.canvasHeight);

  for (let iX = 0; iX < xGrid; iX++) {
    for (let iY = 0; iY <= yGrid; iY++) {

      // Get the color of the center pixel in the grid cell
      let x = iX * settings.gridSize;
      let y = iY * settings.gridSize;
      let c = img.get(x + Math.floor(settings.gridSize / 2), y + Math.floor(settings.gridSize / 2));

      if (p5.alpha(c) > 0 || p5.blue(c) + p5.green(c) + p5.red(c) > 0) {
        // Symbol and Color Index
        let grayScaleValue = Math.round((p5.red(c) + p5.green(c) + p5.blue(c)) / 3);
        let indexes = calculateIndexes(p5, grayScaleValue, 0, iX, iY, settings, offX, offY);
        let colorIndex = indexes.colorIndex;
        let symbolIndex = indexes.symbolIndex;

        // Perlin Noise and Ascii Offset
        let asciiOffset = {x: p5.random(-1,1), y: p5.random(-1,1)};
        let perlinValue = p5.noise(iX * 0.3 + offX, iY * 0.05 + offY);

        pixel[iX][iY] = {
          perlinValue: perlinValue,
          colorIndex: colorIndex,
          symbolIndex: symbolIndex,
          asciiOffset: asciiOffset,
          grayScaleValue: grayScaleValue
        };

      } else {
        pixel[iX][iY] = null;
      }

    }
  }
}

export function changeImage(p5, img, pixel, xGrid, yGrid, settings, offX, offY) {
  console.log('change image');
  img.resize(settings.canvasWidth, settings.canvasHeight);

  for (let iX = 0; iX < xGrid; iX++) {
    for (let iY = 0; iY <= yGrid; iY++) {

      // Get the color of the center pixel in the grid cell
      let x = iX * settings.gridSize;
      let y = iY * settings.gridSize;
      let c = img.get(x + Math.floor(settings.gridSize / 2), y + Math.floor(settings.gridSize / 2));

      if (p5.alpha(c) > 0 || p5.blue(c) + p5.green(c) + p5.red(c) > 0) {
        // Symbol and Color Index
        let grayScaleValue = Math.round((p5.red(c) + p5.green(c) + p5.blue(c)) / 3);
        let indexes = calculateIndexes(p5, grayScaleValue, 0, iX, iY, settings, offX, offY);
        let colorIndex = indexes.colorIndex;
        let symbolIndex = indexes.symbolIndex;

        pixel[iX][iY] = {
          colorIndex: colorIndex,
          symbolIndex: symbolIndex,
          grayScaleValue: grayScaleValue,
          perlinValue: pixel[iX][iY].perlinValue,
          asciiOffset: pixel[iX][iY].asciiOffset
        };

      } else {
        pixel[iX][iY] = null;
      }

    }
  }
}

/**
 * Calculate color and symbol indexes for a single pixel
 * This is the central function that handles the mapping logic
 */
function calculateIndexes(p5, grayScaleValue, colorIndex, iX, iY, settings, offX = 0, offY = 0) {
  // Calculate color index from grayscale value
  let constrainedGray = p5.constrain(grayScaleValue, settings.minColorValue, settings.maxColorValue);
  let newColorIndex = p5.map(constrainedGray, settings.minColorValue, settings.maxColorValue, 0, settings.colorSteps - 0.01);
  
  // Calculate symbol index based on mode
  let symbolIndex;
  if (settings.asciiMode === "interpolation") {
    symbolIndex = Math.floor(p5.map(newColorIndex % 1, 0, 1, 0, settings.textSymbols.length));
  } else if (settings.asciiMode === "linear") {
    symbolIndex = Math.floor(p5.map(newColorIndex, 0, settings.colorSteps, 0, settings.textSymbols.length));
  } else if (settings.asciiMode === "perlin") {
    symbolIndex = Math.floor(
      p5.map(
        p5.constrain(p5.noise(iX * 0.1 + offX, iY * 0.1 + offY, settings.currentFrame * 0.025), 0.15, 0.85)
      , 0.15, 0.85, 0, settings.textSymbols.length));
  }
  
  return { colorIndex: newColorIndex, symbolIndex };
}

export function changeColorIndexes(p5, pixel, xGrid, yGrid, settings) {
  for (let iX = 0; iX < xGrid; iX++) {
    for (let iY = 0; iY <= yGrid; iY++) {
      if (pixel[iX][iY]) {
        let grayScaleValue = pixel[iX][iY].grayScaleValue;
        let indexes = calculateIndexes(p5, grayScaleValue, pixel[iX][iY].colorIndex, iX, iY, settings);
        pixel[iX][iY].colorIndex = indexes.colorIndex;
        pixel[iX][iY].symbolIndex = indexes.symbolIndex;
      }
    }
  }
}

export function changeSymbolIndexes(p5, pixel, xGrid, yGrid, settings, offX, offY) {
  console.log('currentFrame' + settings.currentFrame);
  for (let iX = 0; iX < xGrid; iX++) {
    for (let iY = 0; iY <= yGrid; iY++) {
      if (pixel[iX][iY]) {
        let grayScaleValue = pixel[iX][iY].grayScaleValue;
        let indexes = calculateIndexes(p5, grayScaleValue, pixel[iX][iY].colorIndex, iX, iY, settings, offX, offY);
        pixel[iX][iY].symbolIndex = indexes.symbolIndex;
      }
    }
  }
}