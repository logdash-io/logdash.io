import HomeIcon from '$lib/domains/shared/icons/HomeIcon.svelte';
import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
import SettingsIcon from '$lib/domains/shared/icons/SettingsIcon.svelte';
import type { Component } from 'svelte';
import type { ClassValue } from 'svelte/elements';

export type ServiceTabItem = {
  id: string;
  label: string;
  icon: Component<{ class?: ClassValue }>;
};

export const SERVICE_TAB_ITEMS: ServiceTabItem[] = [
  { id: 'overview', label: 'Overview', icon: HomeIcon },
  { id: 'logs', label: 'Logs', icon: LogsIcon },
  { id: 'metrics', label: 'Metrics', icon: MetricsIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];
