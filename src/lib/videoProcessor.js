import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

class VideoProcessor {
    constructor() {
        this.ffmpeg = null;
        this.loaded = false;
        this.frames = [];
        this.frameUrls = [];
        this.totalFrames = 0;
        this.videoMetadata = null;
    }

    async load() {
        if (this.loaded) return;
        
        this.ffmpeg = new FFmpeg();
        
        // Load ffmpeg core
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await this.ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        this.loaded = true;
    }

    async processVideo(videoFile, targetWidth, targetHeight, onProgress) {
        if (!this.loaded) {
            await this.load();
        }

        // Clean up previous frames
        this.cleanup();

        // Write video file to ffmpeg virtual filesystem
        await this.ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

        // Get video metadata (duration, fps)
        // We'll extract frames at reduced resolution (20x smaller)
        const scaledWidth = Math.round(targetWidth / 20);
        const scaledHeight = Math.round(targetHeight / 20);

        // Extract frames as images
        // Using a filter to scale down the video
        await this.ffmpeg.exec([
            '-i', 'input.mp4',
            '-vf', `scale=${scaledWidth}:${scaledHeight}`,
            'frame_%04d.png'
        ]);

        // Read all extracted frames
        const files = await this.ffmpeg.listDir('/');
        const frameFiles = files
            .filter(file => file.name.startsWith('frame_') && file.name.endsWith('.png'))
            .sort((a, b) => a.name.localeCompare(b.name));

        this.totalFrames = frameFiles.length;

        // Convert frames to blob URLs
        for (let i = 0; i < frameFiles.length; i++) {
            const frameData = await this.ffmpeg.readFile(frameFiles[i].name);
            const blob = new Blob([frameData.buffer], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            this.frameUrls.push(url);

            if (onProgress) {
                onProgress(i + 1, this.totalFrames);
            }
        }

        // Clean up ffmpeg virtual filesystem
        for (const file of frameFiles) {
            await this.ffmpeg.deleteFile(file.name);
        }
        await this.ffmpeg.deleteFile('input.mp4');

        return {
            totalFrames: this.totalFrames,
            frameUrls: this.frameUrls,
            width: targetWidth,
            height: targetHeight
        };
    }

    getFrame(frameNumber) {
        if (frameNumber < 0 || frameNumber >= this.frameUrls.length) {
            return null;
        }
        return this.frameUrls[frameNumber];
    }

    cleanup() {
        // Revoke all blob URLs to free memory
        for (const url of this.frameUrls) {
            URL.revokeObjectURL(url);
        }
        this.frameUrls = [];
        this.frames = [];
        this.totalFrames = 0;
        this.videoMetadata = null;
    }

    isLoaded() {
        return this.loaded;
    }

    hasFrames() {
        return this.frameUrls.length > 0;
    }
}

// Export a singleton instance
export const videoProcessor = new VideoProcessor();
