// Stepper — manages step navigation & indicators
const Stepper = {
    currentStep: 1,
    totalSteps: 5,
    highestStep: 1, // tracks the furthest step reached
    validators: {},

    init() {
        this.updateIndicators();

        // Make each step header clickable
        document.querySelectorAll('.step').forEach(stepEl => {
            stepEl.style.cursor = 'pointer';
            stepEl.addEventListener('click', () => {
                const target = parseInt(stepEl.dataset.step);
                if (target && target !== this.currentStep) {
                    this.goTo(target, true); // true = user-initiated click
                }
            });
        });
    },

    // Register a validation function for a step
    setValidator(step, fn) {
        this.validators[step] = fn;
    },

    goTo(step, userClick = false) {
        if (step < 1 || step > this.totalSteps) return;

        // If user clicked a step, allow going to any previously visited step freely
        // Only block forward jumps to never-visited steps that fail validation
        if (!userClick) {
            // Programmatic navigation: validate forward steps
            if (step > this.currentStep) {
                for (let s = this.currentStep; s < step; s++) {
                    if (this.validators[s] && !this.validators[s]()) return;
                }
            }
        } else {
            // User click: allow going back freely, only validate if jumping ahead of highestStep
            if (step > this.highestStep) {
                for (let s = this.currentStep; s < step; s++) {
                    if (this.validators[s] && !this.validators[s]()) {
                        Toast.show('Complete the current step first');
                        return;
                    }
                }
            }
        }

        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // Show target screen
        const target = document.getElementById(`screen${step}`);
        if (target) target.classList.remove('hidden');

        this.currentStep = step;
        if (step > this.highestStep) this.highestStep = step;
        this.updateIndicators();

        // Fire custom event
        document.dispatchEvent(new CustomEvent('stepChanged', { detail: { step } }));
    },

    next() {
        this.goTo(this.currentStep + 1);
    },

    prev() {
        this.goTo(this.currentStep - 1);
    },

    updateIndicators() {
        document.querySelectorAll('.step').forEach(stepEl => {
            const num = parseInt(stepEl.dataset.step);
            stepEl.classList.remove('active', 'completed');
            if (num < this.currentStep) {
                stepEl.classList.add('completed');
            } else if (num === this.currentStep) {
                stepEl.classList.add('active');
            }
        });
    }
};
