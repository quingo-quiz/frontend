<script lang="ts">
	import { userContext } from '$lib/runes/user.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { toasts } from '$lib/runes/toast.svelte';
	import { Camera } from 'lucide-svelte';

	let loading = $state(false);
	let username = $state(userContext.user?.username || '');
	let bio = $state("");

	async function saveChanges() {
		loading = true;
		try {
			await new Promise(r => setTimeout(r, 1000));
			toasts.show('Profile updated successfully', 'success');
		} finally {
			loading = false;
		}
	}
</script>

<div class="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
	<div class="relative overflow-hidden rounded-4xl border border-white/5 bg-surface p-6 shadow-2xl sm:p-10">
		<h3 class="mb-8 text-xl font-bold">Profile Information</h3>

		<div class="mb-10 flex items-center gap-8">
			<!-- Аватар с наведением -->
			<div class="group relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-3xl border-2 border-white/5 transition-all hover:border-primary/50">
				<div class="flex h-full w-full items-center justify-center bg-primary text-4xl font-bold text-white shadow-xl shadow-primary/20">
					{userContext.user?.username.charAt(0).toUpperCase()}
				</div>
				<!-- Overlay -->
				<div class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
					<Camera size={20} class="text-white mb-1" />
					<span class="text-[9px] font-bold uppercase tracking-tighter text-white">Change image</span>
				</div>
			</div>
			
			<div class="space-y-1">
				<p class="text-xs font-bold uppercase tracking-widest text-slate-500">Public Name</p>
				<h2 class="text-2xl font-bold text-white">{userContext.user?.username}</h2>
			</div>
		</div>

		<form class="grid grid-cols-1 gap-6 md:grid-cols-2" onsubmit={(e) => { e.preventDefault(); saveChanges(); }}>
			<Input label="Username" bind:value={username} placeholder="Username" />
			
			<div class="flex flex-col gap-1.5">
				<label class="px-1 text-[11px] font-medium uppercase tracking-wider text-slate-500" for="email">Email Address</label>
				<div class="rounded-lg border border-white/5 bg-slate-950/50 p-3 text-sm italic text-slate-400">
					{userContext.user?.email}
				</div>
			</div>
			
			<div class="flex flex-col gap-1.5 md:col-span-2">
				<label class="px-1 text-[11px] font-medium uppercase tracking-wider text-slate-500" for="bio">Bio</label>
				<textarea 
					id="bio"
					bind:value={bio}
					placeholder="Tell us about yourself..."
					class="min-h-25 w-full resize-none rounded-lg border border-white/10 bg-slate-950/50 p-3 text-sm text-white transition-all focus:border-primary/50 focus:outline-none"
				></textarea>
			</div>

			<div class="pt-4 md:col-span-2">
				<Button type="submit" isLoading={loading} class="w-full px-10 sm:w-auto">
					Save Changes
				</Button>
			</div>
		</form>
	</div>
</div>