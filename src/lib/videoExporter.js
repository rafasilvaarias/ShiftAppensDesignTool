import JSZip from 'jszip';

class VideoExporter {
    constructor() {
        this.zip = null;
        this.isExporting = false;
        this.currentFrame = 0;
        this.totalFrames = 0;
        this.progress = 0;
        this.onProgressCallback = null;
        this.onCompleteCallback = null;
        this.onFrameCapturedCallback = null;
        this.exportFormat = 'png';
        this.batchSize = 50;
        this.currentBatch = 0;
        this.totalBatches = 0;
    }

    startExport(totalFrames, exportFormat = 'png') {
        this.isExporting = true;
        this.currentFrame = 0;
        this.totalFrames = totalFrames;
        this.progress = 0;
        this.exportFormat = exportFormat;
        this.currentBatch = 0;
        this.totalBatches = Math.ceil(totalFrames / this.batchSize);
        
        // Start first batch
        this.startNewBatch();
    }

    startNewBatch() {
        this.zip = new JSZip();
    }

    addFrame(blob) {
        if (!this.isExporting || !this.zip) {
            console.error('Export not started or already finished');
            return false;
        }

        const frameNumber = String(this.currentFrame).padStart(4, '0');
        const fileName = `frame_${frameNumber}.${this.exportFormat}`;
        this.zip.file(fileName, blob);

        console.log(`Added frame ${this.currentFrame} of ${this.totalFrames - 1}`);

        this.currentFrame++;
        this.progress = Math.round((this.currentFrame / this.totalFrames) * 100);

        if (this.onProgressCallback) {
            this.onProgressCallback(this.currentFrame, this.totalFrames, this.progress);
        }

        const hasMore = this.currentFrame < this.totalFrames;
        const batchComplete = this.currentFrame % this.batchSize === 0 && hasMore;

        if (batchComplete) {
            // Download current batch and start new one
            this.downloadCurrentBatch().then(() => {
                this.currentBatch++;
                this.startNewBatch();
                
                // Notify that we're ready for next frame
                if (this.onFrameCapturedCallback && this.isExporting) {
                    this.onFrameCapturedCallback(hasMore);
                }
            });
        } else {
            // Notify that frame was captured and whether there are more frames
            if (this.onFrameCapturedCallback && this.isExporting) {
                this.onFrameCapturedCallback(hasMore);
            }
        }

        return hasMore;
    }

    async downloadCurrentBatch() {
        if (!this.zip) {
            return;
        }

        try {
            const blob = await this.zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            const batchNum = String(this.currentBatch + 1).padStart(2, '0');
            link.download = `video_export_part${batchNum}_${Date.now()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            // Clear the zip to free memory
            this.zip = null;
        } catch (error) {
            console.error('Error creating batch ZIP file:', error);
            throw error;
        }
    }

    async finishExport() {
        if (!this.zip) {
            console.error('No zip to export');
            return;
        }

        if (!this.isExporting) {
            console.error('Already finished export');
            return;
        }

        // Immediately mark as not exporting to prevent multiple calls
        this.isExporting = false;

        try {
            // Download the final batch
            await this.downloadCurrentBatch();
            
            if (this.onCompleteCallback) {
                this.onCompleteCallback();
            }

            this.reset();
        } catch (error) {
            console.error('Error creating final ZIP file:', error);
            this.reset();
            throw error;
        }
    }

    reset() {
        this.zip = null;
        this.isExporting = false;
        this.currentFrame = 0;
        this.totalFrames = 0;
        this.progress = 0;
        this.currentBatch = 0;
        this.totalBatches = 0;
        this.onFrameCapturedCallback = null;
        this.onProgressCallback = null;
        this.onCompleteCallback = null;
    }

    onProgress(callback) {
        this.onProgressCallback = callback;
    }

    onComplete(callback) {
        this.onCompleteCallback = callback;
    }

    onFrameCaptured(callback) {
        this.onFrameCapturedCallback = callback;
    }

    getZip() {
        return this.zip;
    }

    getIsExporting() {
        return this.isExporting;
    }

    getCurrentFrame() {
        return this.currentFrame;
    }

    getProgress() {
        return this.progress;
    }
}

// Export a singleton instance
export const videoExporter = new VideoExporter();
