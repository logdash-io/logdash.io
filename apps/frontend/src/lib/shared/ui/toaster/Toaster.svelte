<script lang="ts">
	import X from 'lucide-svelte/icons/x';
	import { flip } from 'svelte/animate';
	import { cubicInOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { toast, type Toast } from './toast.state.svelte';

	function dismissToast(id: string) {
		toast.remove(id);
	}

	function getToastConfig(type: Toast['type']): {
		alertClass: string;
		bg: string;
	} {
		switch (type) {
			case 'info':
				return {
					alertClass: 'alert-info',
					bg: 'bg-info',
				};
			case 'success':
				return {
					alertClass: 'alert-success',
					bg: 'bg-success',
				};
			case 'warning':
				return {
					alertClass: 'alert-warning',
					bg: 'bg-warning',
				};
			case 'error':
				return {
					alertClass: 'alert-error',
					bg: 'bg-error',
				};
			default:
				return { alertClass: '', bg: '' };
		}
	}
</script>

<div class="toast toast-end z-[1000] mr-4 mt-4 w-80 max-w-[320px] space-y-0">
	{#each toast.activeToasts as _toast (_toast.id)}
		{@const config = getToastConfig(_toast.type)}
		<div
			class="alert alert-soft flex rounded-xl px-3 shadow-lg {config.alertClass} relative animate-none overflow-hidden"
			in:fly|global={{
				duration: 200,
				y: 15,
				easing: cubicInOut,
			}}
			out:fly|global={{
				duration: 200,
				easing: cubicInOut,
				y: -5,
			}}
			animate:flip={{ duration: 200 }}
		>
			<div class="flex w-full shrink-0 items-start justify-start gap-4">
				<div
					class={['h-full min-h-14 w-1.5 rounded-full', config.bg]}
				></div>

				<div class="flex flex-col justify-start">
					<span class="text-base font-semibold capitalize">
						{_toast.type}
					</span>
					<span class="text-secondary/80 flex-1">
						{_toast.message}
					</span>
				</div>

				<button
					class="btn btn-circle btn-ghost btn-xs absolute right-3 top-3"
					onclick={() => dismissToast(_toast.id)}
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<div
				class="bg-base-content/20 absolute bottom-0 left-0 h-1 w-full origin-left bg-opacity-20"
				style="animation: toast-progress {_toast.duration}ms linear forwards;"
			></div>
		</div>
	{/each}
</div>

<style>
	@keyframes toast-progress {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}
</style>
