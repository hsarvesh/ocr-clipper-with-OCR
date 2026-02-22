// API Configuration
const API_CONFIG = {
    baseUrl: 'https://asia-south1-akshar-bodh-drushti.cloudfunctions.net/akshar-chintan-v2',
    timeout: 30000,
    retries: 3,
    baseDelay: 2000
};

// API error handling
class APIError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'APIError';
    }
}

// API service
export const apiService = {
    async processImage(formData) {
        for (let i = 0; i < API_CONFIG.retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

                const response = await fetch(
                    API_CONFIG.baseUrl,
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
                        throw new APIError('Service temporarily unavailable', 503);
                    }
                    throw new APIError(`HTTP error ${response.status}`, response.status);
                }

                return await response.text();
            } catch (error) {
                const isLastAttempt = i === API_CONFIG.retries - 1;
                const isServiceUnavailable = error.message === 'Service temporarily unavailable';
                const isTimeout = error.name === 'AbortError';

                if (!isLastAttempt && (isServiceUnavailable || isTimeout)) {
                    const waitTime = API_CONFIG.baseDelay * Math.pow(2, i);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
                throw error;
            }
        }
    }
};
