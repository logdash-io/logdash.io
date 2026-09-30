<script lang="ts">
  import { customDomainsState } from '$lib/domains/app/projects/application/public-dashboards/custom-domains.state.svelte.js';
  import UpgradeButton from '$lib/domains/shared/upgrade/UpgradeButton.svelte';
  import { CheckIcon, CloseIcon, DangerIcon } from '@logdash/hyper-ui/icons';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import {
    Button,
    Input,
    Spinner,
    Swap,
  } from '@logdash/hyper-ui/presentational';

  type Props = {
    dashboardId: string;
    canSetup: boolean;
  };

  const { dashboardId, canSetup }: Props = $props();

  const FIELD_CLASS =
    'border-hairline bg-neutral-950 h-8 w-full rounded-lg px-2.5 text-sm';
  const DNS_TARGET = 'statuspage.logdash.io';

  let domainInput = $state('');
  let copied = $state(false);
  const customDomain = $derived(
    customDomainsState.getCustomDomain(dashboardId),
  );
  const isLoading = $derived(customDomainsState.isLoading(dashboardId));
  const error = $derived(customDomainsState.error);
  const dnsRecord = $derived(
    customDomain ? `CNAME ${customDomain.domain} ${DNS_TARGET}` : '',
  );

  $effect(() => {
    if (canSetup) {
      void customDomainsState.loadCustomDomain(dashboardId);
    }
  });

  $effect(() => {
    if (!customDomain || !canSetup || customDomain.status !== 'verifying') {
      return;
    }

    const stopPolling = customDomainsState.startStatusPolling(dashboardId);

    return () => {
      stopPolling?.();
    };
  });

  $effect(() => {
    if (!copied) return;

    const timeout = setTimeout(() => {
      copied = false;
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  });

  const onSaveDomain = async (): Promise<void> => {
    if (!domainInput.trim()) return;

    try {
      await customDomainsState.createCustomDomain(dashboardId, {
        domain: domainInput.trim(),
      });
    } catch {
      return;
    }

    domainInput = '';
  };

  const onDomainKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' || isLoading || !domainInput.trim()) return;

    event.preventDefault();
    void onSaveDomain();
  };

  const onDeleteDomain = async (): Promise<void> => {
    if (!customDomain) return;

    const confirmed = confirm(
      `Are you sure you want to delete the custom domain "${customDomain.domain}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await customDomainsState.deleteCustomDomain(dashboardId);
    } catch {
      return;
    }
  };

  const onManualCheck = async (): Promise<void> => {
    await customDomainsState.manualCheck(dashboardId);
  };

  const onCopyDnsRecord = async (): Promise<void> => {
    await navigator.clipboard.writeText(dnsRecord);
    copied = true;
  };
</script>

{#if !canSetup}
  <UpgradeButton
    variant="neutral"
    source="custom-statuspage-domain"
    class="self-start"
  >
    Available in Pro plan
  </UpgradeButton>
{:else}
  <ol class="flex flex-col gap-6">
    <li class="flex flex-col gap-2">
      <span class="text-sm">1. Add your custom domain</span>

      {#if !customDomain}
        <div class="flex gap-2">
          <Input
            aria-label="Custom domain"
            bind:value={domainInput}
            class={FIELD_CLASS}
            placeholder="status.example.com"
            type="text"
            disabled={isLoading}
            onkeydown={onDomainKeydown}
          />
          <Button
            variant="primary"
            size="sm"
            loading={isLoading}
            disabled={!domainInput.trim()}
            onclick={onSaveDomain}
          >
            Save
          </Button>
        </div>
      {:else}
        <div class="flex gap-2">
          <span class={[FIELD_CLASS, 'flex min-w-0 items-center border']}>
            <span class="truncate">{customDomain.domain}</span>
          </span>
          <Button
            variant="danger"
            size="sm"
            loading={isLoading}
            onclick={onDeleteDomain}
          >
            Delete
          </Button>
        </div>
      {/if}

      {#if error}
        <p class="text-error flex items-start gap-2 text-sm">
          <CloseIcon class="mt-0.5 size-4 shrink-0" />
          <span class="min-w-0 break-words">{error}</span>
        </p>
      {/if}
    </li>

    <li class="flex flex-col gap-2">
      <span class={['text-sm', { 'text-neutral-600': !customDomain }]}>
        2. Configure DNS records
      </span>

      {#if customDomain}
        <p class="text-sm text-neutral-500">
          Add this record in your DNS provider, for example Cloudflare or AWS
          Route 53.
        </p>

        <div class="flex items-start gap-2">
          <code
            class={[
              FIELD_CLASS,
              'flex h-auto min-h-8 min-w-0 items-center border py-1.5 font-mono break-all',
            ]}
          >
            {dnsRecord}
          </code>
          <IconButton
            label="Copy DNS record"
            tooltip="Copy"
            class="mt-0.5"
            onclick={onCopyDnsRecord}
          >
            <Swap active={copied}>
              {#snippet on()}
                <CheckIcon class="text-success size-4" />
              {/snippet}
              {#snippet off()}
                <CopyIcon class="size-4" />
              {/snippet}
            </Swap>
          </IconButton>
        </div>

        <p class="text-warning flex items-start gap-2 text-sm">
          <DangerIcon class="mt-0.5 size-4 shrink-0" />
          If you're using Cloudflare, create the record in DNS-only mode, not proxy
          mode.
        </p>
      {/if}
    </li>

    <li class="flex flex-col gap-2">
      <span class={['text-sm', { 'text-neutral-600': !customDomain }]}>
        3. Verify your configuration
      </span>

      {#if customDomain?.status === 'verifying'}
        <div class="flex flex-wrap items-center justify-between gap-3">
          <span class="text-warning flex items-center gap-2 text-sm">
            <Spinner class="size-3.5 shrink-0" aria-hidden="true" />
            Domain is pending verification
          </span>
          <Button
            variant="neutral"
            size="sm"
            loading={isLoading}
            onclick={onManualCheck}
          >
            Check
          </Button>
        </div>
      {:else if customDomain?.status === 'verified'}
        <span class="text-success flex items-center gap-2 text-sm">
          <CheckIcon class="size-4 shrink-0" />
          Domain is verified
        </span>
      {:else if customDomain}
        <span class="text-error flex items-center gap-2 text-sm">
          <CloseIcon class="size-4 shrink-0" />
          Domain verification failed
        </span>
      {/if}
    </li>
  </ol>
{/if}
