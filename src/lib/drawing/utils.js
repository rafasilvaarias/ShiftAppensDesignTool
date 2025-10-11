/**
 * Shared utilities for drawing functions
 * Contains common functionality used across multiple drawing layers
 */

/**
 * Creates a color interval array for gradients between two colors
 * @param {Object} p5 - p5.js instance
 * @param {Object} colors - Object containing 'darker' and 'lighter' color properties
 * @param {number} colorSteps - Number of color steps to create
 * @returns {Array} Array of p5.Color objects representing the color gradient
 */
export function createColorInterval(p5, colors, colorSteps) {
  const colorInterval = [];
  for (let i = 0; i < colorSteps; i++) {
    let r = p5.red(colors.darker) + ((p5.red(colors.lighter) - p5.red(colors.darker)) / (colorSteps - 1) * i);
    let g = p5.green(colors.darker) + ((p5.green(colors.lighter) - p5.green(colors.darker)) / (colorSteps - 1) * i);
    let b = p5.blue(colors.darker) + ((p5.blue(colors.lighter) - p5.blue(colors.darker)) / (colorSteps - 1) * i);
    colorInterval.push(p5.color(r, g, b));
  }
  return colorInterval;
}