async function updateCreditsDisplay(creditsManager) {
    if (!creditsManager) return;

    try {
        const credits = await creditsManager.getCredits();
        const menuCreditsDisplay = document.getElementById('menu-credits-amount');
        if (menuCreditsDisplay) {
            menuCreditsDisplay.textContent = credits;
        }
    } catch (error) {
        console.error('Error updating credits display:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Initialize after auth.js has loaded
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(function (user) {
            if (user) {
                // User is signed in, initialize credits
                const creditsManager = new CreditsManager(user.uid);
                updateCreditsDisplay(creditsManager);
            }
        });
    } else {
        console.error('Auth not initialized properly');
    }
});

// State Management
let currentStep = 1;
let processedImages = [];
let currentImageIndex = 0;

// DOM Elements
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const processButton = document.getElementById('processButton');
const statusDiv = document.getElementById('status');
const spinner = document.getElementById('spinner');
const copyButton = document.getElementById('copyButton');
const toast = document.getElementById('toast');
const fileList = document.getElementById('fileList');
const imagePreview = document.getElementById('imagePreview');
const textPreview = document.getElementById('textPreview');
const imageCounter = document.getElementById('imageCounter');
const prevImageBtn = document.getElementById('prevImage');
const nextImageBtn = document.getElementById('nextImage');

// Event Listeners
if (imageInput) imageInput.addEventListener('change', handleFileSelect);
if (copyButton) copyButton.addEventListener('click', copyToClipboard);
if (prevImageBtn) prevImageBtn.addEventListener('click', () => navigateImages(-1));
if (nextImageBtn) nextImageBtn.addEventListener('click', () => navigateImages(1));

// Navigation Functions
function getCurrentStep() {
    const activeStep = document.querySelector('.step.active');
    return activeStep ? parseInt(activeStep.dataset.step) : 1;
}

function updateStepIndicators(newStep) {
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.remove('active', 'completed');
        if (stepNum < newStep) {
            step.classList.add('completed');
        } else if (stepNum === newStep) {
            step.classList.add('active');
        }
    });
}

function resetScreenState(screenNum) {
    // Reset specific screen states when navigating
    switch (screenNum) {
        case 2:
            // Reset file upload screen
            if (fileList) fileList.innerHTML = '';
            if (processButton) processButton.disabled = true;
            break;
        case 3:
            // Reset processing screen
            const progressList = document.getElementById('progressList');
            if (progressList) progressList.innerHTML = '';
            const currentFile = document.getElementById('currentFile');
            if (currentFile) currentFile.textContent = 'Preparing...';
            break;
        case 4:
            // Reset preview screen if coming backwards
            if (!processedImages.length) {
                const previewContainer = document.getElementById('preview-container');
                if (previewContainer) previewContainer.innerHTML = '';
                if (imagePreview) imagePreview.src = '';
                if (textPreview) textPreview.textContent = '';
                if (imageCounter) imageCounter.textContent = '';
            }
            break;
    }
}

function goToStep(step) {
    const currentStep = getCurrentStep();

    // Validate navigation
    if ((step === 3 || step === 4) && !imageInput.files.length) {
        alert('Please upload files first');
        return;
    }

    if (step === 4 && !processedImages.length) {
        alert('Please process the files first');
        return;
    }

    // Update step indicators
    updateStepIndicators(step);

    // Hide all screens and show the target screen
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    const targetScreen = document.getElementById(`screen${step}`);
    if (targetScreen) targetScreen.classList.remove('hidden');

    // Reset screen state if going backwards
    if (step < currentStep) {
        for (let i = step + 1; i <= currentStep; i++) {
            resetScreenState(i);
        }
    }
}

function nextStep(currentStepNumber) {
    if (currentStepNumber === 2) {
        processImages().then(() => {
            goToStep(currentStepNumber + 1);
        });
    } else {
        goToStep(currentStepNumber + 1);
    }
}

function prevStep(currentStepNumber) {
    goToStep(currentStepNumber - 1);
}

function resetToStart() {
    processedImages = [];
    currentImageIndex = 0;
    if (imageInput) imageInput.value = '';
    if (fileList) fileList.innerHTML = '';
    if (processButton) processButton.disabled = true;

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    const screen1 = document.querySelector('#screen1');
    if (screen1) screen1.classList.remove('hidden');

    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
    const step1 = document.querySelector('.step[data-step="1"]');
    if (step1) step1.classList.add('active');
}

// Drag and Drop Handlers
if (dropZone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight);
    });

    dropZone.addEventListener('drop', handleDrop);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    if (dropZone) dropZone.querySelector('.upload-area').classList.add('drag-over');
}

function unhighlight() {
    if (dropZone) dropZone.querySelector('.upload-area').classList.remove('drag-over');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length > 0) {
        if (processButton) processButton.disabled = false;
        updateFileList(files);
    } else {
        if (processButton) processButton.disabled = true;
        if (fileList) fileList.innerHTML = '';
    }
}

