export const MENU_PANEL =
  'bg-surface-elevated-bg border-surface-elevated-border border mt-2 flex flex-col rounded-xl p-1.5 shadow-lg';

export const MENU_ROW =
  'hover:bg-surface-elevated-hover-bg focus-visible:bg-surface-elevated-hover-bg flex h-8 w-full min-w-0 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-left text-sm outline-none';

export function onMenuArrowKeys(
  event: KeyboardEvent & { currentTarget: HTMLElement },
): void {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
    return;
  }

  const items = [
    ...event.currentTarget.querySelectorAll<HTMLElement>(
      'input, a[href], button',
    ),
  ];
  const index = items.findIndex((item) => item === document.activeElement);
  const step = event.key === 'ArrowDown' ? 1 : -1;

  event.preventDefault();
  items.at((index + step) % items.length)?.focus();
}
