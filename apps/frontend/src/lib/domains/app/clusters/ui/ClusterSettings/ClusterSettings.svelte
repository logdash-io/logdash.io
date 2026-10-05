<script lang="ts">
  import CodeIcon from '$lib/domains/shared/icons/CodeIcon.svelte';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import {
    SETTINGS_PAGE_CLASS,
    SettingsCard,
    SettingsToc,
  } from '$lib/domains/shared/ui/components/settings-card';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { WebAnalyticsSetupState } from '$lib/domains/web-analytics/application/web-analytics-setup.state.svelte';
  import WebAnalyticsSetup from '$lib/domains/web-analytics/ui/WebAnalyticsSetup.svelte';
  import DangerZoneCard from './DangerZoneCard.svelte';
  import ProjectInfoCard from './ProjectInfoCard.svelte';
  import TeamManagementCard from './TeamManagementCard.svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  const connection = new WebAnalyticsSetupState();

  const isCreator = $derived(
    userState.id
      ? clustersState.isUserClusterCreator(userState.id, clusterId)
      : false,
  );
</script>

<div class={SETTINGS_PAGE_CLASS}>
  <SettingsToc />

  <SettingsCard
    title="Tracking script"
    icon={CodeIcon}
    description="Counts visitors on your website. Add it once, it sends every page view."
  >
    <div class="p-4">
      <WebAnalyticsSetup {clusterId} {connection} />
    </div>
  </SettingsCard>

  <ProjectInfoCard {clusterId} canEdit={isCreator} />

  {#if isCreator}
    <TeamManagementCard {clusterId} />
    <DangerZoneCard {clusterId} />
  {/if}
</div>
