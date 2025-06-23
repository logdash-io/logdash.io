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

  $inspect(toast.activeToasts);
</script>

<div class="toast toast-end z-[1000] mr-4 mt-4 space-y-0">
  {toast.activeToasts.length}
  {#each toast.activeToasts as _toast (_toast.id)}
    {@const config = getToastConfig(_toast.type)}
    <div
      class="alert ld-card-base relative flex w-80 max-w-[320px] animate-none overflow-hidden rounded-xl px-3 shadow-lg"
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
          class={[
            'min-h-14 min-w-1.5 max-w-1.5 flex-1 shrink-0 self-stretch rounded-full',
            config.bg,
          ]}
        ></div>

        <div class="flex flex-col justify-start gap-0.5 py-0.5">
          <span class="text-base font-semibold capitalize">
            {_toast.type}
          </span>
          <span class="text-secondary/80 flex-1 whitespace-pre-wrap break-all">
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
        class={[
          'absolute bottom-0 left-0 h-0.5 w-full origin-left bg-opacity-20',
          config.bg,
        ]}
        style="animation: toast-progress {_toast.duration}ms linear forwards;"
      ></div>
    </div>
  {/each}
</div>
