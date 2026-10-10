<script lang="ts">
  import { fromAction } from 'svelte/attachments';
  import { autoFocus } from '$lib/domains/shared/ui/actions/use-autofocus.svelte.js';
  import {
    Badge,
    Button,
    Input,
    Label,
    Menu,
    Tooltip,
  } from '@logdash/hyper-ui/presentational';
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import type {
    WebhookSetupDTO,
    WebhookStep,
  } from '$lib/domains/app/projects/domain/notification-channels/notification-channels.types.js';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import ChannelSetupStep from '$lib/domains/app/projects/ui/notification-channels/ChannelSetupStep.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';

  type Header = {
    key: string;
    value: string;
  };

  type Props = {
    step: WebhookStep;
    onCancel: () => void;
    onSubmit: (dto: WebhookSetupDTO) => Promise<void>;
  };

  const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  const HEADER_NAME_PATTERN = /^[a-zA-Z0-9-]+$/;
  const HEADER_VALUE_PATTERN = /^[\x20-\x7E]*$/;

  let { step = $bindable(), onCancel, onSubmit }: Props = $props();

  let isSaving = $state(false);

  const canUseAdvancedMethods = $derived(!userState.isFree);
  const canUseCustomHeaders = $derived(!userState.isFree);

  let webhookName = $state('');
  let webhookUrl = $state('');
  let headers = $state<Header[]>([]);
  let method = $state(userState.isFree ? 'GET' : 'POST');

  const canContinue = $derived(
    webhookName.trim() !== '' && webhookUrl.trim() !== '',
  );

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

  function onContinue(): void {
    if (canContinue) {
      step = 'headers';
    }
  }

  async function onSave(): Promise<void> {
    if (isSaving || !canContinue || !hasValidHeaders()) {
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

{#if step === 'endpoint'}
  <ChannelSetupStep
    title="Set up a webhook"
    description="Every alert is sent as a request to this URL."
    onBack={onCancel}
    onSubmit={onContinue}
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <Label for="webhook-name" class="text-fg-muted text-sm">Name</Label>
        <Input
          id="webhook-name"
          bind:value={webhookName}
          class="w-full"
          placeholder="Memorable webhook name"
          type="text"
          {@attach fromAction(autoFocus, () => ({ selectAll: true }))}
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <Label for="webhook-url" class="text-fg-muted text-sm">URL</Label>
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
            id="webhook-url"
            bind:value={webhookUrl}
            class="ph-no-capture w-full pl-16"
            placeholder="https://example.com/alerts"
            type="text"
          />
        </div>
      </div>
    </div>

    {#snippet action()}
      <Button type="submit" variant="primary" disabled={!canContinue}>
        Continue
      </Button>
    {/snippet}
  </ChannelSetupStep>
{:else}
  <ChannelSetupStep
    title="Add headers"
    description="Optional. Sent with every alert request."
    onBack={() => (step = 'endpoint')}
    onSubmit={onSave}
  >
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
              aria-label="Header name"
              {@attach fromAction(autoFocus, () => ({
                enabled: index === headers.length - 1,
              }))}
            />
            {#if header.key && !isValidHeaderName(header.key)}
              <div class="text-error mt-1 text-xs">
                Letters, numbers and hyphens only
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
              aria-label="Header value"
            />
            {#if header.value && !isValidHeaderValue(header.value)}
              <div class="text-error mt-1 text-xs">Printable ASCII only</div>
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
        class="self-start"
      >
        <Button
          size="sm"
          onclick={() => {
            if (canUseCustomHeaders) {
              headers.push({
                key: '',
                value: '',
              });
            }
          }}
        >
          <PlusIcon class="size-3.5" />
          <span>Add header</span>
          {#if !canUseCustomHeaders}
            <Badge variant="inverse" size="sm">Builder plan</Badge>
          {/if}
        </Button>
      </UpgradeElement>
    </div>

    {#snippet action()}
      <Button
        type="submit"
        variant="primary"
        disabled={!hasValidHeaders() || isSaving}
        loading={isSaving}
      >
        Save channel
      </Button>
    {/snippet}
  </ChannelSetupStep>
{/if}

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
