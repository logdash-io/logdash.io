<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import AuthPage from '$lib/domains/auth/ui/AuthPage.svelte';
  import type { User } from '$lib/domains/shared/user/domain/user';
  import OnboardingFlow from './OnboardingFlow.svelte';

  type Props = {
    user: User;
    nextUrl: string;
  };

  let { user, nextUrl }: Props = $props();

  async function onComplete(): Promise<void> {
    if (!nextUrl.startsWith('/app')) {
      window.location.assign(nextUrl);

      return;
    }

    await goto(resolve(nextUrl as '/app/clusters'), { invalidateAll: true });
  }
</script>

<AuthPage>
  <div class="mt-[max(4rem,calc(50dvh-14rem))] w-full max-w-100 self-start">
    <OnboardingFlow {user} oncomplete={onComplete} />
  </div>
</AuthPage>
