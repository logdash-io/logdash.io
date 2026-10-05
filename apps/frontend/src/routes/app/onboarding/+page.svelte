<script lang="ts">
  import OnboardingPage from '$lib/domains/onboarding/ui/OnboardingPage.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<SeoMeta
  title="Welcome | Logdash"
  description="Finish setting up your Logdash account."
  robots="noindex, nofollow"
/>

<OnboardingPage nextUrl={data.nextUrl} />
