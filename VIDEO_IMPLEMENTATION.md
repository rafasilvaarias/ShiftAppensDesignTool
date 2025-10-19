# Video Compatibility Implementation

## Overview
This implementation adds video processing capabilities to the Shift Appens Design Tool. Videos are converted to a series of frames on the page side, which can then be navigated using frame controls.

## How It Works

### 1. Video Processing Module (`src/lib/videoProcessor.js`)
- **Singleton Pattern**: A single `VideoProcessor` instance handles all video operations
- **FFmpeg.wasm Integration**: Uses FFmpeg in the browser for robust video handling
- **Frame Extraction**: Converts videos into individual PNG frames
- **Automatic Scaling**: Reduces frame dimensions by 20x for efficient processing (matching the sketch's data collection size)
- **Memory Management**: Properly cleans up blob URLs to prevent memory leaks

### 2. Page-Side Processing (`src/routes/+page.svelte`)
- **Unified Upload**: File input accepts both images and videos
- **Automatic Detection**: Determines file type and processes accordingly
- **Progress Tracking**: Shows real-time progress during video processing
- **Frame Management**: Stores all extracted frames as blob URLs
- **Frame Selection**: Frame slider in footer controls which frame is sent to the P5 sketch

### 3. Frame Control System
- **Dynamic Controls**: Footer video playback section shows frame count and current frame
- **Reactive Updates**: Changes to frame slider automatically update the displayed frame
- **Seamless Integration**: Frame data is passed to P5 sketch through the existing `mediaPath` parameter

## Key Features

### Video Processing
- Accepts standard video formats (MP4, WebM, etc.)
- Automatically extracts video dimensions
- Scales down frames to 1/20th resolution for efficient processing
- Maintains aspect ratio (rounded to nearest 20px for grid compatibility)

### Frame Navigation
- Slider control for frame-by-frame navigation
- Displays current frame number and total frame count
- Real-time preview updates as you scrub through frames

### Memory Efficiency
- Frames are stored as blob URLs (client-side only)
- Automatic cleanup when loading new media
- Proper resource disposal on component unmount

### Processing Feedback
- Progress bar during video extraction
- Percentage completion display
- Non-blocking UI during processing

## Technical Details

### Dependencies Added
- `@ffmpeg/ffmpeg`: FFmpeg WebAssembly port for video processing
- `@ffmpeg/util`: Utility functions for FFmpeg.wasm

### Configuration Changes
- **vite.config.js**: Added CORS headers required for SharedArrayBuffer (needed by FFmpeg.wasm)
- Headers set: `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`
- Excluded FFmpeg packages from Vite optimization for better performance

### State Management
New reactive states added:
- `isVideo`: Boolean flag for video vs image
- `videoFrames`: Array of frame URLs
- `totalVideoFrames`: Total number of extracted frames
- `isProcessingVideo`: Processing status flag
- `videoProcessingProgress`: Progress percentage
- `currentFrame`: Currently selected frame number
- `currentFrameUrl`: Derived state that returns the appropriate frame URL

### Integration Points
1. **File Upload**: Modified `handleMediaUpload()` to handle both images and videos
2. **Frame URL Derivation**: `currentFrameUrl` automatically provides the right frame to the P5 sketch
3. **Settings Object**: Updated to use `currentFrameUrl` instead of `currentMediaPath`
4. **P5 Component Key**: Changed to react to `currentFrameUrl` for proper redraws

## Usage

1. **Upload Video**: Click the upload button and select a video file
2. **Wait for Processing**: The tool will extract all frames (progress shown)
3. **Navigate Frames**: Use the slider in the footer to scrub through frames
4. **Apply Effects**: All existing effects work on the selected frame
5. **Export**: Save individual frames or export as usual

## Performance Considerations

- Videos are processed entirely in the browser (no server required)
- Frame extraction happens once per video upload
- All frames are kept in memory for instant navigation
- For very long videos, consider the memory impact
- Frame resolution is automatically reduced to match the sketch's processing size

## Future Enhancements

Possible improvements:
- Frame export as image sequence
- Video export (reassemble frames with effects applied)
- Frame rate control
- Partial frame loading for very long videos
- Video trimming capabilities
- Timeline preview thumbnails
