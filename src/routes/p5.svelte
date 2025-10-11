<script>
  import P5 from "@macfja/svelte-p5"
  import rough from 'roughjs'; // Add this import
  import {
    processImage,
    changeColorIndexes,
    changeSymbolIndexes,
    drawPixelLayer,
    drawClusterLayer,
    drawAsciiLayer
  } from '../lib/drawing/index.js';

let {
  colors,
  imagePath,
  save = $bindable(),
  update = $bindable(),
  updateColorSteps = $bindable(),
  updateTextSymbols = $bindable(),
  redraw = $bindable(),
  settings
} = $props();

///////////////////////////////
let img;
let layers = {};
let rc; // Add rough canvas instance
let xGrid = Math.floor(settings.canvasWidth / settings.gridSize);
let yGrid = Math.floor(settings.canvasHeight / settings.gridSize);
let offX = Math.random() * 30000;
let offY = Math.random() * 30000;
let pixel = Array.from({ length: xGrid }, () => new Array(yGrid + 1));
let imageLoaded = false;

let sketch = {
  setup: p5 => {
    p5.createCanvas(settings.canvasWidth, settings.canvasHeight);
    p5.background(0,0,0,0);
    
    // Create layers
    layers.pixel = p5.createGraphics(settings.canvasWidth, settings.canvasHeight);
    layers.clusters = p5.createGraphics(settings.canvasWidth, settings.canvasHeight);
    layers.ascii = p5.createGraphics(settings.canvasWidth, settings.canvasHeight);
    
    // Initialize Rough.js canvas for clusters layer
    rc = rough.canvas(layers.clusters.canvas);
    
    // Load image and handle both local files and static assets
    img = p5.loadImage(
      imagePath,
      () => {
        processImage(p5, img, pixel, xGrid, yGrid, settings, offX, offY);
        imageLoaded = true;
      },
      (err) => {
        console.error("Failed to load image:", err);
        imageLoaded = false;
      }
    );
  },
  
  draw: p5 => {
    if (!imageLoaded) return;
    
    if(save===true){
      let filename = imagePath.replace(/\.(jpg|JPG|png)$/i, '') + '_' + settings.gridSize + 'GRID_.png';
      p5.save(filename);
      save=false;
    }
    
    if(updateColorSteps===true){
      changeColorIndexes(p5, pixel, xGrid, yGrid, settings);
      updateColorSteps=false;
    }
    
    if(updateTextSymbols===true){
      changeSymbolIndexes(p5, pixel, xGrid, yGrid, settings);
      updateTextSymbols=false;
    }
    
    if(redraw===true){
      offX = Math.random() * 30000;
      offY = Math.random() * 30000;
      processImage(p5, img, pixel, xGrid, yGrid, settings, offX, offY);
      update=true;
      redraw=false;
    }
    
    if(update===true){
      p5.clear();
      console.log('update p5');
      
      drawPixelLayer(p5, layers, pixel, xGrid, yGrid, colors, settings);
      p5.image(layers.pixel, 0, 0);
      
      // Pass rc (rough canvas) to drawClusterLayer
      drawClusterLayer(p5, layers, pixel, xGrid, yGrid, colors, settings, offX, offY, rc);
      p5.image(layers.clusters, 0, 0);
      
      drawAsciiLayer(p5, layers, pixel, xGrid, yGrid, colors, settings);
      p5.image(layers.ascii, 0, 0);
      
      update=false;
    }
  }
};
</script>

<div class="p5-container">
  <P5 {...sketch}/>
</div>

<style>
.p5-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.p5-container :global(canvas) {
  transform-origin: center center;
  max-width: none !important;
  max-height: calc(100svh - 30px) !important;
  width: calc(100%) !important;
  height: 100% !important;
  scale: min(
    calc(100vw * 0.7 / 1920px),
    calc((100svh - 50px) / 1080px)
  );
  border-radius: 0.25em;
}
</style>
