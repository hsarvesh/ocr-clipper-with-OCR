// DownloadManager — handles single & bulk download of OCR outputs
const DownloadManager = {

    downloadSingle(clip) {
        if (!clip || !clip.text) {
            Toast.show('No text available to download');
            return;
        }

        const content = `${clip.label}\n${'='.repeat(50)}\n\n${clip.text}`;
        this.triggerDownload(content, `${clip.label.replace(/[^a-zA-Z0-9 ]/g, '_')}.txt`);
        Toast.show('Download started');
    },

    downloadAll() {
        const clips = PreviewQueue.getClips();
        const clipsWithText = clips.filter(c => c.text && c.status === 'done');

        if (clipsWithText.length === 0) {
            Toast.show('No processed text to download');
            return;
        }

        // Build content in current queue order
        const content = clipsWithText.map((clip, idx) => {
            return `[${idx + 1}] ${clip.label}\n${'='.repeat(50)}\n\n${clip.text}`;
        }).join('\n\n' + '-'.repeat(60) + '\n\n');

        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `ocr_output_${timestamp}.txt`;

        this.triggerDownload(content, filename);
        Toast.show(`Downloaded ${clipsWithText.length} result(s)`);
    },

    triggerDownload(content, filename) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
};