function updateFileList(files) {
    if (!fileList) return;
    fileList.innerHTML = '';
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.textContent = file.name;
            fileList.appendChild(fileItem);
        }
    });
}

function showToast() {
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

async function copyToClipboard() {
    try {
        const text = processedImages[currentImageIndex]?.text || '';
        await navigator.clipboard.writeText(text);
        showToast();
    } catch (err) {
        console.error('Failed to copy text:', err);
    }
}

function updateImagePreview() {
    if (!processedImages || processedImages.length === 0) {
        if (imagePreview) imagePreview.innerHTML = '<p>No images to display</p>';
        if (textPreview) textPreview.textContent = '';
        if (imageCounter) imageCounter.textContent = 'No images';
        if (prevImageBtn) prevImageBtn.disabled = true;
        if (nextImageBtn) nextImageBtn.disabled = true;
        if (copyButton) copyButton.classList.add('hidden');
        return;
    }

    // Ensure currentImageIndex is valid
    currentImageIndex = Math.max(0, Math.min(processedImages.length - 1, currentImageIndex));
    const currentImage = processedImages[currentImageIndex];

    // Update image preview
    if (imagePreview) {
        if (currentImage.dataUrl) {
            imagePreview.innerHTML = `<img src="${currentImage.dataUrl}" alt="Preview of ${currentImage.name}">`;
        } else {
            imagePreview.innerHTML = '<p>Image preview not available</p>';
        }
    }

    // Update text preview
    if (textPreview) textPreview.textContent = currentImage.text || 'No text extracted';

    // Update counter and status
    if (imageCounter) imageCounter.textContent = `Image ${currentImageIndex + 1} of ${processedImages.length}`;

    // Update navigation buttons
    if (prevImageBtn) prevImageBtn.disabled = currentImageIndex === 0;
    if (nextImageBtn) nextImageBtn.disabled = currentImageIndex === processedImages.length - 1;

    // Show copy button if we have text
    if (copyButton) {
        if (currentImage.text) {
            copyButton.classList.remove('hidden');
        } else {
            copyButton.classList.add('hidden');
        }
    }
}

function navigateImages(direction) {
    currentImageIndex = Math.max(0, Math.min(processedImages.length - 1, currentImageIndex + direction));
    updateImagePreview();
}

function downloadAllText() {
    if (!processedImages || processedImages.length === 0) {
        alert('No processed images to download');
        return;
    }

    // Format the text content
    const content = processedImages.map(img => {
        return `${img.name}\n${img.text || 'No text extracted'}\n\n`;
    }).join('---------------------------------------------------\n');

    // Create a blob with the content
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

    // Create a temporary link and trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'extracted_text.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    // Show feedback toast
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = 'Download started!';
        showToast();
    }
}

// Utility function for delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Progress tracking functions
function updateProgress(current, total) {
    const percentage = Math.round((current / total) * 100);
    const progressBar = document.getElementById('progressBar');
    if (!progressBar) return;

    const progressText = progressBar.querySelector('.progress-text');
    const progressCount = document.getElementById('progressCount');

    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
    if (progressText) progressText.textContent = `${percentage}%`;
    if (progressCount) progressCount.textContent = `Processing ${current} of ${total} images`;
}

function addProgressItem(fileName, status, message) {
    const progressList = document.getElementById('progressList');
    if (!progressList) return;

    const item = document.createElement('div');
    item.className = 'progress-item';

    const statusIndicator = document.createElement('div');
    statusIndicator.className = `progress-item-status ${status}`;

    const text = document.createElement('div');
    text.className = 'progress-item-text';
    text.textContent = `${fileName}: ${message}`;

    item.appendChild(statusIndicator);
    item.appendChild(text);
    progressList.appendChild(item);
    progressList.scrollTop = progressList.scrollHeight;
}

async function startProcessing() {
    if (!imageInput) return;
    const files = Array.from(imageInput.files).filter(file => file.type.startsWith('image/'));
    const totalFiles = files.length;

    // Check if user has enough credits
    const creditsManager = new CreditsManager(auth.currentUser.uid);
    try {
        const currentCredits = await creditsManager.getCredits();
        if (currentCredits < totalFiles) {
            alert(`Insufficient credits. You need ${totalFiles} credits to process ${totalFiles} images, but you only have ${currentCredits} credits available.`);
            return;
        }

        // Update step indicators
        const step2El = document.querySelector('.step[data-step="2"]');
        const step3El = document.querySelector('.step[data-step="3"]');
        if (step2El) {
            step2El.classList.remove('active');
            step2El.classList.add('completed');
        }
        if (step3El) step3El.classList.add('active');

        // Show processing screen
        const screen2 = document.getElementById('screen2');
        const screen3 = document.getElementById('screen3');
        if (screen2) screen2.classList.add('hidden');
        if (screen3) screen3.classList.remove('hidden');

        // Clear previous progress
        const progressList = document.getElementById('progressList');
        const currentFile = document.getElementById('currentFile');
        if (progressList) progressList.innerHTML = '';
        if (currentFile) currentFile.textContent = 'Preparing...';

        // Start processing
        await processImages();
    } catch (error) {
        console.error('Error checking credits:', error);
        alert('An error occurred while checking credits. Please try again.');
    }
}

