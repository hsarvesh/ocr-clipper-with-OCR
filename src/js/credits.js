// Credits management system
const db = firebase.firestore();

class CreditsManager {
    constructor(userId) {
        this.userId = userId;
        this.userRef = db.collection('users').doc(userId);
        this.transactionsRef = db.collection('transactions');
        this.processingHistoryRef = db.collection('processing_history');
    }

    async getCredits() {
        const doc = await this.userRef.get();
        return doc.exists ? doc.data().credits || 0 : 0;
    }

    async addTestCredits(amount) {
        const credits = parseInt(amount);
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(this.userRef);
            const currentCredits = userDoc.exists ? userDoc.data().credits || 0 : 0;

            transaction.set(this.userRef, {
                credits: currentCredits + credits
            }, { merge: true });

            // Record the test transaction
            const transactionDoc = this.transactionsRef.doc();
            transaction.set(transactionDoc, {
                userId: this.userId,
                type: 'test_addition',
                credits: credits,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                description: `Added ${credits} test credits`
            });
        });
    }

    async useCredits(creditsToUse, description) {
        const credits = parseInt(creditsToUse);
        try {
            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(this.userRef);
                if (!userDoc.exists) {
                    throw new Error('User not found');
                }

                const currentCredits = userDoc.data().credits || 0;
                if (currentCredits < credits) {
                    throw new Error('Insufficient credits');
                }

                transaction.update(this.userRef, {
                    credits: currentCredits - credits
                });

                // Record the usage transaction
                const transactionDoc = this.transactionsRef.doc();
                transaction.set(transactionDoc, {
                    userId: this.userId,
                    type: 'usage',
                    credits: credits,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    description: description
                });
            });
            return true;
        } catch (error) {
            console.error('Error using credits:', error);
            throw error;
        }
    }

    async getTransactionHistory() {
        try {
            // Get all transactions
            const transactionsSnapshot = await this.transactionsRef
                .where('userId', '==', this.userId)
                .orderBy('timestamp', 'desc')
                .limit(50) // Limit to last 50 transactions for better performance
                .get();

            // Get processing history
            const processingSnapshot = await this.processingHistoryRef
                .where('userId', '==', this.userId)
                .orderBy('timestamp', 'desc')
                .limit(50) // Limit to last 50 entries
                .get();

            // Combine and format transactions
            const transactions = transactionsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate() || new Date(),
                    formatted: this.formatTransaction({
                        type: data.type,
                        description: data.description,
                        credits: data.credits,
                        timestamp: data.timestamp?.toDate() || new Date()
                    })
                };
            });

            // Format processing history entries
            const processingHistory = processingSnapshot.docs.map(doc => {
                const data = doc.data();
                const transaction = {
                    id: doc.id,
                    type: 'processing',
                    userId: data.userId,
                    credits: data.creditsUsed || 1,
                    timestamp: data.timestamp?.toDate() || new Date(),
                    description: `Processed ${data.fileCount || 1} file(s)`,
                    details: {
                        files: data.files || [],
                        results: data.results || [],
                        status: data.status || 'completed'
                    }
                };
                return {
                    ...transaction,
                    formatted: this.formatTransaction(transaction)
                };
            });

            // Combine all history items and sort by timestamp
            const allHistory = [...transactions, ...processingHistory].sort((a, b) => {
                return (b.timestamp || new Date()) - (a.timestamp || new Date());
            });

            return allHistory;
        } catch (error) {
            console.error('Error fetching history:', error);
            throw new Error('Failed to load history. Please try again.');
        }
    }

    formatTransaction(transaction) {
        if (!transaction) {
            return {
                icon: 'error',
                description: 'Invalid Transaction',
                amountPrefix: '',
                timestamp: new Date(),
                amount: 0,
                status: 'error',
                type: 'error'
            };
        }

        const type = transaction.type || 'unknown';
        let icon, description, amountPrefix;

        switch (type) {
            case 'test_addition':
                icon = 'add_circle';
                amountPrefix = '+';
                description = transaction.description || 'Test Credits Added';
                break;
            case 'usage':
                icon = 'remove_circle';
                amountPrefix = '-';
                description = transaction.description || 'Credits Used';
                break;
            case 'processing':
                icon = 'description';
                amountPrefix = '-';
                description = transaction.description || 'Image Processing';
                break;
            default:
                icon = 'receipt';
                amountPrefix = '';
                description = transaction.description || 'Transaction';
        }

        return {
            icon,
            description,
            amountPrefix,
            timestamp: transaction.timestamp || new Date(),
            amount: transaction.credits || 0,
            status: transaction.status || 'completed',
            type: type
        };
    }
}

// Initialize credits display
function initializeCreditsDisplay() {
    // Update credits display when user signs in
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log('Initializing credits for user:', user.uid);
            const creditsManager = new CreditsManager(user.uid);
            updateCreditsDisplay(creditsManager);
        } else {
            console.log('No user signed in, clearing credits display');
            updateCreditsDisplay(null);
        }
    });
}

// Update credits display
async function updateCreditsDisplay(creditsManager) {
    const allElements = [
        ...document.querySelectorAll('.credits-amount'),
        ...document.querySelectorAll('.credits-amount-lg'),
    ].filter(el => el != null);

    if (!creditsManager) {
        allElements.forEach(el => { el.textContent = '-'; });
        return;
    }

    try {
        console.log('Fetching credits...');
        const credits = await creditsManager.getCredits();
        console.log('Credits fetched:', credits);

        allElements.forEach(el => {
            el.textContent = credits.toString();
            if (el.classList) {
                el.classList.add('credits-updated');
                setTimeout(() => el.classList.remove('credits-updated'), 1000);
            }
        });
    } catch (error) {
        console.error('Error updating credits display:', error);
        allElements.forEach(el => { el.textContent = 'Error'; });
    }
}

// Add animation style for credits update
const style = document.createElement('style');
style.textContent = `
    .credits-updated {
        animation: creditsUpdate 1s ease;
    }
    @keyframes creditsUpdate {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Initialize credits system
document.addEventListener('DOMContentLoaded', initializeCreditsDisplay);
