<script lang="ts">
	import { Lock, CheckCircle2, Save, X } from 'lucide-svelte';
	import { toasts } from '$lib/runes/toast.svelte';
	import { authService } from '$lib/api/auth';
	import { securityContext } from '$lib/runes/security.svelte';
	import { userContext } from '$lib/runes/user.svelte'; // Для обновления passwordSet в userContext
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { cn } from '$lib/utils/ui';
	import { fly } from 'svelte/transition';

	// Пропсы для управления модальным окном и его поведением
	interface Props {
		isOpen: boolean; // Видимость модального окна
		isPasswordSet: boolean; // Флаг: пароль уже установлен или нет
		onClose: () => void; // Функция для закрытия модального окна
	}

	let { isOpen, isPasswordSet, onClose }: Props = $props();

	// Локальное состояние формы
	let oldPassword = $state('');
	let newPassword = $state('');
	let confirmNewPassword = $state('');
	let loading = $state(false);
	let fieldErrors = $state<Record<string, string>>({});

	// Реактивная валидация
	let newPasswordMismatch = $derived(
		confirmNewPassword.length > 0 && newPassword !== confirmNewPassword
	);
	let isFormValid = $derived(() => {
		if (isPasswordSet) { // Если меняем пароль
			return oldPassword.length >= 6 && newPassword.length >= 6 && newPassword === confirmNewPassword;
		} else { // Если устанавливаем пароль
			return newPassword.length >= 6 && newPassword === confirmNewPassword;
		}
	});

	// Сброс формы при открытии/закрытии
	$effect(() => {
		if (!isOpen) {
			oldPassword = '';
			newPassword = '';
			confirmNewPassword = '';
			fieldErrors = {};
		}
	});

	function validateForm(): boolean {
		fieldErrors = {};
		let isValid = true;

		if (isPasswordSet && oldPassword.length < 6) {
			fieldErrors.oldPassword = 'Current password is too short';
			isValid = false;
		}
		if (newPassword.length < 6) {
			fieldErrors.newPassword = 'New password must be at least 6 characters';
			isValid = false;
		}
		if (newPasswordMismatch) {
			fieldErrors.confirmNewPassword = 'Passwords do not match';
			isValid = false;
		}
		if (!isValid) toasts.show('Please fix the errors in the form', 'error');
		return isValid;
	}

	async function handleSubmit() {
		if (!validateForm()) return;
		loading = true;

		try {
			if (isPasswordSet) {
				// Смена пароля
				await authService.changePassword({ oldPassword, newPassword });
				toasts.show('Password changed successfully!', 'success');
			} else {
				// Установка пароля
				await authService.setPassword({ password: newPassword });
				toasts.show('Password set successfully!', 'success');
			}
			
			// Обновляем глобальный статус безопасности и пользователя
			await securityContext.refreshStatus();
            if (userContext.user) { // Обновляем поле passwordSet в userContext
                userContext.set({ ...userContext.user, passwordSet: true });
            }
			
			onClose(); // Закрываем модальное окно
		} catch (e: any) {
			if (e.fieldErrors) fieldErrors = e.fieldErrors;
			toasts.show(e.message || 'Operation failed', 'error');
		} finally {
			loading = false;
		}
	}
</script>

{#if isOpen}
	<div 
		class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
		onclick={onClose}
	>
		<div 
			transition:fly={{ y: 20, duration: 300 }}
			class="w-full max-w-md rounded-[2.5rem] border border-white/5 bg-surface p-8 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-8 flex items-center justify-between">
				<h3 class="text-xl font-bold text-white">
					{#if isPasswordSet}Change Password{:else}Set Password{/if}
				</h3>
				<button onclick={onClose} class="rounded-full p-2 text-slate-500 hover:bg-white/5 hover:text-white transition-colors">
					<X size={20} />
				</button>
			</div>

			<form class="space-y-6" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				{#if isPasswordSet}
					<Input bind:value={oldPassword} type="password" label="Current Password" placeholder="••••••••" icon={Lock} error={fieldErrors.oldPassword} />
				{/if}
				<Input bind:value={newPassword} type="password" label="New Password" placeholder="••••••••" icon={Lock} error={fieldErrors.newPassword} />
				<Input bind:value={confirmNewPassword} type="password" label="Confirm New Password" placeholder="••••••••" icon={CheckCircle2} error={fieldErrors.confirmNewPassword || (newPasswordMismatch ? 'Passwords do not match' : null)} />
				
				<Button type="submit" isLoading={loading} disabled={!isFormValid()} class="w-full py-4 text-base">
					{#if isPasswordSet}Update Password{:else}Set Password{/if}
					<Save size={18} class="ml-2" />
				</Button>
			</form>
		</div>
	</div>
{/if}