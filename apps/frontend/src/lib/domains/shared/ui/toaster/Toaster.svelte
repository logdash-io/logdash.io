<script lang="ts">
  import X from 'lucide-svelte/icons/x';
  import { Alert, Button } from '@logdash/hyper-ui/presentational';
  import { flip } from 'svelte/animate';
  import { cubicInOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import {
    toast,
    type ToastType,
  } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';

  const TOAST_ACCENTS: Record<ToastType, string> = {
    info: 'bg-info',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };
</script>

<div
  class="fixed right-8 bottom-4 z-[1000] flex w-max max-w-[calc(100vw-2rem)] flex-col gap-2"
>
  {#each toast.activeToasts as _toast (_toast.id)}
    <div
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
      <Alert
        class="border-hairline relative flex w-80 max-w-[320px] overflow-hidden rounded-xl px-3 pr-10 shadow-lg"
      >
        <div class="flex w-full shrink-0 items-start justify-start gap-4">
          <div
            class={[
              'min-w-1.5 max-w-1.5 flex-1 shrink-0 self-stretch rounded-full',
              TOAST_ACCENTS[_toast.type],
            ]}
          ></div>

          <div class="flex flex-col justify-start gap-0.5 py-0.5">
            <span class="text-neutral-300 flex-1 whitespace-pre-wrap">
              {_toast.message}
            </span>
          </div>

          <Button
            variant="ghost"
            size="xs"
            shape="circle"
            class="absolute right-3 top-3"
            aria-label="Dismiss"
            onclick={() => toast.remove(_toast.id)}
          >
            <X class="h-5 w-5" />
          </Button>
        </div>

        <div
          class={[
            'absolute bottom-0 left-0 h-0.5 w-full origin-left',
            TOAST_ACCENTS[_toast.type],
          ]}
          style="animation: toast-progress {_toast.duration}ms linear forwards;"
        ></div>
      </Alert>
    </div>
  {/each}
</div>
