<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { createAnonymousSession } from '$lib/domains/anonymous/application/create-anonymous-session';
  import { AnonymousStartError } from '$lib/domains/anonymous/domain/anonymous-preview';
  import { sessionService } from '$lib/domains/anonymous/infrastructure/session.service';
  import { createLogger } from '$lib/domains/shared/logger';
  import { onMount } from 'svelte';
  import { posthog } from 'posthog-js';
  import {
    Alert,
    Button,
    Card,
    CardBody,
    CardTitle,
    Spinner,
  } from '@logdash/hyper-ui/presentational';

  const logger = createLogger('quick-setup', false);

  let isChecking = $state(true);
  let isCreating = $state(false);
  let errorMessage = $state<string | null>(null);

  async function onCreateDashboard(): Promise<void> {
    if (isCreating) {
      return;
    }

    isCreating = true;
    errorMessage = null;

    try {
      const { clusterId, projectId } = await createAnonymousSession();

      posthog.capture('anonymous_dashboard_created', { source: 'quick-setup' });

      await goto(resolve(`/app/clusters/${clusterId}/${projectId}`));
    } catch (error) {
      logger.error('Failed to create the anonymous dashboard', error);

      errorMessage = AnonymousStartError.from(error).message;
      isCreating = false;
    }
  }

  async function redirectIfSessionExists(): Promise<void> {
    try {
      const session = await sessionService.probeSession();

      if (session.user) {
        await goto(resolve('/app/clusters'));
        return;
      }
    } catch (error) {
      logger.debug('Failed to probe the existing session', error);
    } finally {
      isChecking = false;
    }
  }

  onMount(() => {
    void redirectIfSessionExists();
  });
</script>

<div class="flex flex-1 items-center justify-center p-6">
  {#if isChecking}
    <Spinner size="lg" />
  {:else}
    <Card class="w-md">
      <CardBody class="items-center gap-4 p-6 text-center">
        <CardTitle class="text-3xl font-bold">
          Get a dashboard, instantly
        </CardTitle>

        <p class="text-neutral-400">
          No signup. Just a live dashboard to try logs, metrics and monitoring.
        </p>

        {#if errorMessage}
          <Alert variant="error" role="alert">
            {errorMessage}
          </Alert>
        {/if}

        <Button
          variant="primary"
          block
          data-posthog-id="quick-setup-create-dashboard-cta"
          loading={isCreating}
          onclick={onCreateDashboard}
        >
          Create your dashboard
        </Button>
      </CardBody>
    </Card>
  {/if}
</div>
