<script lang="ts">
  import { saveOnboardingAnswers } from '$lib/domains/onboarding/application/save-onboarding';
  import {
    parseOnboardingAnswersDto,
    type OnboardingAnswersDto,
  } from '$lib/domains/onboarding/domain/onboarding-dtos';
  import { ONBOARDING_QUESTIONS } from '$lib/domains/onboarding/domain/onboarding-questions';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { Button, Select } from '@logdash/hyper-ui/presentational';

  const id = $props.id();

  let answers = $state({ role: '', source: '' });
  let saving = $state<'answers' | 'skip' | null>(null);
  let failed = $state(false);

  const dto = $derived(parseOnboardingAnswersDto(answers));
  const answeredAny = $derived(Boolean(dto?.role || dto?.source));

  async function onSave(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    await save('answers', dto ?? {});
  }

  async function save(
    kind: 'answers' | 'skip',
    answersDto: OnboardingAnswersDto,
  ): Promise<void> {
    saving = kind;
    failed = false;

    try {
      await saveOnboardingAnswers(answersDto);
    } catch {
      saving = null;
      failed = true;
      return;
    }

    if (userState.user) {
      userState.set({
        ...userState.user,
        onboardingCompletedAt: new Date().toISOString(),
      });
    }
  }
</script>

<form
  class="flex flex-col gap-3"
  onsubmit={onSave}
  aria-labelledby="{id}-title"
>
  <div class="flex flex-col gap-0.5">
    <h3 id="{id}-title" class="text-sm font-medium">Two quick questions</h3>
    <p class="text-[13px] text-fg-muted">
      They help us build the right things.
    </p>
  </div>

  <div class="grid gap-3 sm:grid-cols-2">
    {#each ONBOARDING_QUESTIONS as question (question.key)}
      <label class="flex min-w-0 flex-col gap-1.5">
        <span class="text-sm text-fg-tertiary">{question.label}</span>
        <Select
          bind:value={answers[question.key]}
          class={[
            'w-full border-surface-input-border bg-surface-input-bg transition-ink hover:border-surface-input-hover-border focus:border-brand',
            { 'text-fg-muted': !answers[question.key] },
          ]}
        >
          <option value="" class="text-fg-muted">Choose one</option>
          {#each question.options as option (option.value)}
            <option value={option.value} class="text-fg-default">
              {option.label}
            </option>
          {/each}
        </Select>
      </label>
    {/each}
  </div>

  <div class="flex items-center gap-2">
    <Button
      type="submit"
      size="sm"
      disabled={!answeredAny || saving !== null}
      loading={saving === 'answers'}
    >
      Send answers
    </Button>
    <Button
      variant="ghost"
      size="sm"
      disabled={saving !== null}
      loading={saving === 'skip'}
      onclick={() => save('skip', {})}
    >
      Skip
    </Button>
  </div>

  {#if failed}
    <p class="text-sm text-error" role="alert">
      We could not save your answers. Try again.
    </p>
  {/if}
</form>
