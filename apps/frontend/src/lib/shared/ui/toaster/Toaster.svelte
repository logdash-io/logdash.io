<script lang="ts">
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import X from 'lucide-svelte/icons/x';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import { flip } from 'svelte/animate';
	import { cubicInOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { toast, type Toast } from './toast.state.svelte';

	function dismissToast(id: string) {
		toast.remove(id);
	}

	function getToastConfig(type: Toast['type']): {
		icon: typeof AlertCircle;
		alertClass: string;
	} {
		switch (type) {
			case 'info':
				return { icon: AlertCircle, alertClass: 'alert-info' };
			case 'success':
				return { icon: CheckCircle, alertClass: 'alert-success' };
			case 'warning':
				return { icon: AlertTriangle, alertClass: 'alert-warning' };
			case 'error':
				return { icon: XCircle, alertClass: 'alert-error' };
			default:
				return { icon: AlertCircle, alertClass: '' };
		}
	}
</script>

<div class="toast toast-end z-[1000] mr-4 mt-4 w-80 max-w-[320px] space-y-0">
	{#each toast.activeToasts as _toast (_toast.id)}
		{@const config = getToastConfig(_toast.type)}
		<div
			class="alert alert-soft flex shadow-md {config.alertClass} relative animate-none overflow-hidden"
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
			<div class="flex w-full shrink-0 items-center justify-start gap-2">
				<config.icon class="h-5 w-5 shrink-0" />
				<span class="flex-1">{_toast.message}</span>
				<button
					class="btn btn-circle btn-ghost btn-xs ml-auto"
					onclick={() => dismissToast(_toast.id)}
				>
					<X class="h-4 w-4" />
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
