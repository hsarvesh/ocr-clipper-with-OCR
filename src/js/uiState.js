// UI State Management
export class UIStateManager {
    constructor() {
        this.state = {
            currentStep: 1,
            processedImages: [],
            currentImageIndex: 0,
            isProcessing: false
        };

        this.elements = {
            screens: {},
            stepIndicators: {},
            progressBar: null,
            progressText: null,
            progressCount: null,
            progressList: null
        };
    }

    initialize() {
        // Initialize screens
        document.querySelectorAll('.screen').forEach(screen => {
            this.elements.screens[screen.dataset.screen] = screen;
        });

        // Initialize step indicators
        document.querySelectorAll('.step').forEach(step => {
            this.elements.stepIndicators[step.dataset.step] = step;
        });

        // Initialize progress elements
        this.elements.progressBar = document.getElementById('progressBar');
        this.elements.progressText = this.elements.progressBar?.querySelector('.progress-text');
        this.elements.progressCount = document.getElementById('progressCount');
        this.elements.progressList = document.getElementById('progressList');
    }

    updateProgress(current, total) {
        const percentage = Math.round((current / total) * 100);
        
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${percentage}%`;
            this.elements.progressBar.setAttribute('aria-valuenow', percentage);
        }

        if (this.elements.progressText) {
            this.elements.progressText.textContent = `${percentage}%`;
        }

        if (this.elements.progressCount) {
            this.elements.progressCount.textContent = `Processing ${current} of ${total} images`;
        }
    }

    addProgressItem(fileName, status, message) {
        if (!this.elements.progressList) return;

        const item = document.createElement('div');
        item.className = 'progress-item';
        
        const statusIndicator = document.createElement('div');
        statusIndicator.className = `progress-item-status ${status}`;
        
        const text = document.createElement('div');
        text.className = 'progress-item-text';
        text.textContent = `${fileName}: ${message}`;
        
        item.appendChild(statusIndicator);
        item.appendChild(text);
        this.elements.progressList.appendChild(item);
        this.elements.progressList.scrollTop = this.elements.progressList.scrollHeight;
    }

    navigateToStep(step) {
        // Hide all screens
        Object.values(this.elements.screens).forEach(screen => {
            screen.classList.add('hidden');
        });

        // Show target screen
        const targetScreen = this.elements.screens[step];
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
        }

        // Update step indicators
        Object.entries(this.elements.stepIndicators).forEach(([stepNum, indicator]) => {
            indicator.classList.remove('active', 'completed');
            if (stepNum < step) {
                indicator.classList.add('completed');
            } else if (stepNum === step) {
                indicator.classList.add('active');
            }
        });

        this.state.currentStep = step;
    }

    updateImagePreview() {
        const imagePreview = document.getElementById('imagePreview');
        const textPreview = document.getElementById('textPreview');
        const imageCounter = document.getElementById('imageCounter');
        const prevImageBtn = document.getElementById('prevImage');
        const nextImageBtn = document.getElementById('nextImage');
        const copyButton = document.getElementById('copyButton');

        if (!this.state.processedImages || this.state.processedImages.length === 0) {
            imagePreview.innerHTML = '<p>No images to display</p>';
            textPreview.textContent = '';
            imageCounter.textContent = 'No images';
            prevImageBtn.disabled = true;
            nextImageBtn.disabled = true;
            copyButton.classList.add('hidden');
            return;
        }

        // Ensure currentImageIndex is valid
        this.state.currentImageIndex = Math.max(0, 
            Math.min(this.state.processedImages.length - 1, this.state.currentImageIndex));
        
        const currentImage = this.state.processedImages[this.state.currentImageIndex];

        // Update image preview
        if (currentImage.dataUrl) {
            imagePreview.innerHTML = `<img src="${currentImage.dataUrl}" alt="Preview of ${currentImage.name}">`;
        } else {
            imagePreview.innerHTML = '<p>Image preview not available</p>';
        }

        // Update text preview
        textPreview.textContent = currentImage.text || 'No text extracted';

        // Update counter and navigation
        imageCounter.textContent = `Image ${this.state.currentImageIndex + 1} of ${this.state.processedImages.length}`;
        prevImageBtn.disabled = this.state.currentImageIndex === 0;
        nextImageBtn.disabled = this.state.currentImageIndex === this.state.processedImages.length - 1;

        // Show/hide copy button
        if (currentImage.text) {
            copyButton.classList.remove('hidden');
        } else {
            copyButton.classList.add('hidden');
        }
    }

    resetState() {
        this.state = {
            currentStep: 1,
            processedImages: [],
            currentImageIndex: 0,
            isProcessing: false
        };

        if (this.elements.progressList) {
            this.elements.progressList.innerHTML = '';
        }

        this.navigateToStep(1);
    }
}
