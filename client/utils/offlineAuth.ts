import { User } from "@/lib/firebase";

const OFFLINE_AUTH_KEY = "offline_auth";

interface OfflineCredentials {
    email: string;
    passwordHash: string; // Storing a hash, not plain text
    userId: string;
    timestamp: number;
}

// Simple hash function for demonstration (NOT cryptographically secure for high-value targets, but sufficient for this "offline mode" requirement)
// In a real app, use crypto.subtle or a stronger library if possible, but keep it simple for this context.
async function hashPassword(password: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}

export async function saveOfflineCredentials(user: User, password: string) {
    try {
        const hash = await hashPassword(password);
        const credentials: OfflineCredentials = {
            email: user.email,
            passwordHash: hash,
            userId: user.id,
            timestamp: Date.now(),
        };
        localStorage.setItem(OFFLINE_AUTH_KEY, JSON.stringify(credentials));
        console.log("Offline credentials saved.");
    } catch (error) {
        console.error("Failed to save offline credentials:", error);
    }
}

export async function verifyOfflineCredentials(email: string, password: string): Promise<User | null> {
    try {
        const stored = localStorage.getItem(OFFLINE_AUTH_KEY);
        if (!stored) return null;

        const credentials: OfflineCredentials = JSON.parse(stored);

        if (credentials.email.toLowerCase() !== email.toLowerCase()) {
            return null;
        }

        const inputHash = await hashPassword(password);
        if (inputHash === credentials.passwordHash) {
            return {
                id: credentials.userId,
                email: credentials.email,
            };
        }
    } catch (error) {
        console.error("Error verifying offline credentials:", error);
    }
    return null;
}

export function clearOfflineCredentials() {
    localStorage.removeItem(OFFLINE_AUTH_KEY);
    console.log("Offline credentials cleared.");
}

export function hasOfflineCredentials(): boolean {
    return !!localStorage.getItem(OFFLINE_AUTH_KEY);
}
