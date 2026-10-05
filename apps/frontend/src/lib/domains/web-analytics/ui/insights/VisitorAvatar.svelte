<script lang="ts">
  import { visitorHue, visitorName } from '../../domain/analytics-format';

  type Props = { id: string; size?: 'md' | 'lg' };

  const { id, size = 'md' }: Props = $props();

  const hue = $derived(visitorHue(id));
  const initials = $derived(
    visitorName(id)
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase(),
  );
</script>

<span
  class={[
    'flex shrink-0 items-center justify-center rounded-full font-semibold text-fg-inverse',
    size === 'lg' ? 'size-12 text-sm' : 'size-9 text-[11px]',
  ]}
  style:background-image="linear-gradient(135deg, hsl({hue} 70% 72%), hsl({(hue +
    60) %
    360} 65% 58%))"
  aria-hidden="true"
>
  {initials}
</span>
