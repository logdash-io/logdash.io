<script lang="ts">
  import { ArrowRightIcon } from 'lucide-svelte';
  import { prefersReducedMotion } from 'svelte/motion';
  import { slide } from 'svelte/transition';
  import { FAQ_QUESTION_MAX_LENGTH } from './data/faq.data';
  import { FaqAskState } from './faq-ask.state.svelte';
  import FaqItem from './FaqItem.svelte';

  const ENTRY_REVEAL_MS = 250;

  const faqAsk = new FaqAskState();

  let question = $state('');

  const canSend = $derived(question.trim().length > 0 && !faqAsk.isAsking);
  const revealMs = $derived(prefersReducedMotion.current ? 0 : ENTRY_REVEAL_MS);

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    if (!canSend) return;

    const asked = question.trim();

    question = '';
    await faqAsk.ask(asked);
  }
</script>

{#each faqAsk.entries as entry (entry.id)}
  <div in:slide={{ duration: revealMs }}>
    <FaqItem question={entry.question} open>
      <div aria-live="polite">
        {#if entry.status === 'asking'}
          <span class="faq-thinking">Thinking…</span>
        {:else if entry.status === 'answered'}
          <p class="whitespace-pre-line">{entry.answer}</p>
          <p class="text-neutral-600 mt-3 text-xs">Answered by AI</p>
        {:else}
          <p>
            {entry.failure}
            <a
              href="https://discord.gg/naftPW4Hxe"
              target="_blank"
              rel="noreferrer"
              class="link link-hover text-base-content"
            >
              ask us on Discord.
            </a>
          </p>
        {/if}
      </div>
    </FaqItem>
  </div>
{/each}

<form class="flex items-center gap-6" onsubmit={onSubmit}>
  <input
    class="selection:bg-neutral-700 placeholder:text-neutral-500 focus:placeholder:text-neutral-600 min-w-0 flex-1 bg-transparent py-5 text-base font-medium outline-none"
    type="text"
    name="question"
    autocomplete="off"
    enterkeyhint="send"
    maxlength={FAQ_QUESTION_MAX_LENGTH}
    placeholder="Ask AI anything else about Logdash"
    aria-label="Ask AI a question about Logdash"
    bind:value={question}
  />

  <button
    type="submit"
    class="text-neutral-600 enabled:text-base-content enabled:hover:bg-surface-root-hover transition-ink -mr-1 grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg outline-none focus-visible:shadow-(--focus-ring) disabled:cursor-default"
    aria-label="Send question"
    data-posthog-id="faq-ask-submit"
    disabled={!canSend}
  >
    <ArrowRightIcon class="size-4" />
  </button>
</form>

<style>
  .faq-thinking {
    background: linear-gradient(
        90deg,
        var(--color-neutral-600) 35%,
        var(--color-neutral-300) 50%,
        var(--color-neutral-600) 65%
      )
      0 0 / 300% 100%;
    background-clip: text;
    color: transparent;
    animation: faq-thinking 1.6s linear infinite;
  }

  @keyframes faq-thinking {
    from {
      background-position: 100% 0;
    }

    to {
      background-position: 0 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .faq-thinking {
      animation: none;
      color: var(--color-neutral-500);
      background: none;
    }
  }
</style>
