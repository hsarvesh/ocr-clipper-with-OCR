const additionalStyles = `
    .profile-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: var(--background);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        cursor: pointer;
        transition: all 0.2s;
    }

    .profile-button:hover {
        background-color: #e2e8f0;
    }

    .user-photo {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
    }

    .profile-menu {
        position: absolute;
        top: 100%;
        right: 0;
        width: 280px;
        background: white;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        padding: 1rem;
        margin-top: 0.5rem;
        display: none;
        z-index: 100;
    }

    .profile-menu.show {
        display: block;
        animation: fadeIn 0.2s ease;
    }

    .profile-header {
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border);
        margin-bottom: 1rem;
    }

    .profile-name {
        font-weight: 600;
        color: var(--text);
        margin-bottom: 0.25rem;
    }

    .profile-email {
        font-size: 0.875rem;
        color: #64748b;
    }

    .credits-section {
        padding: 1rem 0;
        border-bottom: 1px solid var(--border);
    }

    .credits-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .credits-icon {
        font-size: 1.25rem;
    }

    .credits-text {
        font-size: 0.875rem;
        color: var(--text);
    }

    .manage-credits-button {
        display: block;
        text-align: center;
        padding: 0.5rem;
        background-color: var(--background);
        color: var(--text);
        text-decoration: none;
        border-radius: var(--radius);
        font-size: 0.875rem;
        transition: all 0.2s;
    }

    .manage-credits-button:hover {
        background-color: #e2e8f0;
        color: var(--primary-color);
    }

    .sign-out-button {
        width: 100%;
        padding: 0.5rem;
        margin-top: 1rem;
        background: none;
        border: none;
        color: #dc2626;
        font-size: 0.875rem;
        cursor: pointer;
        border-radius: var(--radius);
        transition: all 0.2s;
    }

    .sign-out-button:hover {
        background-color: #fee2e2;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 2rem;
    }

    .back-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
        color: var(--text);
        font-size: 0.875rem;
        padding: 0.5rem 0.75rem;
        border-radius: var(--radius);
        background-color: var(--background);
        transition: all 0.2s;
    }

    .back-button:hover {
        background-color: #e2e8f0;
        color: var(--primary-color);
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .retry-button {
        display: inline-block;
        margin-left: 1rem;
        padding: 0.25rem 0.75rem;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--radius);
        cursor: pointer;
        font-size: 0.875rem;
    }

    .retry-button:hover {
        background-color: var(--primary-hover);
    }
`;

// Add the styles to the document
const styleElement = document.createElement('style');
styleElement.textContent = additionalStyles;
document.head.appendChild(styleElement);
