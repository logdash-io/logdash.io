<script lang="ts">
  import CodeIcon from '$lib/domains/shared/icons/CodeIcon.svelte';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import {
    ClusterRole,
    canManageTeam,
  } from '$lib/domains/app/clusters/domain/cluster-invite';
  import {
    SETTINGS_PAGE_CLASS,
    SettingsCard,
    SettingsToc,
  } from '$lib/domains/shared/ui/components/settings-card';
  import { WebAnalyticsSetupState } from '$lib/domains/web-analytics/application/web-analytics-setup.state.svelte';
  import WebAnalyticsSetup from '$lib/domains/web-analytics/ui/WebAnalyticsSetup.svelte';
  import DangerZoneCard from './DangerZoneCard.svelte';
  import DomainAlertsCard from './DomainAlertsCard.svelte';
  import ProjectInfoCard from './ProjectInfoCard.svelte';
  import TeamManagementCard from './TeamManagementCard.svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  const connection = new WebAnalyticsSetupState();

  const role = $derived(clustersState.userRole(clusterId));
  const canManage = $derived(canManageTeam(role));
</script>

<div class={SETTINGS_PAGE_CLASS}>
  <SettingsToc />

  <SettingsCard
    title="Tracking script"
    icon={CodeIcon}
    description="Counts visitors on your website. Add it once, it sends every page view."
  >
    <div class="px-3 pt-2 pb-3">
      <WebAnalyticsSetup {clusterId} {connection} />
    </div>
  </SettingsCard>

  <DomainAlertsCard {clusterId} />

  <ProjectInfoCard {clusterId} canEdit={canManage} />

  {#if canManage}
    <TeamManagementCard {clusterId} />
  {/if}

  {#if role === ClusterRole.CREATOR}
    <DangerZoneCard {clusterId} />
  {/if}
</div>
