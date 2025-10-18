<script>
    import P5 from "./p5.svelte";
    import uploadFileIcon from '$lib/assets/icons/uploadFile.svg';
    import redrawIcon from '$lib/assets/icons/refresh.svg';
    import downloadIcon from '$lib/assets/icons/download.svg';

    let mediaSize = $state([1920, 1080]);
    
    // Media upload variables
    let uploadedMediaFile = $state(null);
    let uploadedMediaUrl = $state(null);
    let currentMediaPath = $derived(uploadedMediaUrl);

    let presetColors = [
        { darker: "#10400C", lighter: "#478530", ascii: "#9DD492", name: "Green" },
        { darker: "#7B3100", lighter: "#CE5744", ascii: "#E6EB8E", name: "Orange" },
        { darker: "#1D2399", lighter: "#4555CF", ascii: "#96C1F7", name: "Blue" },
        { darker: "#761968", lighter: "#BA58A7", ascii: "#F69EE3", name: "Pink" },
        { darker: "#404040", lighter: "#8B8B8B", ascii: "#F2F2F1", name: "Gray" },
    ]

    let backgroundColor = $state(presetColors[2].darker);
    let darkerColor = $state(presetColors[2].darker);
    let lighterColor = $state(presetColors[2].lighter);
    let asciiColor = $state(presetColors[3].ascii);
    let colors = $derived({background: backgroundColor, darker: darkerColor, lighter: lighterColor, ascii: asciiColor });

    let pixelPreset = $state();
    let asciiPreset = $state();
    
    let textSymbolsString = $state(" .;sf@");
    let asciiOffsetQuotient = $state(5);

    let blurValue = $state(4);
    let minColorValue = $state(0);
    let maxColorValue = $state(255);
    let colorSteps = $state(10);
    let gridSize = $state(20);
    let canvasWidth = $derived(mediaSize[0]);
    let canvasHeight = $derived(mediaSize[1]);
    let asciiOffset = $derived(Math.floor(asciiOffsetQuotient * 20 / gridSize));
    let textSymbols = $derived(textSymbolsString.split(''));
    let asciiStep1 = $state(0);
    let asciiStep2 = $state(0.67);
    let asciiSteps = $derived([asciiStep1, asciiStep2]);
    let clusterCount = $state(20);
    let activeLayers = $state({ pixel: true, cluster: true, ascii: true, background: false });
    let frame = $state(0);

    let asciiMode = $state();

    let settings = $derived({gridSize, colorSteps, minColorValue, maxColorValue, textSymbols, canvasWidth, canvasHeight, asciiOffset, blurValue, asciiSteps, clusterCount, mediaPath: currentMediaPath, colors, activeLayers: {...activeLayers}, asciiMode, frame});

    let save = $state({
        canvas: false,
        pixelLayer: false,
        clusterLayer: false,
        asciiLayer: false
    });

    let update = $state({
        layers: true,
        colorSteps: false,
        textSymbols: false,
        media: false,
        redraw: false
    });

    $effect(() => {
        colors;
        settings;
        currentMediaPath;


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
    function handleMediaUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            if (uploadedMediaUrl) {
                URL.revokeObjectURL(uploadedMediaUrl);
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                uploadedMediaUrl = e.target.result;
                
                // Read media dimensions
                const img = new Image();
                img.onload = function() {
                    mediaSize = [img.width, img.height];
                };
                mediaSize[0] = Math.round(mediaSize[0] / 20) * 20;
                mediaSize[1] = Math.round(mediaSize[1] / 20) * 20;
                img.src = uploadedMediaUrl;
            };
            reader.readAsDataURL(file);
        }
    }

</script>

<div id="mainFlex">
    <!-- Settings -->
    <div id="sidebar">
        <div id="settings">
            <div id="upload-container">
                <input type="file" id="mediaFileInput" accept="image/*" onchange={handleMediaUpload} style="display: none;" />
                <button type="button" class={uploadedMediaUrl ? '' : 'blinkingStroke'} onclick={() => document.getElementById('mediaFileInput').click()}>
                    <img src={uploadFileIcon} alt="Upload Icon"/> upload new image/video file
                </button>
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
            {#key `${currentMediaPath}-${settings.canvasHeight}-${settings.canvasWidth}-${settings.gridSize}` }
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
    <div id="videoPlayback"></div>
    <div id="saveSection">
        <button id="saveCanvas" onclick={() => save.canvas = true}>download</button>
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

#footer > button{
    width: calc(30% + 1px);
    border: none;
    border-right: 1px solid var(--white2);
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
</style>
