<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { authService } from '$lib/api/auth';
  import { userContext } from '$lib/runes/user.svelte';
  import ToastContainer from '$lib/components/ui/ToastContainer.svelte';

  let { children } = $props();

  onMount(async () => {
    try {
        const user = await authService.fetchUserInfo();
        userContext.set(user);
    } catch (e) {
        userContext.set(null);
    }
});
</script>

<ToastContainer />
{#if userContext.isLoading}
  <div class="flex h-screen items-center justify-center bg-background text-primary">
    <span class="animate-pulse text-xl font-bold">Loading...</span>
  </div>
{:else}
  {@render children()}
{/if}