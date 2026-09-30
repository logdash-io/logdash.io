<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import {
    wizardState,
    type ScrollTarget,
  } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';
  import { SettingsCard } from '$lib/domains/shared/ui/components/settings-card';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import {
    readHttpErrorMessage,
    readHttpErrorStatus,
  } from '$lib/domains/shared/http/http-error';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import { Button } from '@logdash/hyper-ui/presentational';
  import ProjectDetailsStep from './steps/ProjectDetailsStep.svelte';
  import ServicesStep from './steps/ServicesStep.svelte';

  const step = $derived(wizardState.step);
  const isValid = $derived(wizardState.isValid);
  const isSubmitting = $derived(wizardState.isSubmitting);

  onMount(() => {
    wizardState.setScrollHandler(scrollToElement);
  });

  function onNextStep(): void {
    wizardState.nextStep();
  }

  async function onSubmit(): Promise<void> {
    try {
      await wizardState.submit();
    } catch (error) {
      if (readHttpErrorStatus(error) === 409) {
        upgradeState.openModal('project-limit');
        return;
      }

      const reason = readHttpErrorMessage(error);
      toast.error(
        reason ? `Failed to add domain: ${reason}` : 'Failed to add domain',
      );
    }
  }

  function scrollToElement(target: ScrollTarget): void {
    document
      .getElementById(`wizard-${target}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
</script>

<div id="wizard-project">
  <SettingsCard
    title="Domain"
    description="The domain your services run on. You can change it later."
  >
    <ProjectDetailsStep />

    {#if step === 1}
      {@render actions()}
    {/if}
  </SettingsCard>
</div>

{#if step >= 2}
  <div id="wizard-services">
    <SettingsCard
      title="Services"
      description="The parts of your domain, like a website, an API or a worker."
    >
      <ServicesStep />

      {@render actions()}
    </SettingsCard>
  </div>
{/if}

{#snippet actions()}
  <div class="flex items-center gap-2 p-4">
    {#if step === 1}
      <Button
        variant="primary"
        size="sm"
        disabled={!wizardState.canProceedToStep2}
        onclick={onNextStep}
      >
        Next step
      </Button>
    {:else}
      <Button
        variant="primary"
        size="sm"
        disabled={!isValid}
        loading={isSubmitting}
        onclick={onSubmit}
      >
        Add domain
      </Button>
    {/if}

    <Button variant="ghost" size="sm" href={resolve('/app/domains')}>
      Cancel
    </Button>
  </div>
{/snippet}
