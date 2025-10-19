<script>
  import P5 from "@macfja/svelte-p5"
  import rough from 'roughjs';
  import {
    processImage,
    changeImage,
    changeColorIndexes,
    changeSymbolIndexes,
    drawPixelLayer,
    drawClusterLayer,
    drawAsciiLayer
  } from '../lib/drawing/index.js';

let {
  save = $bindable(),
  update = $bindable(),
  settings
} = $props();

///////////////////////////////
let img;
let p5Instance; // Store p5 instance
let layers = {};
let rc;
let xGrid = Math.floor(settings.canvasWidth / settings.gridSize);
let yGrid = Math.floor(settings.canvasHeight / settings.gridSize);
let offX = Math.random() * 30000;
let offY = Math.random() * 30000;
let pixel = Array.from({ length: xGrid }, () => new Array(yGrid + 1));
let imageLoaded = false;

// Function to load/reload image
function loadMediaImage(p5, callback) {
  imageLoaded = false;
  img = p5.loadImage(
    settings.mediaPath,
    () => {
      if (callback) callback();
      imageLoaded = true;
    },
    (err) => {
      console.error("Failed to load media:", err);
      imageLoaded = false;
    }
  );
}

let sketch = {
  setup: p5 => {
    p5Instance = p5; // Store reference
    p5.createCanvas(settings.canvasWidth, settings.canvasHeight);
    p5.background(0,0,0,0);
    
    // Create layers
    layers.pixel = p5.createGraphics(settings.canvasWidth, settings.canvasHeight);
    layers.clusters = p5.createGraphics(settings.canvasWidth, settings.canvasHeight);
    layers.ascii = p5.createGraphics(settings.canvasWidth, settings.canvasHeight);
    
    // Initialize Rough.js canvas for clusters layer
    rc = rough.canvas(layers.clusters.canvas);
    
    // Load initial image
    if (settings.mediaPath) {
      loadMediaImage(p5, () => {
        processImage(p5, img, pixel, xGrid, yGrid, settings, offX, offY);
      });
    }
  },
  
  draw: p5 => {
    if (!imageLoaded) return;
    
    // Saving

    if(save.canvas===true){
      let filename = settings.mediaPath.replace(/\.(jpg|JPG|png)$/i, '') + '_' + settings.gridSize + 'GRID_.png';
      p5.save(filename);
      save.canvas=false;
    }

    if(save.pixelLayer===true){
      let filename = settings.mediaPath.replace(/\.(jpg|JPG|png)$/i, '') + '_' + settings.gridSize + 'GRID_PIXEL_LAYER_.png';
      layers.pixel.save(filename);
      save.pixelLayer=false;
    }

    if(save.clusterLayer===true){
      let filename = settings.mediaPath.replace(/\.(jpg|JPG|png)$/i, '') + '_' + settings.gridSize + 'GRID_CLUSTER_LAYER_.png';
      layers.clusters.save(filename);
      save.clusterLayer=false;
    }

    if(save.asciiLayer===true){
      let filename = settings.mediaPath.replace(/\.(jpg|JPG|png)$/i, '') + '_' + settings.gridSize + 'GRID_ASCII_LAYER_.png';
      layers.ascii.save(filename);
      save.asciiLayer=false;
    }

    // Updating

    if(update.redraw===true){
      offX = Math.random() * 30000;
      offY = Math.random() * 30000;
      processImage(p5, img, pixel, xGrid, yGrid, settings, offX, offY);
      update.layers = true;
      update.redraw = false;
    }
    
    if(update.media === true){
      // Reload the image from the new frame URL
      loadMediaImage(p5, () => {
        changeImage(p5, img, pixel, xGrid, yGrid, settings, offX, offY);
        update.layers = true;
      });
      update.media = false;
    }
    
    if(update.colorSteps === true){
      changeColorIndexes(p5, pixel, xGrid, yGrid, settings);
      update.colorSteps = false;
      update.layers = true;
    }
    
    if(update.textSymbols === true){
      changeSymbolIndexes(p5, pixel, xGrid, yGrid, settings, offX, offY);
      update.textSymbols = false;
      update.layers = true;
    }
    
    if(update.layers === true){
      p5.clear();
      console.log('update p5');

      if(settings.activeLayers.background){
        p5.background(settings.colors.background);
      }
      
      
      drawPixelLayer(p5, layers, pixel, xGrid, yGrid, settings.colors, settings);
      if(settings.activeLayers.pixel){
        p5.image(layers.pixel, 0, 0);
      }
      
      if(settings.activeLayers.cluster){
        drawClusterLayer(p5, layers, pixel, xGrid, yGrid, settings.colors, settings, offX, offY, rc);
        p5.image(layers.clusters, 0, 0);
      }
      
      if(settings.activeLayers.ascii){
        drawAsciiLayer(p5, layers, pixel, xGrid, yGrid, settings.colors, settings);
        p5.image(layers.ascii, 0, 0);
      }
      
      update.layers = false;
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
  max-height: calc(100svh - 4em) !important;
  width: calc(100%) !important;
  height: 100% !important;

  border-radius: 0.25em;
}
</style>
