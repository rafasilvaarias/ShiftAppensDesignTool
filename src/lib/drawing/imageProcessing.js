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

      if (p5.alpha(c) > 0) {
        // Symbol and Color Index
        let grayScaleValue = Math.round((p5.red(c) + p5.green(c) + p5.blue(c)) / 3);
        let constrainedGray = p5.constrain(grayScaleValue, settings.minColorValue, settings.maxColorValue); //!!!!!
        let colorIndex = p5.map(constrainedGray, settings.minColorValue, settings.maxColorValue, 0, settings.colorSteps-0.01);
        let symbolIndex = Math.floor(p5.map(colorIndex % 1, 0, 1, 0, settings.textSymbols.length));

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

export function changeColorIndexes(p5, pixel, xGrid, yGrid, settings) {
  for (let iX = 0; iX < xGrid; iX++) {
    for (let iY = 0; iY <= yGrid; iY++) {
      if (pixel[iX][iY]) {
        let grayScaleValue = pixel[iX][iY].grayScaleValue;
        let constrainedGray = p5.constrain(grayScaleValue, settings.minColorValue, settings.maxColorValue); //!!!!!
        let colorIndex = p5.map(constrainedGray, settings.minColorValue, settings.maxColorValue, 0, settings.colorSteps-0.01);
        pixel[iX][iY].colorIndex = colorIndex;
        pixel[iX][iY].symbolIndex = Math.floor(p5.map(colorIndex % 1, 0, 1, 0, settings.textSymbols.length));
      }
    }
  }
}

export function changeSymbolIndexes(p5, pixel, xGrid, yGrid, settings){
  for (let iX = 0; iX < xGrid; iX++) {
    for (let iY = 0; iY <= yGrid; iY++) {
      if (pixel[iX][iY]) {
        let colorIndex = pixel[iX][iY].colorIndex;
        pixel[iX][iY].symbolIndex = Math.floor(p5.map(colorIndex % 1, 0, 1, 0, settings.textSymbols.length));
      }
    }
  }
}