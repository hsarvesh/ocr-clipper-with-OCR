let creditsManager = null;
let currentUser = null;

function showError(message) {
    const container = document.querySelector('.main-container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    container.prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

function formatDate(timestamp) {
    if (!timestamp) return 'Date not available';
    return new Intl.DateTimeFormat('default', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(timestamp);
}

async function loadProcessingHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '<div class="loading-history">Loading processing history...</div>';

    try {
        if (!currentUser) {
            throw new Error('No user logged in');
        }

        if (!creditsManager) {
            creditsManager = new CreditsManager(currentUser.uid);
        }

        const history = await creditsManager.getTransactionHistory();
        
        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <p>No processing history found</p>
                    <p>Start processing images to see your history here</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = history.map(item => {
            const formattedItem = creditsManager.formatTransaction(item);
            return `
                <div class="history-item">
                    <div class="history-icon ${formattedItem.type}">
                        <span class="material-icons">${formattedItem.icon}</span>
                    </div>
                    <div class="history-details">
                        <div class="history-type">${formattedItem.description}</div>
                        <div class="history-info">
                            <span>${formatDate(formattedItem.timestamp)}</span>
                            <span>Type: ${formattedItem.type}</span>
                            ${formattedItem.status ? `<span>Status: ${formattedItem.status}</span>` : ''}
                        </div>
                        ${item.details ? `
                            <div class="history-details-expandable">
                                <div class="files-processed">
                                    Files: ${item.details.files.join(', ')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    ${formattedItem.amount ? `
                        <div class="history-amount ${formattedItem.type}">
                            ${formattedItem.amountPrefix}${formattedItem.amount} credits
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading processing history:', error);
        historyList.innerHTML = `
            <div class="error-message">
                Error loading processing history. Please try again.
                <button class="retry-button" onclick="loadProcessingHistory()">Retry</button>
            </div>
        `;
    }
}

// Initialize page when auth state changes
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = user;
    
    // Update profile information
    const userDisplayName = document.getElementById('user-display-name');
    const profileFullName = document.getElementById('profile-full-name');
    const profileEmail = document.getElementById('profile-email');
    const userPhoto = document.getElementById('user-photo');

    if (userDisplayName) userDisplayName.textContent = user.displayName || user.email;
    if (profileFullName) profileFullName.textContent = user.displayName || 'No name set';
    if (profileEmail) profileEmail.textContent = user.email;
    if (userPhoto) {
        userPhoto.src = user.photoURL || 'https://www.gravatar.com/avatar/?d=mp';
        userPhoto.alt = user.displayName || 'Profile photo';
    }

    // Initialize credits manager and load history
    creditsManager = new CreditsManager(user.uid);
    loadProcessingHistory();
});
