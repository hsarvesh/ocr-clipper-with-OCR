class OCRProcessor {
    constructor(userId) {
        this.creditsManager = new CreditsManager(userId);
        this.CREDITS_PER_PAGE = 1; // Adjust this based on your pricing model
    }

    async processImage(imageFile) {
        try {
            // Estimate number of pages (you'll need to implement this based on your OCR system)
            const estimatedPages = await this.estimatePages(imageFile);
            const requiredCredits = estimatedPages * this.CREDITS_PER_PAGE;

            // Check if user has enough credits
            const currentCredits = await this.creditsManager.getCredits();
            if (currentCredits < requiredCredits) {
                throw new Error(`Insufficient credits. Required: ${requiredCredits}, Available: ${currentCredits}`);
            }

            // Process the OCR
            const result = await this.performOCR(imageFile);

            // Deduct credits based on actual pages processed
            const actualPages = this.countProcessedPages(result);
            const creditsToDeduct = actualPages * this.CREDITS_PER_PAGE;

            await this.creditsManager.useCredits(
                creditsToDeduct,
                `OCR Processing - ${actualPages} page(s)`
            );

            return result;

        } catch (error) {
            console.error('OCR processing failed:', error);
            throw error;
        }
    }

    async estimatePages(imageFile) {
        // Implement your page estimation logic here
        // This could be based on file size, image dimensions, or other metrics
        return 1; // Default to 1 page for now
    }

    async performOCR(imageFile) {
        // Implement your OCR logic here
        // This should return the OCR results and metadata about pages processed
        return {
            text: "OCR processed text...",
            pages: 1
        };
    }

    countProcessedPages(result) {
        // Return the actual number of pages processed
        return result.pages || 1;
    }
}

// Update your existing OCR processing code to use this class
document.getElementById('process-btn').addEventListener('click', async () => {
    const imageFile = document.getElementById('image-input').files[0];
    if (!imageFile) {
        alert('Please select an image file');
        return;
    }

    try {
        const processor = new OCRProcessor(auth.currentUser.uid);
        const result = await processor.processImage(imageFile);
        
        // Display the results
        displayResults(result);

    } catch (error) {
        if (error.message.includes('Insufficient credits')) {
            // Show credit purchase prompt
            showInsufficientCreditsModal();
        } else {
            alert('Error processing image: ' + error.message);
        }
    }
});
