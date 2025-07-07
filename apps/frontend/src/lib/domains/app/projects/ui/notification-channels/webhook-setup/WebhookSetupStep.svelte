<script lang="ts">
  import { autoFocus } from '$lib/domains/shared/ui/actions/use-autofocus.svelte.js';
  import Tooltip from '$lib/domains/shared/ui/components/Tooltip.svelte';
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import { UserTier } from '$lib/domains/shared/types.js';
  import { LinkIcon, XIcon } from 'lucide-svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';

  type Header = {
    key: string;
    value: string;
  };

  type Props = {
    clusterName: string;
    monitorName: string;
    userTier: UserTier;
    onCancel?: () => void;
    onSubmit: (dto: {
      withAssignment: boolean;
      url: string;
      headers: Record<string, string>;
      method: string;
      name: string;
    }) => void;
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
      <h3 class="text-xl font-semibold">Configure webhook channel</h3>
      <p class="text-secondary/70 text-sm">
        Add it with a memorable name to your project.
      </p>
    </div>
  </div>

  <div class="space-y-2 text-base">
    <input
      bind:value={webhookName}
      class="ld-input ld-input-padding"
      placeholder={'Memorable webhook name'}
      type="text"
      use:autoFocus={{ selectAll: true }}
    />

    <div class="join relative w-full">
      {#snippet methodSelect(close: () => void)}
        <ul class="menu ld-card-base rounded-xl">
          {#each ALLOWED_METHODS as _method}
            <li>
              <UpgradeElement
                enabled={_method !== 'GET' && !canUseAdvancedMethods}
                source="webhook-method-restriction"
                class="w-full"
                onclick={() => {
                  if (_method === 'GET' || canUseAdvancedMethods) {
                    method = _method;
                    close();
                  }
                }}
              >
                <span>{_method}</span>
                {#if _method !== 'GET' && !canUseAdvancedMethods}
                  <span
                    class="badge badge-primary badge-xs badge-soft uppercase"
                  >
                    Upgrade
                  </span>
                {/if}
              </UpgradeElement>
            </li>
          {/each}
        </ul>
      {/snippet}

      <Tooltip content={methodSelect} placement="bottom" trigger="click">
        <button class="btn btn-transparent btn-sm absolute top-0.5 left-0">
          {method}
        </button>
      </Tooltip>

      <input
        bind:value={webhookUrl}
        class="join-item ld-input py-2 pr-3 pl-16"
        placeholder={'Webhook URL'}
        type="text"
      />
    </div>

    <div class="flex flex-col gap-2">
      {#each headers as header, index}
        <div class="flex items-center gap-2">
          <div class="flex-1">
            <input
              type="text"
              bind:value={header.key}
              class={[
                'ld-input ld-input-padding',
                { 'input-error': !isValidHeaderName(header.key) },
              ]}
              placeholder={'Key'}
              use:autoFocus={{
                enabled: index === headers.length - 1,
              }}
            />
            {#if header.key && !isValidHeaderName(header.key)}
              <div class="text-error mt-1 text-xs">
                Header name can only contain letters, numbers, and hyphens
              </div>
            {/if}
          </div>
          <div class="flex-1">
            <input
              type="text"
              bind:value={header.value}
              class={[
                'ld-input ld-input-padding',
                { 'input-error': !isValidHeaderValue(header.value) },
              ]}
              placeholder={'Value'}
            />
            {#if header.value && !isValidHeaderValue(header.value)}
              <div class="text-error mt-1 text-xs">
                Header value contains invalid characters
              </div>
            {/if}
          </div>
          <button
            class="btn btn-ghost btn-sm"
            onclick={() => {
              headers.splice(index, 1);
            }}
          >
            <XIcon class="h-4 w-4" />
          </button>
        </div>
      {/each}

      <UpgradeElement
        enabled={!canUseCustomHeaders}
        source="webhook-headers-restriction"
        class="w-full"
      >
        <button
          class="btn btn-neutral btn-md flex w-full items-center justify-center gap-2"
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
            <span class="badge badge-primary badge-sm">Upgrade</span>
          {/if}
        </button>
      </UpgradeElement>
    </div>
  </div>

  <div class="flex items-center justify-start gap-2 select-none">
    <input
      type="checkbox"
      id="assign-service-monitor"
      bind:checked={assignToServiceMonitor}
      class="checkbox checkbox-primary checkbox-sm"
    />
    <label for="assign-service-monitor" class="cursor-pointer text-sm">
      Assign to {monitorName} service monitor
    </label>
  </div>

  <div class="flex gap-3">
    <button
      type="button"
      class="btn btn-secondary btn-soft flex-1"
      onclick={onCancel}
    >
      Back
    </button>
    <button
      type="button"
      class="btn btn-primary flex-1"
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
    </button>
  </div>
</div>
