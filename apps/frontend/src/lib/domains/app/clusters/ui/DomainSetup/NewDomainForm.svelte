<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { createDomain } from '$lib/domains/app/clusters/application/domain-setup';
  import {
    readHttpErrorMessage,
    readHttpErrorStatus,
  } from '$lib/domains/shared/http/http-error';
  import {
    SETTINGS_PAGE_CLASS,
    SETTINGS_PANEL_CLASS,
    SettingsCardHeader,
  } from '$lib/domains/shared/ui/components/settings-card';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import { isValidUrl } from '$lib/domains/shared/utils/url';
  import { Button, Input } from '@logdash/hyper-ui/presentational';
  import { match } from 'ts-pattern';

  const id = $props.id();

  let address = $state('');
  let submitting = $state(false);
  let error = $state<string | null>(null);

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (!isValidUrl(address.trim())) {
      error = 'Enter an address like example.com.';
      return;
    }
    submitting = true;
    error = null;
    try {
      const clusterId = await createDomain(address);
      await goto(
        resolve('/app/domains/[cluster_id]', { cluster_id: clusterId }),
        {
          invalidateAll: true,
        },
      );
    } catch (cause) {
      submitting = false;
      error = readError(cause);
    }
  }

  function readError(cause: unknown): string | null {
    return match(readHttpErrorStatus(cause))
      .with(409, () => {
        upgradeState.openModal('project-limit');
        return null;
      })
      .with(400, () => 'Enter a public address, like example.com.')
      .with(429, () => 'Too many new domains at once. Try again in a minute.')
      .otherwise(
        () =>
          readHttpErrorMessage(cause) ?? 'Could not add the domain. Try again.',
      );
  }
</script>

<div class={SETTINGS_PAGE_CLASS}>
  <section class="flex flex-col gap-3">
    <SettingsCardHeader
      title="Add a domain"
      description="We check it right away and email you when it goes down."
    />
    <form
      onsubmit={onSubmit}
      class={['flex flex-col gap-2', SETTINGS_PANEL_CLASS]}
      novalidate
    >
      <label for="{id}-address" class="text-sm text-fg-tertiary">
        Website address
      </label>
      <div class="flex gap-2">
        <Input
          id="{id}-address"
          bind:value={address}
          type="url"
          inputmode="url"
          autocomplete="url"
          maxlength={1024}
          placeholder="example.com"
          class="min-w-0 flex-1"
          error={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          oninput={() => (error = null)}
          autofocus
        />
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          disabled={!address.trim()}
        >
          Start monitoring
        </Button>
      </div>
      {#if error}
        <p id="{id}-error" class="text-sm text-error" role="alert">{error}</p>
      {/if}
    </form>
  </section>
</div>
