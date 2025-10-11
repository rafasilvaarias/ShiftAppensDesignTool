/**
 * ASCII layer drawing functions
 * Handles rendering of ASCII text and line elements with blur effects
 */

export function drawAsciiLayer(p5, layers, pixel, xGrid, yGrid, colors, settings) {
  console.log('draw ascii layer');
  layers.ascii.clear();
  
  // Create a temporary graphics buffer for the blurred version
  let tempBlurred = p5.createGraphics(settings.canvasWidth, settings.canvasHeight);
  
  // First, draw ASCII elements to the temporary buffer for blurring
  for (let iX = 0; iX < xGrid; iX++) {
    for (let iY = 0; iY <= yGrid; iY++) {
      if (pixel[iX][iY]) {
        let x = iX * settings.gridSize;
        let y = iY * settings.gridSize;

        let perlinValue = pixel[iX][iY].perlinValue;
        let symbolIndex = pixel[iX][iY].symbolIndex;
        let asciiOffset = pixel[iX][iY].asciiOffset;

        if (perlinValue < settings.asciiSteps[1]) {
          tempBlurred.noStroke();
          tempBlurred.textAlign(p5.CENTER);
          tempBlurred.textSize(settings.gridSize * 0.8);
          tempBlurred.fill(colors.ascii);
          tempBlurred.textFont('monospace');
          tempBlurred.text(
            settings.textSymbols[symbolIndex],
            x + settings.gridSize * 0.5 + (settings.asciiOffset * asciiOffset.x),
            y + settings.gridSize * 0.7 + (settings.asciiOffset * asciiOffset.y)
          );
        } else if (perlinValue > settings.asciiSteps[0]) {
          tempBlurred.stroke(colors.ascii);
          tempBlurred.strokeWeight(p5.constrain(symbolIndex / settings.textSymbols.length * 3 * settings.gridSize / 20, 0.125, 10000));
          tempBlurred.line(x, y + settings.gridSize / 2, x + settings.gridSize, y + settings.gridSize / 2);
        }
      }
    }
  }
  
  // Apply blur to the temporary buffer
  tempBlurred.filter(p5.BLUR, settings.blurValue);
  
  // Draw the blurred version first (behind)
  layers.ascii.image(tempBlurred, 0, 0);
  
  // Then draw the sharp ASCII elements on top
  for (let iX = 0; iX < xGrid; iX++) {
    for (let iY = 0; iY <= yGrid; iY++) {
      if (pixel[iX][iY]) {
        let x = iX * settings.gridSize;
        let y = iY * settings.gridSize;

        let perlinValue = pixel[iX][iY].perlinValue;
        let symbolIndex = pixel[iX][iY].symbolIndex;
        let asciiOffset = pixel[iX][iY].asciiOffset;

        if (perlinValue < settings.asciiSteps[1]) {
          layers.ascii.noStroke();
          layers.ascii.textAlign(p5.CENTER);
          layers.ascii.textSize(settings.gridSize * 0.8);
          layers.ascii.fill(colors.ascii);
          layers.ascii.textFont('monospace');
          layers.ascii.text(
            settings.textSymbols[symbolIndex],
            x + settings.gridSize * 0.5 + (settings.asciiOffset * asciiOffset.x),
            y + settings.gridSize * 0.7 + (settings.asciiOffset * asciiOffset.y)
          );
        } else if (perlinValue > settings.asciiSteps[0]) {
          layers.ascii.stroke(colors.ascii);
          layers.ascii.strokeWeight(p5.constrain(symbolIndex / settings.textSymbols.length * 3, 0.125, 10000));
          layers.ascii.line(x, y + settings.gridSize / 2, x + settings.gridSize, y + settings.gridSize / 2);
        }
      }
    }
  }
}