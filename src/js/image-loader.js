// ImageLoader — handles file upload & drag-and-drop for multiple images
const ImageLoader = {
    files: [],       // Array of { file, dataUrl, name }
    dropZone: null,
    uploadArea: null,
    fileInput: null,
    fileList: null,
    nextBtn: null,

    init() {
        this.dropZone = document.getElementById('dropZone');
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('imageInput');
        this.fileList = document.getElementById('fileList');
        this.nextBtn = document.getElementById('step2Next');

        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Also allow clicking the upload area
        if (this.uploadArea) {
            this.uploadArea.addEventListener('click', (e) => {
                if (e.target.closest('label') || e.target.closest('input')) return;
                this.fileInput?.click();
            });
        }

        this.initDragDrop();
    },

    initDragDrop() {
        if (!this.dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
            this.dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(evt => {
            this.dropZone.addEventListener(evt, () => {
                this.uploadArea?.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            this.dropZone.addEventListener(evt, () => {
                this.uploadArea?.classList.remove('drag-over');
            });
        });

        this.dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.addFiles(files);
        });
    },

    handleFileSelect(e) {
        this.addFiles(e.target.files);
    },

    async addFiles(fileListObj) {
        const imageFiles = Array.from(fileListObj).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        for (const file of imageFiles) {
            // Skip duplicate filenames
            if (this.files.find(f => f.name === file.name && f.file.size === file.size)) continue;

            const dataUrl = await this.readAsDataUrl(file);
            this.files.push({ file, dataUrl, name: file.name });
        }

        this.renderFileList();
        this.updateNextButton();
    },

    readAsDataUrl(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    },

    removeFile(index) {
        this.files.splice(index, 1);
        this.renderFileList();
        this.updateNextButton();
    },

    renderFileList() {
        if (!this.fileList) return;
        this.fileList.innerHTML = '';

        this.files.forEach((item, idx) => {
            const el = document.createElement('div');
            el.className = 'file-item';
            const size = (item.file.size / 1024).toFixed(1);
            el.innerHTML = `
                <span class="material-icons">image</span>
                <span class="file-item-name">${item.name}</span>
                <span class="file-item-size">${size} KB</span>
                <button class="file-item-remove" data-index="${idx}" title="Remove">
                    <span class="material-icons" style="font-size:1rem;">close</span>
                </button>
            `;
            el.querySelector('.file-item-remove').addEventListener('click', () => {
                this.removeFile(idx);
            });
            this.fileList.appendChild(el);
        });
    },

    updateNextButton() {
        if (this.nextBtn) {
            this.nextBtn.disabled = this.files.length === 0;
        }
    },

    getFiles() {
        return this.files;
    },

    reset() {
        this.files = [];
        if (this.fileInput) this.fileInput.value = '';
        if (this.fileList) this.fileList.innerHTML = '';
        this.updateNextButton();
    }
};
