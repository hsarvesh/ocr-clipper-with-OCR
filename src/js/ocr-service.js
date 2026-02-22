const OCRService = {
    API_URL: 'https://asia-south1-akshar-bodh-drushti.cloudfunctions.net/akshar-chintan-v2',
    TIMEOUT: 120000,
    RETRIES: 3,
    BASE_DELAY: 2000,
    isProcessing: false,

    getImageType() {
        const radio = document.querySelector('input[name="imageType"]:checked');
        return radio ? radio.value : '1column';
    },

    // Process a single clip (used in immediate mode)
    async processClip(clip) {
        if (clip.status === 'done') return;

        const imageType = this.getImageType();
        PreviewQueue.updateClipStatus(clip.id, 'processing');

        try {
            const text = await this.makeAPICall(clip.blob, imageType);
            clip.text = text;
            clip.status = 'done';
            PreviewQueue.updateClipStatus(clip.id, 'done');

            // Update results if visible
            ResultsViewer.refresh();
            Toast.show('OCR complete');
        } catch (error) {
            clip.text = `Error: ${error.message}`;
            clip.status = 'error';
            PreviewQueue.updateClipStatus(clip.id, 'error');
            console.error(`OCR Error for clip ${clip.id}:`, error);
            Toast.show(`OCR failed: ${error.message}`);
        }
    },

    // Process all pending clips (batch mode)
    async processAll(onProgress) {
        this.isProcessing = true;
        const clips = PreviewQueue.getClips();
        const pendingClips = clips.filter(c => c.status === 'pending' || c.status === 'error');
        const total = pendingClips.length;
        const imageType = this.getImageType();

        let processed = 0;
        let successCount = 0;

        // Update UI
        const progressBar = document.getElementById('progressBar');
        const progressCount = document.getElementById('progressCount');
        const currentFile = document.getElementById('currentFile');
        const progressList = document.getElementById('progressList');

        if (progressList) progressList.innerHTML = '';
        this.updateProgress(0, total);

        for (const clip of pendingClips) {
            if (!this.isProcessing) break; // Allow cancellation

            if (currentFile) currentFile.textContent = `Processing: ${clip.label}`;
            PreviewQueue.updateClipStatus(clip.id, 'processing');
            this.addProgressItem(clip.label, 'pending', 'Processing...');

            try {
                const text = await this.makeAPICall(clip.blob, imageType);
                clip.text = text;
                clip.status = 'done';

                processed++;
                successCount++;
                PreviewQueue.updateClipStatus(clip.id, 'done');
                this.updateProgress(processed, total);
                this.addProgressItem(clip.label, 'success', 'Completed');

            } catch (error) {
                clip.text = `Error: ${error.message}`;
                clip.status = 'error';

                processed++;
                PreviewQueue.updateClipStatus(clip.id, 'error');
                this.updateProgress(processed, total);
                this.addProgressItem(clip.label, 'error', `Failed: ${error.message}`);
                console.error(`OCR error for ${clip.label}:`, error);
            }
        }

        if (currentFile) currentFile.textContent = 'Processing complete!';
        this.isProcessing = false;

        return { total, successCount, failedCount: total - successCount };
    },

    async makeAPICall(blob, imageType, retries = this.RETRIES) {
        for (let i = 0; i < retries; i++) {
            try {
                // Create fresh FormData for each attempt (streams can't be reused)
                const formData = new FormData();
                formData.append('image', blob, 'clip.jpg');

                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    controller.abort('OCR request timed out');
                }, this.TIMEOUT);

                const response = await fetch(
                    `${this.API_URL}?image_type=${imageType}`,
                    {
                        method: 'POST',
                        body: formData,
                        signal: controller.signal,
                        headers: { 'Accept': 'text/plain' }
                    }
                );

                clearTimeout(timeoutId);

                if (!response.ok) {
                    if (response.status === 503) throw new Error('SERVICE_UNAVAILABLE');
                    throw new Error(`HTTP error ${response.status}`);
                }

                return await response.text();
            } catch (error) {
                const isLast = i === retries - 1;
                const isRetryable = error.message === 'SERVICE_UNAVAILABLE' || error.name === 'AbortError';

                if (!isLast && isRetryable) {
                    const waitTime = this.BASE_DELAY * Math.pow(2, i);
                    console.warn(`Retry ${i + 1}/${retries} after ${waitTime}ms: ${error.message}`);
                    await new Promise(r => setTimeout(r, waitTime));
                    continue;
                }
                throw error;
            }
        }
    },

    updateProgress(current, total) {
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        const progressBar = document.getElementById('progressBar');
        const progressCount = document.getElementById('progressCount');

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
            const textEl = progressBar.querySelector('.progress-text');
            if (textEl) textEl.textContent = `${percentage}%`;
        }
        if (progressCount) {
            progressCount.textContent = `Processing ${current} of ${total} clips`;
        }
    },

    addProgressItem(name, status, message) {
        const list = document.getElementById('progressList');
        if (!list) return;

        const item = document.createElement('div');
        item.className = 'progress-item';
        item.innerHTML = `
            <div class="progress-item-status ${status}"></div>
            <div class="progress-item-text">${name}: ${message}</div>
        `;
        list.appendChild(item);
        list.scrollTop = list.scrollHeight;
    }
};
