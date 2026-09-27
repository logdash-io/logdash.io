<script lang="ts">
  import { saveOnboardingAnswers } from '$lib/domains/onboarding/application/save-onboarding';
  import { parseOnboardingAnswersDto } from '$lib/domains/onboarding/domain/onboarding-dtos';
  import { ONBOARDING_QUESTIONS } from '$lib/domains/onboarding/domain/onboarding-questions';
  import { Button, Select } from '@logdash/hyper-ui/presentational';

  type Props = {
    submitLabel?: string;
    oncomplete: () => void;
  };

  let { submitLabel = 'Take me to Logdash', oncomplete }: Props = $props();

  let answers = $state({ role: '', source: '' });
  let saving = $state(false);
  let failed = $state(false);

  const dto = $derived(parseOnboardingAnswersDto(answers));
  const answeredAll = $derived(Boolean(dto?.role && dto.source));

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    if (!dto) {
      return;
    }

    saving = true;
    failed = false;

    try {
      await saveOnboardingAnswers(dto);
    } catch {
      saving = false;
      failed = true;

      return;
    }

    oncomplete();
  }
</script>

<form class="flex flex-col" onsubmit={onSubmit}>
  <h2
    tabindex="-1"
    class="text-2xl font-semibold tracking-tight text-balance focus:outline-none"
  >
    Welcome to Logdash
  </h2>
  <p class="text-neutral-400 mt-1.5 text-sm text-pretty">
    Two quick questions so we can make Logdash work for you.
  </p>

  <div class="mt-6 flex flex-col gap-4">
    {#each ONBOARDING_QUESTIONS as question (question.key)}
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium">{question.label}</span>
        <Select
          bind:value={answers[question.key]}
          class={[
            'w-full border-neutral-700 bg-surface-elevated transition-ink hover:border-neutral-600 focus:border-brand',
            {
              'text-neutral-500': !answers[question.key],
            },
          ]}
        >
          <option value="" class="text-neutral-500">Choose one</option>
          {#each question.options as option (option.value)}
            <option value={option.value} class="text-fg-default">
              {option.label}
            </option>
          {/each}
        </Select>
      </label>
    {/each}
  </div>

  <Button
    type="submit"
    variant={answeredAll ? 'primary' : 'subtle'}
    block
    class="mt-7"
    disabled={!dto}
    loading={saving}
  >
    {submitLabel}
  </Button>

  {#if failed}
    <p class="text-error mt-3 text-sm" role="alert">
      We could not save your answers. Try again.
    </p>
  {/if}
</form>
