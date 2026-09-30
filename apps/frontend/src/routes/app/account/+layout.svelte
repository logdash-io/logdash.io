<script lang="ts">
  import type { Cluster } from '$lib/domains/app/clusters/domain/cluster';
  import type { User } from '$lib/domains/shared/user/domain/user';
  import type { Snippet } from 'svelte';
  import ClustersLayout from '../domains/+layout.svelte';

  type Props = {
    data: { clusters: Cluster[]; user: User };
    children: Snippet;
  };
  const { data, children }: Props = $props();
</script>

<ClustersLayout {data}>
  {@render children()}
</ClustersLayout>
