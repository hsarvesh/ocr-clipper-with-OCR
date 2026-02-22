// ResultsViewer — displays OCR results with drag-and-drop reorder
const ResultsViewer = {
    sortable: null,
    listEl: null,

    init() {
        this.listEl = document.getElementById('resultsList');
    },

    render() {
        if (!this.listEl) return;

        const clips = PreviewQueue.getClips();
        this.listEl.innerHTML = '';

        if (clips.length === 0) {
            this.listEl.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No results to display</p>';
            return;
        }

        clips.forEach((clip, idx) => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.dataset.clipId = clip.id;

            const statusLabel = clip.status === 'done' ? '' :
                clip.status === 'processing' ? '⏳ Processing...' :
                    clip.status === 'error' ? '❌ Error' : '⏸ Pending';

            const textContent = clip.text || (clip.status === 'pending' ? 'Awaiting OCR processing...' : 'No text extracted');

            card.innerHTML = `
                <div class="result-card-header">
                    <span class="drag-handle" title="Drag to reorder">
                        <span class="material-icons">drag_indicator</span>
                    </span>
                    <span class="result-card-number">${idx + 1}</span>
                    <span class="result-card-name">${clip.label} ${statusLabel}</span>
                    <div class="result-card-actions">
                        <button class="btn btn-icon copy-btn" title="Copy text" data-clip-id="${clip.id}">
                            <span class="material-icons">content_copy</span>
                        </button>
                        <button class="btn btn-icon download-btn" title="Download text" data-clip-id="${clip.id}">
                            <span class="material-icons">download</span>
                        </button>
                    </div>
                </div>
                <div class="result-card-body">
                    <div class="result-image-preview">
                        <img src="${clip.dataUrl}" alt="${clip.label}">
                    </div>
                    <div class="result-text-content">${this.escapeHtml(textContent)}</div>
                </div>
            `;

            // Copy button
            card.querySelector('.copy-btn').addEventListener('click', () => {
                this.copyClipText(clip.id);
            });

            // Download button
            card.querySelector('.download-btn').addEventListener('click', () => {
                DownloadManager.downloadSingle(clip);
            });

            this.listEl.appendChild(card);
        });

        // Init SortableJS on results list
        if (this.sortable) this.sortable.destroy();
        this.sortable = Sortable.create(this.listEl, {
            animation: 200,
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            onEnd: () => {
                this.syncOrderToQueue();
                this.updateNumbers();
            }
        });
    },

    refresh() {
        this.render();
    },

    syncOrderToQueue() {
        if (!this.listEl) return;

        const orderedIds = Array.from(
            this.listEl.querySelectorAll('.result-card')
        ).map(el => el.dataset.clipId);

        // Reorder PreviewQueue.clips to match
        const reordered = [];
        orderedIds.forEach(id => {
            const clip = PreviewQueue.clips.find(c => c.id === id);
            if (clip) reordered.push(clip);
        });
        // Add any clips not in list (shouldn't happen but safety)
        PreviewQueue.clips.forEach(c => {
            if (!reordered.includes(c)) reordered.push(c);
        });
        PreviewQueue.clips = reordered;

        // Re-render queue strip to match
        PreviewQueue.renderAll();

        document.dispatchEvent(new CustomEvent('queueReordered'));
    },

    updateNumbers() {
        if (!this.listEl) return;
        this.listEl.querySelectorAll('.result-card').forEach((card, idx) => {
            const numEl = card.querySelector('.result-card-number');
            if (numEl) numEl.textContent = idx + 1;
        });
    },

    async copyClipText(clipId) {
        const clip = PreviewQueue.clips.find(c => c.id === clipId);
        if (!clip || !clip.text) {
            Toast.show('No text to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(clip.text);
            Toast.show('Copied to clipboard!');
        } catch (err) {
            console.error('Copy failed:', err);
            Toast.show('Failed to copy');
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Listen for queue reorder events from PreviewQueue
document.addEventListener('queueReordered', () => {
    if (Stepper.currentStep === 4) {
        ResultsViewer.render();
    }
});
