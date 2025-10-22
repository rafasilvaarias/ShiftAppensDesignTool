<script>
    import P5 from "./p5.svelte";
    import uploadFileIcon from '$lib/assets/icons/uploadFile.svg';
    import redrawIcon from '$lib/assets/icons/refresh.svg';
    import downloadIcon from '$lib/assets/icons/download.svg';
    import fileDownloadIcon from '$lib/assets/icons/fileDownload.svg';
    import { videoProcessor } from '$lib/videoProcessor.js';
    import { videoExporter } from '$lib/videoExporter.js';

    let reloadCount = $state(0);

    let mediaSize = $state([1920, 1080]);
    
    // Media upload variables
    let uploadedMediaFile = $state(null);
    let uploadedMediaUrl = $state(null);
    let currentMediaPath = $derived(uploadedMediaUrl);
    
    // Video processing variables
    let isVideo = $state(false);
    let videoFrames = $state([]);
    let totalVideoFrames = $state(0);
    let isProcessingVideo = $state(false);
    let videoProcessingProgress = $state(0);
    let currentFrame = $state(0);
    let currentFrameUrl = $derived(isVideo && videoFrames.length > 0 ? videoFrames[currentFrame] : uploadedMediaUrl);

    let presetColors = [
        { darker: "#10400C", lighter: "#478530", ascii: "#9DD492", name: "Green" },
        { darker: "#5C2806", lighter: "#CE5744", ascii: "#E6EB8E", name: "Orange" },
        { darker: "#1D2399", lighter: "#5F6EE1", ascii: "#96C1F7", name: "Blue" },
        { darker: "#670F5A", lighter: "#BA58A7", ascii: "#F69EE3", name: "Pink" },
        { darker: "#393939", lighter: "#818181", ascii: "#F2F2F1", name: "Gray" },
    ]

    let backgroundColor = $state(presetColors[2].darker);
    let darkerColor = $state(presetColors[2].darker);
    let lighterColor = $state(presetColors[2].lighter);
    let asciiColor = $state(presetColors[3].ascii);
    let colors = $derived({background: backgroundColor, darker: darkerColor, lighter: lighterColor, ascii: asciiColor});

    let pixelPreset = $state();
    let asciiPreset = $state();
    
    let textSymbolsString = $state(" .;sf@");
    let asciiOffsetQuotient = $state(4);

    let blurValue = $state(3);
    let minColorValue = $state(0);
    let maxColorValue = $state(255);
    let colorSteps = $state(12);
    let gridSize = $state(20);
    let canvasWidth = $derived(mediaSize[0]);
    let canvasHeight = $derived(mediaSize[1]);
    let asciiOffset = $derived(Math.floor(asciiOffsetQuotient * 20 / gridSize));
    let textSymbols = $derived(textSymbolsString.split(''));
    let asciiStep1 = $state(0);
    let asciiStep2 = $state(0.67);
    let asciiSteps = $derived([asciiStep1, asciiStep2]);
    let clusterCount = $state(24);
    let activeLayers = $state({ pixel: true, cluster: true, ascii: true, background: false });

    let asciiMode = $state();

    let exportFormat = $state("png");

    let settings = $derived({
        gridSize,
        colorSteps,
        minColorValue,
        maxColorValue,
        textSymbols,
        canvasWidth,
        canvasHeight,
        asciiOffset,
        blurValue,
        asciiSteps,
        clusterCount,
        mediaPath: currentFrameUrl,
        colors,
        activeLayers: { ...activeLayers },
        asciiMode,
        currentFrame,
        exportFormat
    });

    let save = $state({
        canvas: false,
        pixelLayer: false,
        clusterLayer: false,
        asciiLayer: false,
        videoFrame: false
    });

    let update = $state({
        layers: true,
        colorSteps: false,
        textSymbols: false,
        media: false,
        redraw: false
    });

    // Video export state
    let isExportingVideo = $state(false);
    let videoExportProgress = $state(0);
    let videoExportCurrentFrame = $state(0);
    let frameReadyToCapture = $state(false);

    $effect(() => {
        colors;
        settings;
        currentFrameUrl;


        return() => {
            update.layers = true;
        }
    });

    $effect(() => {
        colorSteps;
        minColorValue;
        maxColorValue;
        return() => {
            update.colorSteps = true;
        }
    });

    $effect(() => {
        textSymbols;
        asciiMode;
        return() => {
            update.textSymbols = true;
        }
    });

    function changePixelPreset() {
        if (pixelPreset != "custom") {
            const preset = presetColors.find(p => p.name === pixelPreset);
            if (preset) {
                backgroundColor = preset.darker;
                darkerColor = preset.darker;
                lighterColor = preset.lighter;
            }
        }
    }

    function changeAsciiPreset() {
        if (asciiPreset != "custom") {
            const preset = presetColors.find(p => p.name === asciiPreset);
            if (preset) {
                asciiColor = preset.ascii;
            }
        }
    }

    // Media upload handler
    async function handleMediaUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Clean up previous media
        if (uploadedMediaUrl && !isVideo) {
            URL.revokeObjectURL(uploadedMediaUrl);
        }
        if (isVideo) {
            videoProcessor.cleanup();
            videoFrames = [];
        }

        const isVideoFile = file.type.startsWith('video/');
        const isImageFile = file.type.startsWith('image/');

        if (isImageFile) {
            // Handle image upload
            isVideo = false;
            totalVideoFrames = 0;
            currentFrame = 0;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                uploadedMediaUrl = e.target.result;
                
                // Read media dimensions
                const img = new Image();
                img.onload = function() {
                    mediaSize = [img.width, img.height];
                    mediaSize[0] = Math.round(mediaSize[0] / 20) * 20;
                    mediaSize[1] = Math.round(mediaSize[1] / 20) * 20;
                    
                    // Only increment reloadCount after image is fully loaded
                    reloadCount++;
                    update.layers = true;
                };
                img.src = uploadedMediaUrl;
            };
            reader.readAsDataURL(file);
        } else if (isVideoFile) {
            // Handle video upload
            isVideo = true;
            isProcessingVideo = true;
            videoProcessingProgress = 0;

            try {
                // First, get video dimensions
                const videoUrl = URL.createObjectURL(file);
                const video = document.createElement('video');
                
                await new Promise((resolve, reject) => {
                    video.onloadedmetadata = () => {
                        mediaSize = [video.videoWidth, video.videoHeight];
                        mediaSize[0] = Math.round(mediaSize[0] / 20) * 20;
                        mediaSize[1] = Math.round(mediaSize[1] / 20) * 20;
                        resolve();
                    };
                    video.onerror = reject;
                    video.src = videoUrl;
                });

                URL.revokeObjectURL(videoUrl);

                // Process video into frames
                const result = await videoProcessor.processVideo(
                    file,
                    mediaSize[0],
                    mediaSize[1],
                    (current, total) => {
                        videoProcessingProgress = Math.round((current / total) * 100);
                    }
                );

                videoFrames = result.frameUrls;
                totalVideoFrames = result.totalFrames;
                currentFrame = 0;
                uploadedMediaUrl = videoFrames[0];
                
                // Only increment reloadCount after video is fully processed
                reloadCount++;
                update.layers = true;
                
            } catch (error) {
                console.error('Error processing video:', error);
                alert('Failed to process video. Please try again.');
                isVideo = false;
            } finally {
                isProcessingVideo = false;
            }
        }
    }

    $effect(() => {
        gridSize;
    return() => {
            reloadCount++;
        }
    });

    // Update current frame when frame slider changes
    $effect(() => {
        if (isVideo && videoFrames.length > 0) {
            uploadedMediaUrl = videoFrames[currentFrame];
        }
    });

    // Video export logic
    async function saveVideo() {
        if (!isVideo || videoFrames.length === 0) {
            alert('No video loaded to export');
            return;
        }

        isExportingVideo = true;
        videoExportProgress = 0;
        videoExportCurrentFrame = 0;
        frameReadyToCapture = false;

        // Setup progress callback
        videoExporter.onProgress((current, total, progress) => {
            videoExportProgress = progress;
        });

        // Setup completion callback
        videoExporter.onComplete(() => {
            isExportingVideo = false;
            videoExportProgress = 0;
            videoExportCurrentFrame = 0;
            frameReadyToCapture = false;
        });

        // Setup frame captured callback - this handles advancing to next frame
        videoExporter.onFrameCaptured((hasMore) => {
            if (hasMore) {
                // Move to next frame
                videoExportCurrentFrame++;
                currentFrame = videoExportCurrentFrame;
                update.media = true;
                frameReadyToCapture = false;
            } else {
                // All frames captured, finalize
                videoExporter.finishExport();
            }
        });

        // Start the export
        videoExporter.startExport(totalVideoFrames - 1, exportFormat);
        
        // Set first frame (start from 1, not 0)
        currentFrame = 1;
        videoExportCurrentFrame = 1;
        update.media = true;
    }

    // Watch for when frame is ready to capture
    $effect(() => {
        if (isExportingVideo && update.layers === false && !frameReadyToCapture) {
            // Mark frame as ready
            frameReadyToCapture = true;
        }
    });

    // Trigger capture when frame is ready
    $effect(() => {
        if (frameReadyToCapture && isExportingVideo) {
            save.videoFrame = true;
        }
    });

    // Update current frame when frame slider changes
    $effect(() => {
        currentFrame;
        return() => {
            if (!isExportingVideo) {
                update.media = true;
            }
        }
    });

