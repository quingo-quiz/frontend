import type { User } from '$lib/types/auth';

class UserContext {
    #user = $state<User | null>(null);
    #isLoading = $state(true);

    get user() { return this.#user; }
    get isLoading() { return this.#isLoading; }
    get isAuthenticated() { return !!this.#user; }
    get isAdmin() { return this.#user?.roles.includes('ADMIN') ?? false; }

    set(userData: User | null) {
        this.#user = userData;
        this.#isLoading = false;
    }

    setLoading(loading: boolean) {
        this.#isLoading = loading;
    }

    logout() {
        this.#user = null;
    }
}

export const userContext = new UserContext();