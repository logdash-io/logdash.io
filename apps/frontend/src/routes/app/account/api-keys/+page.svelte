<script lang="ts">
  import PersonalApiKeys from '$lib/domains/app/personal-api-keys/ui/PersonalApiKeys.svelte';
  import type { PageProps } from './$types';

  const { data }: PageProps = $props();
</script>

<PersonalApiKeys apiKeys={data.apiKeys} />
