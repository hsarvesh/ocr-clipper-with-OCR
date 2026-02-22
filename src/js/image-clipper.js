// ImageClipper — Cropper.js integration for region selection
const ImageClipper = {
    cropper: null,
    currentImageIndex: -1,
    cropperImage: null,
    cropperPlaceholder: null,
    cropperControls: null,
    savedCropBox: null, // { width, height } retained for session

    init() {
        this.cropperImage = document.getElementById('cropperImage');
        this.cropperPlaceholder = document.getElementById('cropperPlaceholder');
        this.cropperControls = document.getElementById('cropperControls');

        // Zoom controls
        document.getElementById('zoomIn')?.addEventListener('click', () => {
            this.cropper?.zoom(0.1);
        });
        document.getElementById('zoomOut')?.addEventListener('click', () => {
            this.cropper?.zoom(-0.1);
        });
        document.getElementById('rotateLeft')?.addEventListener('click', () => {
            this.cropper?.rotate(-90);
        });
        document.getElementById('rotateRight')?.addEventListener('click', () => {
            this.cropper?.rotate(90);
        });
        document.getElementById('resetCrop')?.addEventListener('click', () => {
            this.cropper?.reset();
        });

        // Add to queue
        document.getElementById('addToQueue')?.addEventListener('click', () => {
            this.addCurrentCropToQueue();
        });
    },

    // Populate the left sidebar with uploaded images
    populateImageList(files) {
        const imageList = document.getElementById('imageList');
        if (!imageList) return;

        imageList.innerHTML = '';
        files.forEach((item, idx) => {
            const el = document.createElement('div');
            el.className = 'image-list-item';
            el.dataset.index = idx;
            el.innerHTML = `
                <img class="image-list-thumb" src="${item.dataUrl}" alt="${item.name}">
                <span class="image-list-name">${item.name}</span>
            `;
            el.addEventListener('click', () => {
                this.selectImage(idx);
            });
            imageList.appendChild(el);
        });

        // Auto-select first image
        if (files.length > 0) {
            this.selectImage(0);
        }
    },

    selectImage(index) {
        const files = ImageLoader.getFiles();
        if (index < 0 || index >= files.length) return;

        // Update active state in list
        document.querySelectorAll('.image-list-item').forEach((el, i) => {
            el.classList.toggle('active', i === index);
        });

        this.currentImageIndex = index;
        this.loadIntoCropper(files[index].dataUrl);
    },

    loadIntoCropper(dataUrl) {
        // Destroy existing cropper
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }

        if (!this.cropperImage) return;

        // Hide placeholder, show image & controls
        if (this.cropperPlaceholder) this.cropperPlaceholder.style.display = 'none';
        this.cropperImage.style.display = 'block';
        this.cropperImage.src = dataUrl;

        if (this.cropperControls) this.cropperControls.classList.remove('hidden');

        // Initialize Cropper.js
        const self = this;
        this.cropper = new Cropper(this.cropperImage, {
            viewMode: 1,
            dragMode: 'crop',
            autoCropArea: 0.8,
            responsive: true,
            restore: false,
            guides: true,
            center: true,
            highlight: true,
            cropBoxMovable: true,
            cropBoxResizable: true,
            background: true,
            modal: true,
            zoomOnWheel: true,
            wheelZoomRatio: 0.05,
            ready() {
                // Restore saved crop box size from previous clip
                if (self.savedCropBox) {
                    const containerData = self.cropper.getContainerData();
                    const w = Math.min(self.savedCropBox.width, containerData.width - 20);
                    const h = Math.min(self.savedCropBox.height, containerData.height - 20);
                    self.cropper.setCropBoxData({
                        left: (containerData.width - w) / 2,
                        top: (containerData.height - h) / 2,
                        width: w,
                        height: h,
                    });
                }
            },
        });
    },

    addCurrentCropToQueue() {
        if (!this.cropper) {
            Toast.show('Please select an image first');
            return;
        }

        // Save crop box size for next clip
        const cropBoxData = this.cropper.getCropBoxData();
        if (cropBoxData && cropBoxData.width > 0) {
            this.savedCropBox = { width: cropBoxData.width, height: cropBoxData.height };
        }

        const files = ImageLoader.getFiles();
        const sourceFile = files[this.currentImageIndex];
        if (!sourceFile) return;

        // Get cropped canvas
        const canvas = this.cropper.getCroppedCanvas({
            maxWidth: 2048,
            maxHeight: 2048,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });

        if (!canvas) {
            Toast.show('Unable to crop — please select a region');
            return;
        }

        // Convert to blob
        canvas.toBlob((blob) => {
            if (!blob) return;

            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            const clipCount = PreviewQueue.getClipsFromSource(sourceFile.name).length + 1;

            const clip = {
                id: Date.now() + Math.random().toString(36).substr(2, 5),
                blob,
                dataUrl,
                sourceName: sourceFile.name,
                clipNumber: clipCount,
                label: `${sourceFile.name} — Clip ${clipCount}`,
                text: null,
                status: 'pending', // pending | processing | done | error
            };

            PreviewQueue.addClip(clip);
            Toast.show(`Clip added to queue (#${PreviewQueue.getCount()})`);

            // If immediate mode is on, process this clip
            const immediateToggle = document.getElementById('immediateToggle');
            if (immediateToggle && immediateToggle.checked) {
                OCRService.processClip(clip);
            }
        }, 'image/jpeg', 0.85);
    },

    reset() {
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
        this.currentImageIndex = -1;
        if (this.cropperImage) {
            this.cropperImage.style.display = 'none';
            this.cropperImage.src = '';
        }
        if (this.cropperPlaceholder) this.cropperPlaceholder.style.display = '';
        if (this.cropperControls) this.cropperControls.classList.add('hidden');

        const imageList = document.getElementById('imageList');
        if (imageList) imageList.innerHTML = '';
    }
};
