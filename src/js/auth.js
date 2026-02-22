// Initialize Firebase with your config
const firebaseConfig = {
    apiKey: "AIzaSyDvzTwvplVpI-YLjVZiweZmGfvhA06M8fA",
    authDomain: "maze-tatva.firebaseapp.com",
    databaseURL: "https://maze-tatva.firebaseio.com",
    projectId: "maze-tatva",
    storageBucket: "maze-tatva.firebasestorage.app",
    messagingSenderId: "194427087525",
    appId: "1:194427087525:web:bc612ee544c5d3ccf4bb4c"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase:', error);
    alert('Error initializing application. Please check console for details.');
}

// Get Auth instance
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
provider.addScope('email');  // Request email scope

// Profile menu toggle
let isProfileMenuOpen = false;

function toggleProfileMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('profile-menu');
    const userName = document.getElementById('user-name');
    isProfileMenuOpen = !isProfileMenuOpen;
    menu.classList.toggle('show', isProfileMenuOpen);
    userName.classList.toggle('active', isProfileMenuOpen);
}

function formatDate(timestamp) {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
}

// Close profile menu when clicking outside
document.addEventListener('click', (e) => {
    const profileMenu = document.getElementById('profile-menu');
    const userName = document.getElementById('user-name');
    if (isProfileMenuOpen && !profileMenu.contains(e.target) && !userName.contains(e.target)) {
        isProfileMenuOpen = false;
        profileMenu.classList.remove('show');
    }
});

// Auth state observer
auth.onAuthStateChanged((user) => {
    try {
        const authContainer = document.getElementById('auth-container');
        const mainContent = document.getElementById('main-content');
        const userDisplayName = document.getElementById('user-display-name');
        const profileMenu = document.getElementById('profile-menu');

        if (!authContainer || !mainContent) {
            console.log('Container elements not found, probably on a different page');
            return;
        }

        if (user) {
            console.log('User signed in:', user.email);
            // User is signed in
            if (authContainer) authContainer.classList.add('hidden');
            if (mainContent) mainContent.classList.remove('hidden');

            // Get first name from display name or fall back to email
            let displayName = user.email;
            if (user.displayName) {
                displayName = user.displayName.split(' ')[0];
            }

            // Update user display name
            const displayElements = document.querySelectorAll('#user-display-name');
            displayElements.forEach(el => {
                if (el) el.textContent = displayName;
            });

            // Update profile menu details if they exist
            const profileElements = {
                'profile-full-name': user.displayName || user.email,
                'profile-email': user.email,
                'last-login': `Last sign in: ${formatDate(user.metadata.lastSignInTime)}`
            };

            Object.entries(profileElements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });

            // Update profile photo if available
            const photoElements = document.querySelectorAll('#user-photo');
            photoElements.forEach(el => {
                if (el) {
                    if (user.photoURL) {
                        el.src = user.photoURL;
                    } else {
                        el.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23666" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"%3E%3C/path%3E%3C/svg%3E';
                    }
                }
            });

            // Initialize credits if we're on the main page
            if (typeof CreditsManager !== 'undefined') {
                const creditsManager = new CreditsManager(user.uid);
                updateCreditsDisplay(creditsManager);
            }
        } else {
            console.log('User signed out');
            // User is signed out
            if (authContainer) authContainer.classList.remove('hidden');
            if (mainContent) mainContent.classList.add('hidden');

            // Clear profile menu if it exists
            if (profileMenu) {
                profileMenu.classList.remove('show');
            }
            isProfileMenuOpen = false;
        }
    } catch (error) {
        console.error('Error updating UI:', error);
    }
});

// Sign in with Google
async function handleSignIn(button) {
    if (!button) return;

    // Disable button and show loading state
    const buttonText = button.querySelector('span');
    const originalText = buttonText?.textContent || 'Sign in with Google';
    button.disabled = true;
    if (buttonText) buttonText.textContent = 'Signing in...';

    try {
        await signInWithGoogle();
        // No need to redirect, onAuthStateChanged will handle UI updates
    } catch (error) {
        // Error is handled in signInWithGoogle
        console.log('Sign in process completed with error');
    } finally {
        // Reset button state
        button.disabled = false;
        if (buttonText) buttonText.textContent = originalText;
    }
}

async function signInWithGoogle() {
    try {
        console.log('Starting Google sign in process...');
        const result = await auth.signInWithPopup(provider);
        console.log('Sign in successful:', result.user.email);
        return result.user;
    } catch (error) {
        console.error('Sign-in error:', error.code, error.message);
        let errorMessage = '';

        switch (error.code) {
            case 'auth/popup-blocked':
                errorMessage = 'Please allow popups for this site and try again.';
                break;
            case 'auth/popup-closed-by-user':
                // Don't show alert for user-initiated cancellation
                console.log('Sign-in cancelled by user');
                return;
            case 'auth/unauthorized-domain':
                errorMessage = 'This domain is not authorized for Google sign-in. Please contact support.';
                break;
            case 'auth/cancelled-popup-request':
                // Don't show alert for duplicate popup attempts
                return;
            default:
                errorMessage = 'An error occurred during sign in. Please try again.';
        }

        if (errorMessage) {
            alert(errorMessage);
        }
        throw error;
    }
}

// Sign out
function signOut() {
    auth.signOut()
        .then(() => {
            console.log('Successfully signed out');
        })
        .catch((error) => {
            console.error('Error signing out:', error);
            alert('Failed to sign out. Please try again.');
        });
}