</script>

<div id="mainFlex">
    <!-- Settings -->
    <div id="sidebar">
        <div id="settings">
            <div id="upload-container">
                <input type="file" id="mediaFileInput" accept="image/*,video/*" onchange={handleMediaUpload} style="display: none;" />
                <button type="button" class={uploadedMediaUrl ? '' : 'blinkingStroke'} onclick={() => document.getElementById('mediaFileInput').click()}>
                    <img src={uploadFileIcon} alt="Upload Icon"/> upload new image/video file
                </button>
                {#if isProcessingVideo}
                    <div class="processing-status">
                        <p>Processing video... {videoProcessingProgress}%</p>
                        <progress value={videoProcessingProgress} max="100"></progress>
                    </div>
                {/if}
                {#if isExportingVideo}
                    <div class="processing-status">
                        <p>Exporting video frames... {videoExportProgress}%</p>
                        <progress value={videoExportProgress} max="100"></progress>
                        <p>Frame {videoExportCurrentFrame + 1} of {totalVideoFrames}</p>
                        <p style="font-size: 0.9em; opacity: 0.8;">Files exported in batches of 50 frames</p>
                    </div>
                {/if}
            </div>
            {#if uploadedMediaUrl}
                
                <!--General Settings-->
                <div class="shelf" id="generalSettings">
                    <h2>General Settings</h2>
                        <div class="flexRow">
                            <label for="gridSize">gridsize</label>
                            <button type="button" class={gridSize === 20 ? 'selected' : ''} disabled={canvasWidth % 20 != 0 || canvasHeight % 20 != 0} onclick={() => gridSize = 20}>20px</button>
                            <button type="button" class={gridSize === 40 ? 'selected' : ''} disabled={canvasWidth % 40 != 0 || canvasHeight % 40 != 0} onclick={() => gridSize = 40}>40px</button>
                            <button type="button" class={gridSize === 80 ? 'selected' : ''} disabled={canvasWidth % 80 != 0 || canvasHeight % 80 != 0} onclick={() => gridSize = 80}>80px</button>
                        </div>
                        
                </div>

                <!--Background Settings-->
                <div class="shelf" id="backgroundSettings">
                    <div class="flexRow">
                        <input type="checkbox" id="background" bind:checked={activeLayers.background}/>
                        <label for="background"><h2>Background</h2></label>
                    </div>
                    {#if activeLayers.background}
                        <div class="flexRow">
                            <label for="backgroundColor">color (hex)</label>
                            <input id="backgroundColor" type="text" bind:value={backgroundColor} />
                        </div>
                    {/if}
                </div>

                <!--Pixel Settings-->
                <div class="shelf" id="pixelSettings">
                    <div class="flexRowSpaceBetween">
                        <div class="flexRow">
                            <input type="checkbox" id="pixelLayer" bind:checked={activeLayers.pixel}/>
                            <label for="pixelLayer"><h2>Pixel Layer</h2></label>
                        </div>
                        <button title="Download Pixel Layer" class="iconButton" onclick={() => save.pixelLayer = true}>
                            <img src={downloadIcon} alt="Download Icon" />
                        </button>
                    </div>
                    {#if activeLayers.pixel}
                        <div class="flexRow">
                            <label for="presetColors">color preset</label>
                            <select bind:value={pixelPreset} onchange={() => changePixelPreset()}>
                                {#each presetColors as preset}
                                    <option value={preset.name} selected={darkerColor === preset.darker && lighterColor === preset.lighter}>{preset.name}</option>
                                {/each}
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        {#if pixelPreset === 'custom'}
                            <div class="flexRow">
                                <label for="darkerColor">darker color (hex)</label>
                                <input id="darkerColor" type="text" bind:value={darkerColor} />
                            </div>
                            <div class="flexRow">
                                <label for="lighterColor">lighter color (hex)</label>
                                <input id="lighterColor" type="text" bind:value={lighterColor} />
                            </div>
                        {/if}
                    {/if}
                    <div class="flexRow">
                        <label for="colorValues">threshold</label>
                        <input type="range" min="0" max="255" bind:value={minColorValue} />
                        <input type="range" min="0" max="255" bind:value={maxColorValue} />
                    </div>
                    <div class="flexRow">
                        <label for="colorSteps">color steps</label>
                        <input id="colorSteps" type="number" min="3" max="20" bind:value={colorSteps} />
                    </div>
                </div>

                <!--Cluster Settings-->
                <div class="shelf" id="clusterSettings">
                    <div class="flexRowSpaceBetween">
                        <div class="flexRow">
                            <input type="checkbox" id="clusterLayer" bind:checked={activeLayers.cluster}/>
                            <label for="clusterLayer"><h2>Cluster Layer</h2></label>
                        </div>
                        <button title="Download Cluster Layer" class="iconButton" onclick={() => save.clusterLayer = true}>
                            <img src={downloadIcon} alt="Download Icon" />
                        </button>
                    </div>
                    {#if activeLayers.cluster}
                        <div class="flexRow">
                            <label for="clusterCount">max clusters</label>
                            <input id="clusterCount" type="number" min="1" max="50" bind:value={clusterCount} />
                        </div>
                    {/if}
                </div>

                <!--Ascii Settings-->
                <div class="shelf" id="asciiSettings">
                    <div class="flexRowSpaceBetween">
                        <div class="flexRow">
                            <input type="checkbox" id="asciiLayer" bind:checked={activeLayers.ascii}/>
                            <label for="asciiLayer"><h2>ASCII Layer</h2></label>
                        </div>
                        <button title="Download ASCII Layer" class="iconButton" onclick={() => save.asciiLayer = true}>
                            <img src={downloadIcon} alt="Download Icon" />
                        </button>
                    </div>
                    {#if activeLayers.ascii}
                        <div class="flexRow">
                            <label for="mode">mode</label>
                            <select id="mode" bind:value={asciiMode}>
                                <option value="linear">linear</option>
                                <option value="interpolation" selected>interpolation</option>
                                <option value="perlin">perlin</option>
                            </select>
                        </div>
                        <div class="flexRow">
                            <label for="presetColors">color preset</label>
                            <select bind:value={asciiPreset} onchange={() => changeAsciiPreset()}>
                                {#each presetColors as preset}
                                    <option value={preset.name} selected={colors.ascii === preset.ascii}>{preset.name}</option>
                                {/each}
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        {#if asciiPreset === 'custom'}
                            <div class="flexRow">
                                <label for="asciiColor">color (hex)</label>
                                <input id="asciiColor" type="text" bind:value={asciiColor} />
                            </div>
                        {/if}
                        <div class="flexRow">
                            <label for="textSymbols">text symbols</label>
                            <input id="textSymbols" type="text" bind:value={textSymbolsString} />
                        </div>
                        <div class="flexRow">
                            <label for="asciiOffset">ascii offset</label>
                            <input id="asciiOffset" type="number" min="0" max="10" bind:value={asciiOffsetQuotient} />
                        </div>
                        <div class="flexRow">
                            <label for="asciiSteps">element distribution</label>
                            <input type="range" min="0" max="1" step='.01' bind:value={asciiStep1} />
                            <input type="range" min="0" max="1" step='.01' bind:value={asciiStep2} />
                        </div>
                        <div class="flexRow">
                            <label for="blurValue">blur value</label>
                            <input id="blurValue" type="number" min="0" max="10" bind:value={blurValue} />
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
    <!-- Display Image-->
    <div id="display">
        {#if canvasWidth % 20 == 0 && canvasHeight % 20 == 0}
            {#key `${reloadCount}`}
                <P5 bind:save bind:update {settings} />
            {/key}
        {:else}
            <p>Media Size has to be divisible by 20px</p>
        {/if}
    </div>
</div>
<footer id="footer" class="flexRow">
    <button id="redraw" onclick={() => update.redraw = true}>
        <img src={redrawIcon} alt="Redraw"/> redraw
    </button>
    <div id="videoPlayback" class="flexRow">
        {#if isVideo}
            <p>{currentFrame + 1}</p>
            <input type="range" min="0" max={totalVideoFrames - 1} bind:value={currentFrame} disabled={isExportingVideo} />
            <p>{totalVideoFrames}</p>
        {:else}
            <p class="disabled-text">No video loaded</p>
        {/if}
    </div>
    <div id="saveSection" class="flexRowSpaceBetween">
        <div class="flexRow">
            <p>canvas.</p>
            <select bind:value={exportFormat}>
                <option value="png">png</option>
                <option value="jpg">jpg</option>
            </select>
        </div>
        <div class="flexRow"> 
            <button id="saveCanvas" class="iconButton" onclick={() => save.canvas = true} disabled={isExportingVideo}>
                <img src={fileDownloadIcon} alt="Download"/>
            </button>
            {#if isVideo}
                <button id="saveVideo" class="iconButton" onclick={saveVideo} disabled={isExportingVideo} title="Export all frames as ZIP">
                    <img src={downloadIcon} alt="Download All"/>
                </button>
            {/if}
        </div>
    </div>
</footer>

<style>
#mainFlex {
    display: flex;
    flex-direction: row;
    width: 100%;
    height:calc(100svh - 4em);
}

#sidebar {
    min-width: 30%;
    max-width: 30%;
    height: inherit;
    display: flex;
    flex-direction: column;
    gap: 20px;
    border-right: 1px solid var(--white2);
}

#settings {
    overflow-y: scroll;
    padding: 2em;
    display: flex;
    flex-direction: column;
    gap: 1.5em;
}
#display {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

#mainFlex > div{
    height: auto;
}

.flexRow {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5em;
}

.flexRowSpaceBetween {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 0.5em;
}

label{
    white-space: nowrap;
    margin-right:1em;
}

.shelf{
    display: flex;
    flex-direction: column;
    gap: 1.5em;
    border-radius: 1em;
    border: 1px solid var(--white2);
    padding: 1.5em;
    transition: height 1s;
}

.shelf > :nth-child(2){
    margin-top: 1rem;
}

h2{
    margin: 0px;
}

#upload-container > button{
    border-color: var(--white2);
}

#footer {
    height: calc(4em - 1px);
    width: 100%;
    border-top: 1px solid var(--white2);
    gap: 0px;
}

#footer > *{
    border-radius: 0;
    height: 100%;
}

#footer > #redraw{
    min-width: calc(30% + 0.5px);
    width: calc(30% + 0.5px);
    border: none;
    border-right: 1px solid var(--white2);
}

#footer > #videoPlayback{
    width: 100%;
    border-right: 1px solid var(--white2);
    padding:0em 2em;
}

#footer > #videoPlayback input{
    width: 100%;
}

#footer > #saveSection{
    padding-right: 2em;
    padding-left: 2em;
    gap:2em;
}

#footer > #saveSection select {
    padding: 0.35em 0.8em;
}

img{
    background-color: transparent;
}

.iconButton{
    background: none;
    border: none;
    padding: 0;
    min-width: 0px;
    cursor: pointer;
    width: auto;
    display: relative;
}

.blinkingStroke {
    border: 1px solid transparent;
    animation: blinkBorder 1.2s ease-in-out infinite;

    
}

@keyframes blinkBorder {
    0%   { border-color: var(--white3); }
    50%  { border-color: var(--white); }
    100% { border-color: var(--white3); }
}

.processing-status {
    margin-top: 1em;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
}

.processing-status p {
    margin: 0;
    font-size: 0.9em;
}

.processing-status progress {
    width: 100%;
    height: 1.5em;
}

.disabled-text {
    color: var(--white2);
    opacity: 0.5;
}
</style>

