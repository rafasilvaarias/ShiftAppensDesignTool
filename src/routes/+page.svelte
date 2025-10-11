<script>
    import P5 from "./p5.svelte";
    let imageSize = $state([1920, 1080]);
    
    // Image upload variables
    let uploadedImageFile = $state(null);
    let uploadedImageUrl = $state(null);
    let currentImagePath = $derived(uploadedImageUrl || '/UUUU.jpg');

    let presetColors = [
        { darker: "#10400C", lighter: "#478530", ascii: "#9DD492", name: "Green" },
        { darker: "#7B3100", lighter: "#CE5744", ascii: "#E6EB8E", name: "Orange" },
        { darker: "#1D2399", lighter: "#4555CF", ascii: "#96C1F7", name: "Blue" },
        { darker: "#761968", lighter: "#BA58A7", ascii: "#F69EE3", name: "Pink" },
        { darker: "#404040", lighter: "#8B8B8B", ascii: "#F2F2F1", name: "Gray" },
    ]
    let colors = $state({darker: presetColors[2].darker, lighter: presetColors[2].lighter, ascii: presetColors[3].ascii});
    
    let textSymbolsString = $state(" .;sf@");
    let asciiOffsetQuotient = $state(5);

    let blurValue = $state(4);
    let minColorValue = $state(0);
    let maxColorValue = $state(255);
    let colorSteps = $state(10);
    let gridSize = $state(20);
    let canvasWidth = $derived(imageSize[0]);
    let canvasHeight = $derived(imageSize[1]);
    let asciiOffset = $derived(Math.floor(asciiOffsetQuotient * 20 / gridSize));
    let textSymbols = $derived(textSymbolsString.split(''));
    let asciiSteps = [0,0.67];
    let clusterCount = $state(20);

    let settings = $derived({gridSize, colorSteps, minColorValue, maxColorValue, textSymbols, canvasWidth, canvasHeight, asciiOffset, blurValue, asciiSteps, clusterCount});

    let save = $state(false);
    let update = $state(true);
    let updateColorSteps = $state(false);
    let updateTextSymbols = $state(false);
    let redraw = $state(false);

    $effect(() => {
        colors;
        settings;
        currentImagePath;


        return() => {
            update = true;
        }
    });

    $effect(() => {
        colorSteps;
        minColorValue;
        maxColorValue;
        return() => {
            updateColorSteps = true;
        }
    });

    $effect(() => {
        textSymbols;
        return() => {
            updateTextSymbols = true;
        }
    });

    // Image upload handler
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            // Clean up previous image URL if it exists
            if (uploadedImageUrl) {
                URL.revokeObjectURL(uploadedImageUrl);
            }
            
            uploadedImageFile = file;
            uploadedImageUrl = URL.createObjectURL(file);
        }
    }

    // Clear uploaded image
    function clearUploadedImage() {
        if (uploadedImageUrl) {
            URL.revokeObjectURL(uploadedImageUrl);
        }
        uploadedImageFile = null;
        uploadedImageUrl = null;
        
        // Reset the file input
        const fileInput = document.getElementById('imageFileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    }

</script>

<div id="mainFlex">
    <!-- Settings -->
    <div id="settings">
        <div id="parameters">
            <div id="imageSizing">
                <h2>Image Size</h2>
                <div class="overflowX">
                    <button type="button" onclick={() => imageSize = [1920, 1080]}>Full HD <br>1920 x 1080</button>
                    <button type="button" onclick={() => imageSize = [1080, 1440]}>IG Post <br>1080 x 1440</button>
                    <button type="button" onclick={() => imageSize = [1080, 1920]}>Ig Reel<br>1080 x 1920</button>
                    <button type="button" onclick={() => imageSize = [1080, 1080]}>Square <br>1080 x 1080</button>
                </div>
                <br>
                <input type="number" min="20" max="2000" bind:value={imageSize[0]}/>
                <input type="number" min="20" max="2000" bind:value={imageSize[1]}/>
            </div>
            <hr />
            <div id="imageUpload">
                <h2>Upload Image</h2>
                <div class="upload-container">
                    <input type="file" id="imageFileInput" accept="image/*" onchange={handleImageUpload} style="display: none;" />
                    <button type="button" onclick={() => document.getElementById('imageFileInput').click()}>
                        {uploadedImageFile ? 'Change Image' : 'Upload Image'}
                    </button>
                    {#if uploadedImageFile}
                        <p class="uploaded-filename">{uploadedImageFile.name}</p>
                        <button type="button" onclick={clearUploadedImage} class="clear-button">Use Default Image</button>
                    {/if}
                </div>
            </div>
            <hr />
            <div id="gridSizing">
                <h2>Grid Size</h2>
                {#if canvasWidth % 20 == 0 && canvasHeight % 20 == 0}
                    <button type="button" onclick={() => gridSize = 20}>20px</button>
                {/if}
                {#if canvasWidth % 40 == 0 && canvasHeight % 40 == 0}
                    <button type="button" onclick={() => gridSize = 40}>40px</button>
                {/if}
                {#if canvasWidth % 80 == 0 && canvasHeight % 80 == 0}
                    <button type="button" onclick={() => gridSize = 80}>80px</button>
                {/if}
            </div>
            <hr />
            <div id="color">
                <h2>Colors</h2>
                <input type="range" min="0" max="255" bind:value={minColorValue} />
                <input type="range" min="0" max="255" bind:value={maxColorValue} />
                <input type="number" min="3" max="20" bind:value={colorSteps} />
                <h3>Gradient Color</h3>
                    {#each presetColors as preset}
                        <button type="button" onclick={() => colors = {...colors, darker: preset.darker, lighter: preset.lighter}} style="background-color: {preset.darker}">{preset.name}</button>
                    {/each}
                    <br />
                    <input type="color" bind:value={colors.darker} />
                    <input type="color" bind:value={colors.lighter} />
                <h3>ASCII Color</h3>
                    {#each presetColors as preset}
                        <button type="button" onclick={() => colors = {...colors, ascii: preset.ascii}} style="background-color: {preset.ascii}">{preset.name}</button>
                    {/each}
                    <br />
                    <input type="color" bind:value={colors.ascii} />
            </div>
            <hr />
            <div id="Other Settings">
                <h2>Other Settings</h2>
                <label for="asciiOffset">ASCII Offset</label>
                <input id="asciiOffset" type="number" min="0" max="10" bind:value={asciiOffsetQuotient} />
                <label for="textSymbols">Text Symbols</label>
                <input id="textSymbols" type="text" bind:value={textSymbolsString} />
                <label for="blurValue">Blur Value</label>
                <input id="blurValue" type="number" min="0" max="10" bind:value={blurValue} />
                <label for="clusterCount">Max Clusters</label>
                <input id="clusterCount" type="number" min="1" max="50" bind:value={clusterCount} />
            </div>
        </div>
        <button onclick={save=true}>Save Image</button>
        <button onclick={redraw=true}>Redraw</button>
    </div>
    <!-- Display Image-->
    <div id="display">
        {#if canvasWidth % 20 == 0 && canvasHeight % 20 == 0}
            {#key `${currentImagePath}-${settings.canvasHeight}-${settings.canvasWidth}-${settings.gridSize}` }
                <P5 imagePath={currentImagePath} bind:save bind:update bind:updateColorSteps bind:updateTextSymbols bind:redraw {colors} {settings} />
            {/key}
        {:else}
            <p>Image Size has to be divisible by 20px</p>
        {/if}
    </div>
</div>

<style>





#mainFlex {
    display: flex;
    flex-direction: row;
    width: 100%;
    height:calc(100svh - 20px);
    gap: 20px;
}

#settings {
    min-width: 30%;
    max-width: 30%;
    height: inherit;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

#parameters {
    overflow-y: scroll;
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

:global(body) {
    margin: 10px;
    padding: 0px;
}

.overflowX {
    display: flex;
    flex-direction: row;
    gap: 5px;
    overflow-x: scroll;
}

#imageUpload .upload-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

#imageUpload button {
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f8f9fa;
    cursor: pointer;
    transition: background-color 0.2s;
}

#imageUpload button:hover {
    background-color: #e9ecef;
}

#imageUpload .uploaded-filename {
    font-size: 0.9em;
    color: #666;
    margin: 0;
    word-break: break-all;
}

#imageUpload .clear-button {
    background-color: #dc3545;
    color: white;
    border-color: #dc3545;
}

#imageUpload .clear-button:hover {
    background-color: #c82333;
}
</style>
