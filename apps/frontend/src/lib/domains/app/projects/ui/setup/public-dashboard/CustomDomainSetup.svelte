<script lang="ts">
  import { customDomainsState } from '$lib/domains/app/projects/application/public-dashboards/custom-domains.state.svelte.js';
  import { UserTier } from '$lib/domains/shared/types.js';
  import UpgradeButton from '$lib/domains/shared/upgrade/UpgradeButton.svelte';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { isDev } from '$lib/domains/shared/utils/is-dev.util.js';
  import { AlertTriangleIcon, CheckIcon, XIcon, Copy } from 'lucide-svelte';
  import { onMount } from 'svelte';
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
      customDomainsState.loadCustomDomain(dashboardId);
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

  const saveDomain = async (): Promise<void> => {
    if (!domainInput.trim()) return;

    await customDomainsState.createCustomDomain(dashboardId, {
      domain: domainInput.trim(),
    });
    domainInput = '';
  };

  const handleDeleteDomain = async (): Promise<void> => {
    if (!customDomain) return;

    const confirmed = confirm(
      `Are you sure you want to delete the custom domain "${customDomain.domain}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    await customDomainsState.deleteCustomDomain(dashboardId);
  };

  const handleManualCheck = async (): Promise<void> => {
    await customDomainsState.manualCheck(dashboardId);
  };

  const copyDnsRecord = async (): Promise<void> => {
    if (!customDomain) return;

    const dnsRecord = `CNAME ${customDomain.domain} ${isDev() ? 'dev-statuspage' : 'statuspage'}.logdash.io`;
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
  <UpgradeButton to={UserTier.PRO} source="custom-statuspage-domain">
    Available in Pro plan
  </UpgradeButton>
{:else}
  <p class="text-base-content/70 mb-3">
    Host your status page on any domain you own.
  </p>

  <div class="border-base-100 bg-base-300 overflow-hidden rounded-lg border">
    <div class="collapse-open collapse rounded-none px-2 py-1">
      <div class="collapse-title font-semibold">1. Add your custom domain</div>
      <div class="collapse-content">
        {#if !hasDomain}
          <div class="flex flex-col gap-2 sm:flex-row">
            <input
              bind:value={domainInput}
              class="input ld-input ld-input-padding min-w-0 flex-1"
              placeholder="status.example.com"
              type="text"
              disabled={isLoading}
              onkeydown={(e) => {
                if (e.key === 'Enter' && !isLoading && domainInput.trim()) {
                  e.preventDefault();
                  saveDomain();
                }
              }}
            />
            <button
              class="btn btn-primary btn-sm shrink-0"
              onclick={saveDomain}
              disabled={isLoading || !domainInput.trim()}
            >
              {#if isLoading}
                <span class="loading loading-spinner w-3"></span>
              {/if}
              Save
            </button>
          </div>
        {:else}
          <div class="flex flex-col gap-2 sm:flex-row">
            <input
              value={customDomain.domain}
              class="input ld-input ld-input-padding min-w-0 flex-1 break-all"
              readonly
              disabled
            />
            <button
              class="btn btn-error btn-outline btn-sm shrink-0"
              onclick={handleDeleteDomain}
              disabled={isLoading}
            >
              {#if isLoading}
                <span class="loading loading-spinner w-3"></span>
              {/if}
              Delete
            </button>
          </div>
        {/if}

        {#if error}
          <div class="alert error-card mt-4">
            <XIcon class="h-4 w-4 shrink-0" />
            <span class="break-words">{error}</span>
          </div>
        {/if}
      </div>
    </div>

    <div class="px-6">
      <hr class="border-base-100" />
    </div>

    <div
      class={[
        'collapse px-2 py-1',
        {
          'collapse-open': hasDomain,
        },
      ]}
    >
      {#if hasDomain}
        <input type="checkbox" />
      {/if}
      <div
        class={[
          'collapse-title font-semibold',
          {
            'opacity-50': !hasDomain,
          },
        ]}
      >
        2. Configure DNS records
      </div>
      <div class="collapse-content w-full overflow-auto">
        {#if !hasDomain}
          <p class="text-base-content/50 text-sm">
            Add a custom domain first to see DNS configuration instructions.
          </p>
        {:else}
          <p class="text-base-content/70 mb-4 text-sm">
            You can configure these in your DNS provider, for example Cloudflare
            or AWS Route 53.
          </p>

          <div class="border-base-100 space-y-3 rounded-xl border p-4">
            <p class="text-sm">
              To serve your page at <span class="break-all font-semibold">
                {customDomain.domain}
              </span>
              you must add these DNS records.
            </p>

            <div
              class="alert alert-warning bg-warning/10 border-warning/30 rounded-lg"
            >
              <AlertTriangleIcon class="h-4 w-4 shrink-0" />
              <span class="text-sm">
                If you're using Cloudflare, be careful to create these records
                in 'DNS-only' mode, not proxy mode.
              </span>
            </div>

            <div
              class="ld-card-base w-full overflow-x-auto overflow-y-hidden rounded-xl text-sm"
            >
              <div class="relative">
                <Highlight
                  class="code-snippet selection:bg-base-100"
                  code={`CNAME ${customDomain.domain} ${isDev() ? 'dev-statuspage' : 'statuspage'}.logdash.io`}
                  language={bash}
                />

                <label
                  class="btn btn-sm btn-square bg-base-100 swap swap-rotate absolute right-2 top-2 border-transparent"
                  for="copy-dns-record"
                  onclick={copyDnsRecord}
                >
                  <input
                    bind:checked={copied}
                    id="copy-dns-record"
                    type="checkbox"
                  />

                  <CheckIcon class="swap-on text-success h-4 w-4" />

                  <Copy class="swap-off h-4 w-4" />
                </label>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="px-6">
      <hr class="border-base-100" />
    </div>

    <div
      class={[
        'collapse px-2 py-1',
        {
          'collapse-open': hasDomain,
        },
      ]}
    >
      {#if hasDomain}
        <input type="checkbox" />
      {/if}
      <div
        class={[
          'collapse-title font-semibold',
          {
            'opacity-50': !hasDomain,
          },
        ]}
      >
        3. Verify your configuration
      </div>
      <div class="collapse-content">
        <div class="flex items-center justify-between gap-3 text-sm">
          <div class="flex items-center gap-3">
            {#if customDomain?.status === 'verifying'}
              <div class="text-warning flex items-center gap-3">
                <span class="loading loading-spinner w-3"></span>
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
                <XIcon class="h-4 w-4 shrink-0" />
                <span>Domain verification failed</span>
              </div>
            {/if}
          </div>

          {#if customDomain?.status === 'verifying'}
            <div class="flex items-center gap-2">
              <button
                class="btn btn-secondary btn-sm"
                disabled={isLoading}
                onclick={handleManualCheck}
              >
                {#if isLoading}
                  <span class="loading loading-spinner w-3"></span>
                {/if}

                Check
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
