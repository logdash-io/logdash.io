<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLDivElement> & {
    value?: number;
    max?: number;
    name?: string;
  };

  let {
    value = $bindable(0),
    max = 5,
    name,
    class: className,
    ...rest
  }: Props = $props();

  const id = $props.id();
  const stars = $derived(Array.from({ length: max }, (_, index) => index + 1));
</script>

<div {...rest} role="radiogroup" class={["ld-rating", className]}>
  {#each stars as star (star)}
    <input
      type="radio"
      class="ld-rating-star"
      name={name ?? id}
      value={star}
      aria-label="{star} star"
      bind:group={value}
    />
  {/each}
</div>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-rating {
      position: relative;
      display: inline-flex;
      vertical-align: middle;
    }

    .ld-rating-star {
      width: 1.25rem;
      height: 1.25rem;
      border: none;
      border-radius: 0;
      background-color: var(--surface-150);
      cursor: pointer;
      appearance: none;
      mask: url("data:image/svg+xml,%3csvg width='192' height='180' xmlns='http://www.w3.org/2000/svg'%3e%3cpath fill='black' d='m96 153.044-58.779 26.243 7.02-63.513L.894 68.481l63.117-13.01L96 0l31.989 55.472 63.117 13.01-43.347 47.292 7.02 63.513z' fill-rule='evenodd'/%3e%3c/svg%3e")
        center / contain no-repeat;
    }

    .ld-rating-star:checked,
    .ld-rating-star:has(~ .ld-rating-star:checked) {
      background-color: var(--brand);
    }

    .ld-rating-star:focus-visible {
      outline: none;
      scale: 1.1;
    }

    .ld-rating-star:active:focus {
      animation: none;
      scale: 1.1;
    }

    @media (prefers-reduced-motion: no-preference) {
      .ld-rating-star {
        animation: rating 0.25s ease-out;
      }

      .ld-rating-star:focus-visible {
        transition: scale 0.2s ease-out;
      }
    }

    @keyframes rating {
      0%,
      40% {
        filter: brightness(1.05) contrast(1.05);
        scale: 1.1;
      }
    }
  }
</style>
