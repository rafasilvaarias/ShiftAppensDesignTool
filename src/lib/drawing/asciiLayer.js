/**
 * ASCII layer drawing functions
 * Handles rendering of ASCII text and line elements with blur effects
 */

export function drawAsciiLayer(p5, layers, pixel, xGrid, yGrid, colors, settings) {
  console.log('draw ascii layer');
  layers.ascii.clear();
  
  // Create a sharp canvas for ASCII elements
  let sharpCanvas = p5.createGraphics(settings.canvasWidth, settings.canvasHeight);
  
  // Create a blur canvas
  let blurCanvas = p5.createGraphics(settings.canvasWidth, settings.canvasHeight);

  console.log(settings.asciiSteps);
  
  // Draw ASCII elements to the sharp canvas
  for (let iX = 0; iX < xGrid; iX++) {
    for (let iY = 0; iY <= yGrid; iY++) {
      if (pixel[iX][iY] && pixel[iX][iY].symbolIndex !== null) {
        let x = iX * settings.gridSize;
        let y = iY * settings.gridSize;

        let perlinValue = pixel[iX][iY].perlinValue;
        let symbolIndex = pixel[iX][iY].symbolIndex;
        let asciiOffset = pixel[iX][iY].asciiOffset;

        if (perlinValue > settings.asciiSteps[1]) {
          // Draw lines
          sharpCanvas.stroke(colors.ascii);
          sharpCanvas.strokeWeight(p5.constrain(symbolIndex / settings.textSymbols.length * 3 * settings.gridSize / 20, 0.125, 10000));
          sharpCanvas.line(x, y + settings.gridSize / 2, x + settings.gridSize, y + settings.gridSize / 2);
        } else if (perlinValue > settings.asciiSteps[0]) {
          // Draw text
          sharpCanvas.noStroke();
          sharpCanvas.textAlign(p5.CENTER);
          sharpCanvas.textSize(settings.gridSize * 0.8);
          sharpCanvas.fill(colors.ascii);
          sharpCanvas.textFont('monospace');
          sharpCanvas.text(
            settings.textSymbols[symbolIndex],
            x + settings.gridSize * 0.5 + (settings.asciiOffset * asciiOffset.x),
            y + settings.gridSize * 0.7 + (settings.asciiOffset * asciiOffset.y)
          );
        }
      }
    }
  }
  
  // Copy sharp canvas to blur canvas and apply blur
  blurCanvas.image(sharpCanvas, 0, 0);
  blurCanvas.filter(p5.BLUR, settings.blurValue);
  
  // Draw blurred version first (behind)
  layers.ascii.image(blurCanvas, 0, 0);
  
  // Draw sharp version on top
  layers.ascii.image(sharpCanvas, 0, 0);
}