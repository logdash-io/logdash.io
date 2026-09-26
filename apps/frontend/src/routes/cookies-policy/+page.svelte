<script>
  import LegalPage from '$lib/domains/shared/ui/legal/LegalPage.svelte';
  import { cookiesPolicyDefinition } from './definition';
</script>

<LegalPage
  definition={cookiesPolicyDefinition}
  title="Cookies policy"
  description="Which cookies Logdash sets, what each one is for and how long it lives in your browser."
/>
