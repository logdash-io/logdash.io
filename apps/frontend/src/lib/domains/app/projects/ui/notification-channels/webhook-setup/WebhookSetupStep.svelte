<script lang="ts">
  import { fromAction } from 'svelte/attachments';
  import { autoFocus } from '$lib/domains/shared/ui/actions/use-autofocus.svelte.js';
  import {
    Badge,
    Button,
    Checkbox,
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
    monitorName: string;
    onCancel?: () => void;
    onSubmit: (dto: WebhookSetupDTO) => void;
  };

  const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  // HTTP header validation patterns
  const HEADER_NAME_PATTERN = /^[a-zA-Z0-9-]+$/;
  const HEADER_VALUE_PATTERN = /^[\x20-\x7E]*$/;

  let { monitorName, clusterName, onCancel, onSubmit }: Props = $props();

  const canUseAdvancedMethods = $derived(!userState.isFree);
  const canUseCustomHeaders = $derived(!userState.isFree);

  let assignToServiceMonitor = $state(false);
  let webhookName = $state('');
  let webhookUrl = $state('');
  let headers = $state<Header[]>([]);
  let method = $state('GET');

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
</script>

<div class="space-y-8 text-center">
  <div class="flex items-center justify-start gap-4">
    <div
      class="success-card flex h-14 w-14 items-center justify-center rounded-full"
    >
      <LinkIcon class="h-6 w-6" />
    </div>

    <div class="flex flex-col items-start">
      <h3 class="text-xl font-medium">Configure webhook channel</h3>
      <p class="text-neutral-400 text-sm">
        Add it with a memorable name to your project.
      </p>
    </div>
  </div>

  <div class="space-y-2 text-base">
    <Input
      bind:value={webhookName}
      variant="outline"
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
        class="absolute left-0 top-0.5 z-10"
      >
        <Button variant="transparent" size="sm">{method}</Button>
      </Tooltip>

      <Input
        bind:value={webhookUrl}
        variant="outline"
        class="py-2 pl-16 pr-3"
        placeholder="Webhook URL"
        type="text"
      />
    </div>

    <div class="flex flex-col gap-2">
      {#each headers as header, index (index)}
        <div class="flex items-start gap-2">
          <div class="flex-1">
            <Input
              type="text"
              bind:value={header.key}
              variant="outline"
              error={!isValidHeaderName(header.key)}
              placeholder="Key"
              {@attach fromAction(autoFocus, () => ({
                enabled: index === headers.length - 1,
              }))}
            />
            {#if header.key && !isValidHeaderName(header.key)}
              <div class="text-error mt-1 text-left text-xs">
                Header name can only contain letters, numbers, and hyphens
              </div>
            {/if}
          </div>
          <div class="flex-1">
            <Input
              type="text"
              bind:value={header.value}
              variant="outline"
              error={!isValidHeaderValue(header.value)}
              placeholder="Value"
            />
            {#if header.value && !isValidHeaderValue(header.value)}
              <div class="text-error mt-1 text-left text-xs">
                Header value contains invalid characters
              </div>
            {/if}
          </div>
          <Button
            variant="ghost"
            size="sm"
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
          variant="neutral"
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

  <div class="flex select-none items-center justify-start gap-2">
    <Checkbox
      id="assign-service-monitor"
      variant="primary"
      bind:checked={assignToServiceMonitor}
    />
    <label for="assign-service-monitor" class="cursor-pointer text-sm">
      Assign to {monitorName} service monitor
    </label>
  </div>

  <div class="flex gap-3">
    <Button variant="soft" class="flex-1" onclick={onCancel}>Back</Button>
    <Button
      variant="primary"
      class="flex-1"
      disabled={!canSubmit()}
      onclick={() =>
        onSubmit({
          withAssignment: assignToServiceMonitor,
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
        })}
    >
      Save channel to {clusterName} project
    </Button>
  </div>
</div>

{#snippet methodSelect(close: () => void)}
  <Menu class="ld-card-base rounded-xl">
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
