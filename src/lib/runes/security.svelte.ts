// src/lib/runes/security.svelte.ts
import { authService } from '$lib/api/auth';
import type { SecurityStatusDto } from '$lib/types/auth';

class SecurityContext {
    #status = $state<SecurityStatusDto | null>(null);
    #isLoading = $state(true);

    get status() { return this.#status; }
    get isLoading() { return this.#isLoading; }

    set(data: SecurityStatusDto | null) {
        this.#status = data;
        this.#isLoading = false;
    }

    setLoading(loading: boolean) {
        this.#isLoading = loading;
    }

    async refreshStatus() {
        this.#isLoading = true;
        try {
            const data = await authService.getSecurityStatus();
            this.#status = data;
        } catch (e) {
            console.error("Failed to refresh security status:", e);
            this.#status = null;
        } finally {
            this.#isLoading = false;
        }
    }
}

export const securityContext = new SecurityContext();