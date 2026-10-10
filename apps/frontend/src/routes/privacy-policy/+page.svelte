<script lang="ts">
  import LegalPage from '$lib/domains/shared/ui/legal/LegalPage.svelte';
  import { Button } from '@logdash/hyper-ui/presentational';
  import { onMount } from 'svelte';
  import { PPdefinition } from './definition';

  // The tracker keeps the choice under this documented key. Writing it here too
  // covers pages where the script has not loaded.
  const OPT_OUT_KEY = 'logdash:opt-out';

  let optedOut = $state(false);

  // The page is prerendered, so the stored choice is read in the browser.
  onMount(() => {
    try {
      optedOut = localStorage.getItem(OPT_OUT_KEY) === '1';
    } catch {
      optedOut = false;
    }
  });

  function toggle(): void {
    optedOut = !optedOut;
    try {
      if (optedOut) localStorage.setItem(OPT_OUT_KEY, '1');
      else localStorage.removeItem(OPT_OUT_KEY);
    } catch {
      // Storage is blocked, so the choice lasts for this page only.
    }
    if (optedOut) window.logdash?.optOut();
    else window.logdash?.optIn();
  }
</script>

<LegalPage
  definition={PPdefinition}
  title="Privacy policy"
  description="How Logdash collects, stores and uses the data you send us, and what we never do with it."
  updated="10 October 2026"
>
  <section class="flex flex-col items-start gap-4">
    <h2
      id="analytics-opt-out"
      class="text-fg-default scroll-mt-24 text-xl font-medium tracking-[-0.02em]"
    >
      Analytics opt-out
    </h2>
    <p aria-live="polite">
      {optedOut
        ? 'The Website Analytics is off in this browser.'
        : 'The Website Analytics is on in this browser.'}
    </p>
    <Button size="sm" onclick={toggle}>
      {optedOut ? 'Turn analytics back on' : 'Opt out of analytics'}
    </Button>
  </section>
</LegalPage>
