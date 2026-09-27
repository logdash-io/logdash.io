<script lang="ts">
  import { customDomainsState } from '$lib/domains/app/projects/application/public-dashboards/custom-domains.state.svelte.js';
  import UpgradeButton from '$lib/domains/shared/upgrade/UpgradeButton.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { CheckIcon, CloseIcon, DangerIcon } from '@logdash/hyper-ui/icons';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import {
    Alert,
    Button,
    Collapse,
    Input,
    Spinner,
    Swap,
  } from '@logdash/hyper-ui/presentational';
  import Highlight from 'svelte-highlight';
  import { bash } from 'svelte-highlight/languages';

  type Props = {
    dashboardId: string;
  };

  const { dashboardId }: Props = $props();

  let domainInput = $state('');
  let copied = $state(false);
  const customDomain = $derived(
    customDomainsState.getCustomDomain(dashboardId),
  );
  const isLoading = $derived(customDomainsState.isLoading(dashboardId));
  const error = $derived(customDomainsState.error);
  const hasDomain = $derived(!!customDomain);
  const canSetup = $derived(userState.canSetupCustomDomain);

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

  const onSaveDomain = async (): Promise<void> => {
    if (!domainInput.trim()) return;

    await customDomainsState.createCustomDomain(dashboardId, {
      domain: domainInput.trim(),
    });
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

    await customDomainsState.deleteCustomDomain(dashboardId);
  };

  const onManualCheck = async (): Promise<void> => {
    await customDomainsState.manualCheck(dashboardId);
  };

  const onCopyDnsRecord = async (): Promise<void> => {
    if (!customDomain) return;

    const dnsRecord = `CNAME ${customDomain.domain} statuspage.logdash.io`;
    await navigator.clipboard.writeText(dnsRecord);
    copied = true;
  };

  $effect(() => {
    if (!copied) return;

    const timeout = setTimeout(() => {
      copied = false;
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  });
</script>

{#if !canSetup}
  <UpgradeButton source="custom-statuspage-domain">
    Available in Pro plan
  </UpgradeButton>
{:else}
  <p class="text-neutral-400 mb-3">
    Host your status page on any domain you own.
  </p>

  <div
    class="border-border-default bg-surface-root overflow-hidden rounded-lg border"
  >
    <Collapse
      locked
      open
      class="rounded-none px-2 py-1"
      titleClass="font-medium"
    >
      {#snippet title()}1. Add your custom domain{/snippet}
      {#if !customDomain}
        <div class="flex flex-col gap-2 sm:flex-row">
          <Input
            variant="outline"
            bind:value={domainInput}
            class="min-w-0 flex-1"
            placeholder="status.example.com"
            type="text"
            disabled={isLoading}
            onkeydown={onDomainKeydown}
          />
          <Button
            variant="primary"
            size="sm"
            class="shrink-0"
            loading={isLoading}
            disabled={!domainInput.trim()}
            onclick={onSaveDomain}
          >
            Save
          </Button>
        </div>
      {:else}
        <div class="flex flex-col gap-2 sm:flex-row">
          <Input
            variant="outline"
            value={customDomain.domain}
            class="min-w-0 flex-1 break-all"
            readonly
            disabled
          />
          <Button
            variant="danger-ghost"
            size="sm"
            class="shrink-0"
            loading={isLoading}
            onclick={onDeleteDomain}
          >
            Delete
          </Button>
        </div>
      {/if}

      {#if error}
        <Alert variant="error" class="text-error mt-4">
          <CloseIcon class="h-4 w-4 shrink-0" />
          <span class="break-words">{error}</span>
        </Alert>
      {/if}
    </Collapse>

    <div class="px-6">
      <hr class="border-border-default" />
    </div>

    <Collapse
      locked
      open={hasDomain}
      class="px-2 py-1"
      titleClass={['font-medium', { 'opacity-50': !hasDomain }]}
      contentClass="w-full overflow-auto"
    >
      {#snippet title()}2. Configure DNS records{/snippet}
      {#if !customDomain}
        <p class="text-neutral-500 text-sm">
          Add a custom domain first to see DNS configuration instructions.
        </p>
      {:else}
        <p class="text-neutral-400 mb-4 text-sm">
          You can configure these in your DNS provider, for example Cloudflare
          or AWS Route 53.
        </p>

        <div class="border-border-default space-y-3 rounded-xl border p-4">
          <p class="text-sm">
            To serve your page at <span class="break-all font-medium">
              {customDomain.domain}
            </span>
            you must add these DNS records.
          </p>

          <Alert variant="warning" class="rounded-lg">
            <DangerIcon class="size-4 shrink-0" />
            <span class="text-sm">
              If you're using Cloudflare, be careful to create these records in
              'DNS-only' mode, not proxy mode.
            </span>
          </Alert>

          <div
            class="ld-card-base w-full overflow-x-auto overflow-y-hidden rounded-xl text-sm"
          >
            <div class="relative">
              <Highlight
                class="code-snippet selection:bg-surface-100"
                code={`CNAME ${customDomain.domain} statuspage.logdash.io`}
                language={bash}
              />

              <Button
                size="sm"
                shape="square"
                class="bg-surface-100 absolute right-2 top-2 border-transparent"
                aria-label="Copy DNS record"
                onclick={onCopyDnsRecord}
              >
                <Swap active={copied}>
                  {#snippet on()}
                    <CheckIcon class="text-success h-4 w-4" />
                  {/snippet}
                  {#snippet off()}
                    <CopyIcon class="h-4 w-4" />
                  {/snippet}
                </Swap>
              </Button>
            </div>
          </div>
        </div>
      {/if}
    </Collapse>

    <div class="px-6">
      <hr class="border-border-default" />
    </div>

    <Collapse
      locked
      open={hasDomain}
      class="px-2 py-1"
      titleClass={['font-medium', { 'opacity-50': !hasDomain }]}
    >
      {#snippet title()}3. Verify your configuration{/snippet}
      <div class="flex items-center justify-between gap-3 text-sm">
        <div class="flex items-center gap-3">
          {#if customDomain?.status === 'verifying'}
            <div class="text-warning flex items-center gap-3">
              <Spinner class="w-3" aria-hidden="true" />
              <div>
                <div class="text-warning">Domain is pending verification</div>
              </div>
            </div>
          {:else if customDomain?.status === 'verified'}
            <div class="text-success flex items-center gap-2">
              <CheckIcon class="h-4 w-4 shrink-0" />
              <span>Domain is verified</span>
            </div>
          {:else}
            <div class="text-error flex items-center gap-2">
              <CloseIcon class="h-4 w-4 shrink-0" />
              <span>Domain verification failed</span>
            </div>
          {/if}
        </div>

        {#if customDomain?.status === 'verifying'}
          <div class="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              loading={isLoading}
              onclick={onManualCheck}
            >
              Check
            </Button>
          </div>
        {/if}
      </div>
    </Collapse>
  </div>
{/if}
