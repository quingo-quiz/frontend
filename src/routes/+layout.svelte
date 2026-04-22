<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { authService } from '$lib/api/auth';
  import { userContext } from '$lib/runes/user.svelte';

  let { children } = $props();

  onMount(async () => {
    const user = await authService.fetchUserInfo();
    if (user) {
        userContext.set(user);
    } else {
        userContext.set(null);
    }
  });
</script>

{#if userContext.isLoading}
  <div class="flex h-screen items-center justify-center bg-background text-primary">
    <span class="animate-pulse text-xl font-bold">Loading...</span>
  </div>
{:else}
  {@render children()}
{/if}