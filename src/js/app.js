// App — main orchestrator that wires all components together
const App = {
    init() {
        // Initialize all components
        Toast.init();
        Stepper.init();
        ImageLoader.init();
        ImageClipper.init();
        PreviewQueue.init();
        ResultsViewer.init();

        // Set up step validators
        Stepper.setValidator(1, () => true); // Layout always valid
        Stepper.setValidator(2, () => ImageLoader.getFiles().length > 0);
        Stepper.setValidator(3, () => PreviewQueue.getCount() > 0);
        Stepper.setValidator(4, () => PreviewQueue.getClips().some(c => c.status === 'done'));

        this.bindNavigation();
        this.bindStepChanges();
        this.initCredits();
    },

    bindNavigation() {
        // Step 1 → 2
        document.getElementById('step1Next')?.addEventListener('click', () => {
            Stepper.goTo(2);
        });

        // Step 2: Back / Next
        document.getElementById('step2Back')?.addEventListener('click', () => {
            Stepper.goTo(1);
        });
        document.getElementById('step2Next')?.addEventListener('click', () => {
            if (ImageLoader.getFiles().length === 0) {
                Toast.show('Please upload at least one image');
                return;
            }
            Stepper.goTo(3);
        });

        // Step 3: Back / Process All
        document.getElementById('step3Back')?.addEventListener('click', () => {
            Stepper.goTo(2);
        });
        document.getElementById('step3Next')?.addEventListener('click', () => {
            if (PreviewQueue.getCount() === 0) {
                Toast.show('Please add clips to the queue first');
                return;
            }
            this.startBatchProcessing();
        });

        // Step 5: Results actions
        document.getElementById('downloadAll')?.addEventListener('click', () => {
            DownloadManager.downloadAll();
        });
        document.getElementById('downloadAllBottom')?.addEventListener('click', () => {
            DownloadManager.downloadAll();
        });
        document.getElementById('processMore')?.addEventListener('click', () => {
            this.resetAll();
        });
        document.getElementById('processMoreBottom')?.addEventListener('click', () => {
            this.resetAll();
        });
        document.getElementById('step5Back')?.addEventListener('click', () => {
            Stepper.goTo(3);
        });
    },

    bindStepChanges() {
        document.addEventListener('stepChanged', (e) => {
            const step = e.detail.step;

            if (step === 3) {
                // Populate image list in clipper
                ImageClipper.populateImageList(ImageLoader.getFiles());
                // Update process button state
                PreviewQueue.updateUI();
            }

            if (step === 5) {
                // Render results
                ResultsViewer.render();
            }
        });
    },

    async startBatchProcessing() {
        const pendingClips = PreviewQueue.getPendingClips();
        if (pendingClips.length === 0) {
            Toast.show('No pending clips to process');
            // Go directly to results if all clips are already processed
            if (PreviewQueue.getClips().some(c => c.status === 'done')) {
                Stepper.goTo(5);
            }
            return;
        }

        // Check credits
        if (typeof CreditsManager !== 'undefined' && typeof auth !== 'undefined' && auth.currentUser) {
            try {
                const creditsManager = new CreditsManager(auth.currentUser.uid);
                const credits = await creditsManager.getCredits();
                if (credits < pendingClips.length) {
                    Toast.show(`Insufficient credits. Need ${pendingClips.length}, have ${credits}`);
                    return;
                }
            } catch (err) {
                console.warn('Credits check failed, proceeding anyway:', err);
            }
        }

        // Move to processing step
        Stepper.goTo(4);

        // Process all clips
        const result = await OCRService.processAll();

        // Deduct credits
        if (result.successCount > 0 && typeof CreditsManager !== 'undefined' && typeof auth !== 'undefined' && auth.currentUser) {
            try {
                const creditsManager = new CreditsManager(auth.currentUser.uid);
                await creditsManager.useCredits(
                    result.successCount,
                    `OCR: ${result.successCount} clip(s) processed`
                );
                this.updateCreditsUI();
            } catch (err) {
                console.error('Credits deduction error:', err);
            }
        }

        // Auto-advance to results after a short delay
        setTimeout(() => {
            Stepper.goTo(5);
        }, 1200);
    },

    async updateCreditsUI() {
        if (typeof CreditsManager !== 'undefined' && typeof auth !== 'undefined' && auth.currentUser) {
            try {
                const creditsManager = new CreditsManager(auth.currentUser.uid);
                const credits = await creditsManager.getCredits();
                const el = document.getElementById('menu-credits-amount');
                if (el) el.textContent = credits;
            } catch (err) {
                console.error('Error updating credits UI:', err);
            }
        }
    },

    initCredits() {
        if (typeof auth !== 'undefined') {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    this.updateCreditsUI();
                }
            });
        }
    },

    resetAll() {
        ImageLoader.reset();
        ImageClipper.reset();
        PreviewQueue.reset();
        if (ResultsViewer.listEl) ResultsViewer.listEl.innerHTML = '';
        Stepper.goTo(1);
        Toast.show('Ready for new images');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