// Function to make API call with retries
async function makeAPICall(formData, imageType, retries = 3, baseDelay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(
                `https://asia-south1-akshar-bodh-drushti.cloudfunctions.net/akshar-chintan-v2?image_type=${imageType}`,
                {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal,
                    headers: {
                        'Accept': 'text/plain'
                    }
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 503) {
                    throw new Error('SERVICE_UNAVAILABLE');
                }
                throw new Error(`HTTP error ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            const isLastAttempt = i === retries - 1;
            const isServiceUnavailable = error.message === 'SERVICE_UNAVAILABLE';
            const isTimeout = error.name === 'AbortError';

            if (!isLastAttempt && (isServiceUnavailable || isTimeout)) {
                const waitTime = baseDelay * Math.pow(2, i); // Exponential backoff
                await delay(waitTime);
                continue;
            }
            throw error;
        }
    }
}

async function processImages() {
    return new Promise(async (resolve) => {
        if (!imageInput) {
            resolve();
            return;
        }
        const files = Array.from(imageInput.files).filter(file => file.type.startsWith('image/'));
        const imageTypeInput = document.querySelector('input[name="imageType"]:checked');
        const imageType = imageTypeInput ? imageTypeInput.value : '1column';
        const creditsManager = new CreditsManager(auth.currentUser.uid);
        processedImages = [];
        currentImageIndex = 0;
        let processedCount = 0;
        let successCount = 0;
        const totalFiles = files.length;

        // Initialize progress
        updateProgress(0, totalFiles);
        if (copyButton) copyButton.classList.add('hidden');

        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) continue;

            try {
                const currentFile = document.getElementById('currentFile');
                if (currentFile) currentFile.textContent = `Processing: ${file.name}`;
                addProgressItem(file.name, 'pending', 'Processing...');

                // Create data URL for preview
                const dataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });

                const formData = new FormData();
                formData.append('image', file);

                const text = await makeAPICall(formData, imageType);
                processedImages.push({
                    name: file.name,
                    dataUrl,
                    text
                });

                // Update progress tracking
                processedCount++;
                successCount++;
                updateProgress(processedCount, totalFiles);
                addProgressItem(file.name, 'success', 'Processing completed');

            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                const errorMessage = `Error processing ${file.name}: ${error.message}`;
                const processingStatus = document.getElementById('processingStatus');
                if (processingStatus) processingStatus.textContent = errorMessage;

                // Add error to processedImages to show in UI
                processedImages.push({
                    name: file.name,
                    dataUrl: '', // Or some error placeholder
                    text: `Error processing image: ${error.message}. Please try again or check if the image is clear and properly oriented.`
                });

                // Update progress tracking for error case
                processedCount++;
                updateProgress(processedCount, totalFiles);
                addProgressItem(file.name, 'error', `Processing failed: ${error.message}`);
            }
        }

        // Deduct credits for successfully processed images
        if (successCount > 0) {
            try {
                await creditsManager.useCredits(
                    successCount,
                    `Processed ${successCount} image${successCount > 1 ? 's' : ''}`
                );
                // Update credits display in the menu
                await updateCreditsDisplay(creditsManager);
            } catch (error) {
                console.error('Error deducting credits:', error);
                addProgressItem('Credits', 'error', 'Failed to deduct credits. Please contact support.');
            }
        }

        // Show preview screen after short delay to let user see 100% progress
        setTimeout(() => {
            // Update step indicators
            const step3El = document.querySelector('.step[data-step="3"]');
            const step4El = document.querySelector('.step[data-step="4"]');
            if (step3El) {
                step3El.classList.remove('active');
                step3El.classList.add('completed');
            }
            if (step4El) step4El.classList.add('active');

            // Move to preview screen
            const screen3 = document.getElementById('screen3');
            const screen4 = document.getElementById('screen4');
            if (screen3) screen3.classList.add('hidden');
            if (screen4) screen4.classList.remove('hidden');

            // Ensure we show the first image if we have processed images
            const processingStatus = document.getElementById('processingStatus');
            if (processedImages.length > 0) {
                currentImageIndex = 0;
                updateImagePreview();
                // Update the processing status for screen readers
                if (processingStatus) {
                    processingStatus.textContent =
                        `Processing complete. Showing ${processedImages.length} images. Currently displaying ${processedImages[0].name}`;
                }
            } else {
                if (processingStatus) processingStatus.textContent = 'No images were processed';
            }

            resolve(); // Resolve the promise after processing is complete
        }, 1000); // 1 second delay
    });
}
