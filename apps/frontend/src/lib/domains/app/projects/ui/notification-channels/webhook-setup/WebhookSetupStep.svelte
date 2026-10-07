<script lang="ts">
  import { fromAction } from 'svelte/attachments';
  import { autoFocus } from '$lib/domains/shared/ui/actions/use-autofocus.svelte.js';
  import {
    Badge,
    Button,
    Input,
    Menu,
    Tooltip,
  } from '@logdash/hyper-ui/presentational';
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import type { WebhookSetupDTO } from '$lib/domains/app/projects/domain/notification-channels/notification-channels.types.js';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import LinkIcon from '$lib/domains/shared/icons/LinkIcon.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';

  type Header = {
    key: string;
    value: string;
  };

  type Props = {
    clusterName: string;
    onCancel?: () => void;
    onSubmit: (dto: WebhookSetupDTO) => Promise<void>;
  };

  const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  const HEADER_NAME_PATTERN = /^[a-zA-Z0-9-]+$/;
  const HEADER_VALUE_PATTERN = /^[\x20-\x7E]*$/;

  let { clusterName, onCancel, onSubmit }: Props = $props();

  let isSaving = $state(false);

  const canUseAdvancedMethods = $derived(!userState.isFree);
  const canUseCustomHeaders = $derived(!userState.isFree);

  let webhookName = $state('');
  let webhookUrl = $state('');
  let headers = $state<Header[]>([]);
  let method = $state(userState.isFree ? 'GET' : 'POST');

  function isValidHeaderName(name: string): boolean {
    return name === '' || HEADER_NAME_PATTERN.test(name);
  }

  function isValidHeaderValue(value: string): boolean {
    return HEADER_VALUE_PATTERN.test(value);
  }

  function hasValidHeaders(): boolean {
    return headers.every(
      (header) =>
        isValidHeaderName(header.key) && isValidHeaderValue(header.value),
    );
  }

  function canSubmit(): boolean {
    return (
      webhookName.trim() !== '' && webhookUrl.trim() !== '' && hasValidHeaders()
    );
  }

  async function onSave(): Promise<void> {
    if (isSaving) {
      return;
    }

    isSaving = true;

    try {
      await onSubmit({
        url: webhookUrl,
        name: webhookName,
        headers: headers.reduce(
          (acc, header) => {
            if (header.key && header.value) {
              acc[header.key] = header.value;
            }
            return acc;
          },
          {} as Record<string, string>,
        ),
        method,
      });
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="flex flex-col gap-5">
  <div class="flex items-center gap-4">
    <div
      class="bg-surface-150-bg flex size-9 shrink-0 items-center justify-center rounded-lg"
    >
      <LinkIcon class="size-4.5" />
    </div>
    <div class="flex min-w-0 flex-col gap-0.5">
      <h2 class="text-base font-semibold">Set up a webhook channel</h2>
      <p class="text-fg-tertiary text-sm">
        Add it with a memorable name to your domain.
      </p>
    </div>
  </div>

  <div class="flex flex-col gap-2">
    <Input
      bind:value={webhookName}
      class="w-full"
      placeholder="Memorable webhook name"
      type="text"
      {@attach fromAction(autoFocus, () => ({ selectAll: true }))}
    />

    <div class="relative flex w-full">
      <Tooltip
        content={methodSelect}
        placement="bottom"
        align="left"
        trigger="click"
        interactive
        class="absolute top-1 left-1 z-10"
      >
        <Button variant="ghost" size="sm">{method}</Button>
      </Tooltip>

      <Input
        bind:value={webhookUrl}
        class="ph-no-capture w-full pl-16"
        placeholder="Webhook URL"
        type="text"
      />
    </div>

    <div class="flex flex-col gap-2">
      {#each headers as header, index (index)}
        <div class="ph-no-capture flex items-start gap-2">
          <div class="flex-1">
            <Input
              type="text"
              class="w-full"
              bind:value={header.key}
              error={!isValidHeaderName(header.key)}
              placeholder="Key"
              {@attach fromAction(autoFocus, () => ({
                enabled: index === headers.length - 1,
              }))}
            />
            {#if header.key && !isValidHeaderName(header.key)}
              <div class="text-error mt-1 text-xs">
                Header name can only contain letters, numbers, and hyphens
              </div>
            {/if}
          </div>
          <div class="flex-1">
            <Input
              type="text"
              class="w-full"
              bind:value={header.value}
              error={!isValidHeaderValue(header.value)}
              placeholder="Value"
            />
            {#if header.value && !isValidHeaderValue(header.value)}
              <div class="text-error mt-1 text-xs">
                Header value contains invalid characters
              </div>
            {/if}
          </div>
          <Button
            variant="ghost"
            shape="circle"
            aria-label="Remove header"
            onclick={() => {
              headers.splice(index, 1);
            }}
          >
            <CloseIcon class="h-4 w-4" />
          </Button>
        </div>
      {/each}

      <UpgradeElement
        enabled={!canUseCustomHeaders}
        source="webhook-headers-restriction"
        class="w-full"
      >
        <Button
          block
          class="gap-2"
          onclick={() => {
            if (canUseCustomHeaders) {
              headers.push({
                key: '',
                value: '',
              });
            }
          }}
        >
          <span>Add header</span>
          {#if !canUseCustomHeaders}
            <Badge variant="inverse" size="sm">Builder plan</Badge>
          {/if}
        </Button>
      </UpgradeElement>
    </div>
  </div>

  <div class="flex justify-end gap-2">
    <Button variant="ghost" onclick={onCancel}>Back</Button>
    <Button
      variant="primary"
      disabled={!canSubmit() || isSaving}
      loading={isSaving}
      onclick={onSave}
    >
      Save channel to {clusterName}
    </Button>
  </div>
</div>

{#snippet methodSelect(close: () => void)}
  <Menu
    class="bg-surface-elevated-bg border-surface-elevated-border rounded-xl border"
  >
    {#each ALLOWED_METHODS as _method (_method)}
      <li>
        <UpgradeElement
          enabled={_method !== 'GET' && !canUseAdvancedMethods}
          source="webhook-method-restriction"
          class="w-full"
          onclick={() => {
            close();
            if (_method === 'GET' || canUseAdvancedMethods) {
              method = _method;
            }
          }}
        >
          <span>{_method}</span>
          {#if _method !== 'GET' && !canUseAdvancedMethods}
            <Badge size="xs" class="uppercase">Upgrade</Badge>
          {/if}
        </UpgradeElement>
      </li>
    {/each}
  </Menu>
{/snippet}
