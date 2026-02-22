// PreviewQueue — manages the OCR queue with drag-and-drop reordering
const PreviewQueue = {
    clips: [],        // Array of clip objects
    sortable: null,
    stripEl: null,
    emptyEl: null,
    countEl: null,
    clearBtn: null,
    processBtn: null,

    init() {
        this.stripEl = document.getElementById('queueStrip');
        this.emptyEl = document.getElementById('queueEmpty');
        this.countEl = document.getElementById('queueCount');
        this.clearBtn = document.getElementById('clearQueue');
        this.processBtn = document.getElementById('step3Next');

        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearAll());
        }

        // Initialize SortableJS on the strip
        if (this.stripEl) {
            this.sortable = Sortable.create(this.stripEl, {
                animation: 200,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                filter: '.queue-empty',
                onEnd: (evt) => {
                    // Reorder clips array to match DOM
                    this.syncOrderFromDOM();
                    this.updateNumbers();
                    document.dispatchEvent(new CustomEvent('queueReordered'));
                }
            });
        }
    },

    addClip(clip) {
        this.clips.push(clip);
        this.renderClip(clip);
        this.updateUI();
    },

    renderClip(clip) {
        if (!this.stripEl) return;

        const el = document.createElement('div');
        el.className = 'queue-item';
        el.dataset.clipId = clip.id;

        const idx = this.clips.indexOf(clip) + 1;
        el.innerHTML = `
            <span class="queue-item-number">${idx}</span>
            <button class="queue-item-remove" title="Remove">
                <span class="material-icons">close</span>
            </button>
            <img class="queue-item-thumb" src="${clip.dataUrl}" alt="${clip.label}">
            ${clip.status !== 'pending' ? `<span class="queue-item-status ${clip.status}">${clip.status}</span>` : ''}
            <div class="queue-item-label">${clip.label}</div>
        `;

        el.querySelector('.queue-item-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeClip(clip.id);
        });

        this.stripEl.appendChild(el);
    },

    removeClip(clipId) {
        this.clips = this.clips.filter(c => c.id !== clipId);
        const el = this.stripEl?.querySelector(`[data-clip-id="${clipId}"]`);
        if (el) el.remove();
        this.updateNumbers();
        this.updateUI();
        document.dispatchEvent(new CustomEvent('queueReordered'));
    },

    clearAll() {
        if (this.clips.length === 0) return;
        if (!confirm('Remove all clips from the queue?')) return;

        this.clips = [];
        this.renderAll();
        this.updateUI();
        document.dispatchEvent(new CustomEvent('queueReordered'));
    },

    renderAll() {
        if (!this.stripEl) return;

        // Remove all queue items (but keep the empty placeholder)
        this.stripEl.querySelectorAll('.queue-item').forEach(el => el.remove());

        this.clips.forEach(clip => this.renderClip(clip));
        this.updateUI();
    },

    syncOrderFromDOM() {
        if (!this.stripEl) return;
        const orderedIds = Array.from(
            this.stripEl.querySelectorAll('.queue-item')
        ).map(el => el.dataset.clipId);

        const reordered = [];
        orderedIds.forEach(id => {
            const clip = this.clips.find(c => c.id === id);
            if (clip) reordered.push(clip);
        });
        this.clips = reordered;
    },

    updateNumbers() {
        if (!this.stripEl) return;
        this.stripEl.querySelectorAll('.queue-item').forEach((el, idx) => {
            const numEl = el.querySelector('.queue-item-number');
            if (numEl) numEl.textContent = idx + 1;
        });
    },

    updateClipStatus(clipId, status) {
        const clip = this.clips.find(c => c.id === clipId);
        if (clip) clip.status = status;

        const el = this.stripEl?.querySelector(`[data-clip-id="${clipId}"]`);
        if (el) {
            // Remove existing status
            const existing = el.querySelector('.queue-item-status');
            if (existing) existing.remove();

            if (status !== 'pending') {
                const badge = document.createElement('span');
                badge.className = `queue-item-status ${status}`;
                badge.textContent = status;
                el.querySelector('.queue-item-thumb').after(badge);
            }
        }
    },

    getClipsFromSource(sourceName) {
        return this.clips.filter(c => c.sourceName === sourceName);
    },

    getClips() {
        return this.clips;
    },

    getCount() {
        return this.clips.length;
    },

    getPendingClips() {
        return this.clips.filter(c => c.status === 'pending');
    },

    updateUI() {
        // Toggle empty state
        if (this.emptyEl) {
            this.emptyEl.style.display = this.clips.length === 0 ? '' : 'none';
        }

        // Update count badge
        if (this.countEl) {
            this.countEl.textContent = this.clips.length;
        }

        // Enable/disable buttons
        if (this.clearBtn) {
            this.clearBtn.disabled = this.clips.length === 0;
        }
        if (this.processBtn) {
            this.processBtn.disabled = this.getPendingClips().length === 0;
        }
    },

    reset() {
        this.clips = [];
        this.renderAll();
        this.updateUI();
    }
};
