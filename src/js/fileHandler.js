// File handling utilities
export const fileHandler = {
    async readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    },

    isImageFile(file) {
        return file.type.startsWith('image/');
    },

    downloadText(processedImages) {
        if (!processedImages || processedImages.length === 0) {
            throw new Error('No processed images to download');
        }

        const content = processedImages
            .map(img => `${img.name}\n${img.text || 'No text extracted'}\n\n`)
            .join('---------------------------------------------------\n');

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'extracted_text.txt';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        return true;
    },

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy text:', err);
            return false;
        }
    }
};
