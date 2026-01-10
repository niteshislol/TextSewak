// Configuration for API URL
// When running in development (browser), we can use relative paths or the window location.
// When running in an APK (Capacitor), we MUST point to the external server IP.

const SERVER_IP = "10.242.9.46";
const SERVER_PORT = "8080"; // Vite dev server port (which proxies to backend)
// OR if using the production build server, it might be different. 
// Since user is running 'npm run dev', we target that.

// Detect if running in Capacitor/Mobile context (naive check or explicit)
// For now, we will prefer the IP address if we are not on localhost to ensure mobile connectivity.
// Actually, for the build we want it to be explicit.

export const API_BASE_URL = import.meta.env.PROD
    ? `http://${SERVER_IP}:${SERVER_PORT}` // Production build (APK) points to the PC
    : ""; // Development (Browser) uses relative path (proxy)

export const getApiUrl = (endpoint: string) => {
    if (endpoint.startsWith("/")) {
        return `${API_BASE_URL}${endpoint}`;
    }
    return `${API_BASE_URL}/${endpoint}`;
};
