// Version display functionality
async function loadAndDisplayVersion() {
    try {
        const response = await fetch('version.json');
        const data = await response.json();

        const versionElements = document.querySelectorAll('.app-version');
        versionElements.forEach(el => {
            el.textContent = `v${data.version}`;
        });

        const versionDateElements = document.querySelectorAll('.version-date');
        versionDateElements.forEach(el => {
            el.textContent = `Updated: ${data.updated}`;
        });
    } catch (error) {
        console.error('Error loading version:', error);
    }
}

// Load version when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndDisplayVersion);
} else {
    loadAndDisplayVersion();
}
