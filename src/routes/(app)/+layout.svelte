<!-- src/routes/(app)/+layout.svelte -->
<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import EmailVerificationBanner from '$lib/components/layout/EmailVerificationBanner.svelte';
    import { onMount } from 'svelte';
    import { authService } from '$lib/api/auth';
    import { userContext } from '$lib/runes/user.svelte';
    import { securityContext } from '$lib/runes/security.svelte'; // <-- Новый импорт
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

	let { children } = $props();

    onMount(async () => {
        try {
            const user = userContext.isAuthenticated
                ? userContext.user
                : await authService.fetchUserInfo();

            userContext.set(user);

            if (user) {
                await securityContext.refreshStatus();
            } else {
                securityContext.set(null); // Сбрасываем статус, если пользователь не авторизован
            }
        } catch (e) {
            userContext.set(null);
            securityContext.set(null);
            if (typeof window !== 'undefined' && $page.url.pathname !== '/auth') {
                goto('/auth');
            }
        }
    });

    $effect(() => {
        if (!userContext.isLoading && !userContext.isAuthenticated && typeof window !== 'undefined' && !$page.url.pathname.startsWith('/auth')) {
            goto('/auth');
        }
    });
</script>

{#if userContext.isLoading || securityContext.isLoading}
    <div class="flex min-h-dvh items-center justify-center bg-background text-primary">
        <span class="animate-pulse text-xl font-bold">Loading...</span>
    </div>
{:else}
    <div class="min-h-dvh flex flex-col">
        <Header />
            <EmailVerificationBanner />
        <main class="grow container mx-auto px-4 py-8">
            {@render children()}
        </main>
    </div>
{/if}