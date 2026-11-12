<script lang="ts">
  import {
    readHttpErrorMessage,
    readHttpErrorStatus,
  } from '$lib/domains/shared/http/http-error';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import { Button, Checkbox, Input } from '@logdash/hyper-ui/presentational';
  import { untrack } from 'svelte';
  import type {
    WebAnalyticsView,
    WebAnalyticsViewInput,
  } from '../../domain/web-analytics';
  import {
    MAX_VIEWS,
    viewInputs,
    viewsProblem,
  } from '../../domain/web-analytics-layout';
  import DetailsDialog from '../breakdown/DetailsDialog.svelte';

  type Props = {
    isOpen: boolean;
    views: WebAnalyticsView[];
    onclose: () => void;
    onsave: (views: WebAnalyticsViewInput[]) => Promise<void>;
  };

  const { isOpen, views, onclose, onsave }: Props = $props();

  let inputs = $state<WebAnalyticsViewInput[]>([]);
  let saving = $state(false);
  let error = $state<string | null>(null);

  const problem = $derived(viewsProblem(inputs));

  $effect(() => {
    if (!isOpen) return;
    untrack(() => {
      inputs = viewInputs(views);
      error = null;
    });
  });

  function onAddView(): void {
    inputs.push({ name: '', traffic: false });
  }

  function onRemoveView(index: number): void {
    inputs.splice(index, 1);
  }

  function onStep<T>(list: T[], index: number, offset: -1 | 1): void {
    const to = index + offset;
    if (to < 0 || to >= list.length) return;
    list.splice(to, 0, ...list.splice(index, 1));
  }

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (problem || saving) return;
    saving = true;
    error = null;
    try {
      await onsave(inputs.map((view) => ({ ...view, name: view.name.trim() })));
      onclose();
    } catch (failure) {
      if (readHttpErrorStatus(failure) === 409) {
        inputs = viewInputs(views);
        error =
          'Someone changed the views after you opened this. It now shows their change, so make yours again.';
        return;
      }
      error = readHttpErrorMessage(failure) ?? 'Could not save the layout.';
    } finally {
      saving = false;
    }
  }
</script>

<DetailsDialog
  {isOpen}
  title="Layout"
  class="h-[min(44rem,88dvh)] sm:max-w-2xl"
  {onclose}
>
  <form class="flex min-h-0 flex-1 flex-col" onsubmit={onSubmit}>
    <div
      class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-3 pb-5"
    >
      <p class="text-fg-muted text-sm">
        Views split the cards of this domain into dashboards. Everyone on this
        domain sees the same layout. The first view opens by default, and holds
        every card that has no view. The cards of a removed view move to the
        first view.
      </p>

      {#each inputs as view, viewIndex (view.id ?? viewIndex)}
        <fieldset
          class="bg-surface-50-bg edge flex flex-col gap-3 rounded-xl p-3"
        >
          <legend class="sr-only">View {viewIndex + 1}</legend>
          <div class="flex items-center gap-1.5">
            <Input
              bind:value={view.name}
              class="min-w-0 flex-1"
              maxlength={40}
              placeholder="Product"
              aria-label="View {viewIndex + 1} name"
            />
            {@render order(inputs, viewIndex, `view ${viewIndex + 1}`)}
            <IconButton
              label="Remove view {viewIndex + 1}"
              danger
              onclick={() => onRemoveView(viewIndex)}
            >
              <TrashIcon class="size-3.5" />
            </IconButton>
          </div>

          <label class="flex items-center gap-2 text-sm">
            <Checkbox bind:checked={view.traffic} size="xs" />
            Show visitors, sources and the other traffic cards
          </label>
        </fieldset>
      {/each}

      {#if inputs.length < MAX_VIEWS}
        <button
          type="button"
          class="text-fg-tertiary hover:text-fg-default transition-ink focus-visible:outline-brand flex h-8 w-fit cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm focus-visible:outline-2"
          onclick={onAddView}
        >
          <PlusIcon class="size-3.5" />
          Add view
        </button>
      {/if}
    </div>

    <footer class="edge-t flex items-center justify-end gap-3 px-5 py-4">
      {#if error}
        <p class="text-error mr-auto min-w-0 text-sm" role="alert">{error}</p>
      {:else if problem}
        <p class="text-fg-muted mr-auto min-w-0 text-sm">{problem}</p>
      {/if}
      <Button variant="ghost" onclick={onclose}>Cancel</Button>
      <Button
        variant="primary"
        type="submit"
        loading={saving}
        disabled={Boolean(problem)}
      >
        Save layout
      </Button>
    </footer>
  </form>
</DetailsDialog>

{#snippet order(list: unknown[], index: number, name: string)}
  <IconButton
    label="Move {name} up"
    disabled={index === 0}
    onclick={() => onStep(list, index, -1)}
  >
    <ChevronDownIcon class="size-3.5 rotate-180" />
  </IconButton>
  <IconButton
    label="Move {name} down"
    disabled={index === list.length - 1}
    onclick={() => onStep(list, index, 1)}
  >
    <ChevronDownIcon class="size-3.5" />
  </IconButton>
{/snippet}
