# Video Export Implementation

## Overview
This implementation allows users to export all frames of a loaded video as individual images packaged in ZIP files for download. To prevent memory issues with large videos, frames are automatically exported in batches of 50.

## Architecture

### 1. **videoExporter.js** (New File)
A singleton class that manages the video export process:
- **startExport()**: Initializes export parameters and starts the first batch
- **startNewBatch()**: Creates a new JSZip instance for each batch
- **addFrame()**: Adds a canvas blob to the current ZIP with sequential naming (frame_0001.png, etc.)
- **downloadCurrentBatch()**: Generates and downloads the current batch ZIP, then clears it from memory
- **finishExport()**: Downloads the final batch and completes the export
- **Progress tracking**: Provides callbacks for progress updates
- **Batch size**: 50 frames per ZIP file to prevent memory issues

### 2. **+page.svelte** (Updated)
Main component managing the export workflow:
- **State variables**:
  - `isExportingVideo`: Boolean flag indicating export in progress
  - `videoExportProgress`: Percentage of export completion (0-100)
  - `videoExportCurrentFrame`: Current frame being processed
  - `frameReadyToCapture`: Flag to prevent duplicate captures
  - `save.videoFrame`: Flag to trigger frame capture in p5.svelte

- **saveVideo()**: Initiates the export process
  1. Validates video is loaded
  2. Sets up progress and completion callbacks
  3. Starts the export with videoExporter
  4. Sets to first frame (frame 1, skipping frame 0) and triggers media update

- **$effect hooks**:
  1. Monitors when layers finish rendering and sets `frameReadyToCapture`
  2. Triggers frame capture when `frameReadyToCapture` is true
  3. Prevents media updates during export to avoid conflicts

- **UI Updates**:
  - Export progress display with progress bar
  - Current frame counter
  - Info about batch export (50 frames per file)
  - Disabled controls during export

### 3. **p5.svelte** (Updated)
Handles the actual frame capture:
- Imports `videoExporter`
- When `save.videoFrame` is true:
  1. Creates a temporary canvas with exact dimensions (prevents scaling issues)
  2. Draws the p5 canvas at exact size onto temp canvas
  3. Captures temp canvas as blob using `toBlob()`
  4. Adds blob to ZIP via `videoExporter.addFrame()`
  5. Resets `save.videoFrame` to signal completion
  6. Returns early to prevent other updates during export

## Workflow

1. **User clicks video export button** → `saveVideo()` called
2. **Export initialization**:
   - Progress tracking reset
   - First ZIP batch created
   - First frame (1) selected (skipping frame 0)
   - `update.media = true` triggers frame load

3. **Frame rendering cycle** (repeats for each frame):
   - Frame loads in p5.svelte
   - Image processing completes
   - Layers are drawn
   - `update.layers = false` signals completion
   - Parent detects ready state → sets `frameReadyToCapture = true`
   - Another effect triggers → sets `save.videoFrame = true`
   - p5.svelte captures canvas at exact size → adds to ZIP → resets flag
   - videoExporter checks if batch is complete (50 frames)
   - If batch complete: downloads ZIP, clears memory, starts new batch
   - Parent detects completion → advances to next frame OR finalizes

4. **Finalization**:
   - Final batch (remaining frames) downloaded
   - State reset
   - All callbacks cleared

## Key Features

- **Sequential processing**: One frame at a time, ensuring each is fully rendered
- **Batch export**: Automatic batching in groups of 50 frames to prevent memory overflow
- **Multiple ZIP files**: Large videos result in multiple ZIP files (video_export_part01_*.zip, video_export_part02_*.zip, etc.)
- **Exact canvas size**: Captures canvas at exact specified dimensions without scaling
- **Progress feedback**: Real-time progress bar and frame count
- **Non-blocking**: Uses async/await and callbacks
- **Memory efficient**: Clears each batch from memory after download
- **Skips frame 0**: Export starts from frame 1 to avoid duplicate with frame 0
- **User experience**: Disables controls during export to prevent conflicts
- **Proper naming**: Sequential frame numbers with leading zeros (frame_0001, frame_0002, etc.)

## Dependencies

- **JSZip**: For creating and managing ZIP files
- Installed via: `npm install jszip`

## Usage

1. Load a video file
2. Adjust settings as desired
3. Click the video export button (download icon in footer)
4. Wait for export to complete (progress shown)
5. Multiple ZIP files automatically download (one per 50 frames)

## File Naming Convention

**Exported frames**: `frame_XXXX.[png|jpg]`
- `XXXX`: 4-digit zero-padded frame number (0000, 0001, etc.)
- Format matches the selected export format (png or jpg)
- Frame 0000 contains visual from video frame 1 (frame 0 is skipped)

**ZIP files**: `video_export_partNN_timestamp.zip`
- `NN`: 2-digit zero-padded batch number (01, 02, 03, etc.)
- `timestamp`: Unix timestamp when batch was generated

## Batch Export Details

- **Batch size**: 50 frames per ZIP file
- **Memory management**: Each batch is cleared from memory after download
- **Example**: A 120-frame video produces 3 ZIP files:
  - `video_export_part01_*.zip` (frames 0000-0049)
  - `video_export_part02_*.zip` (frames 0050-0099)
  - `video_export_part03_*.zip` (frames 0100-0118)

## Error Handling

- Validates video is loaded before starting export
- Catches and logs ZIP generation errors
- Prevents duplicate exports with state guards
- Resets state on error to allow retry
- Console logging for debugging frame capture
