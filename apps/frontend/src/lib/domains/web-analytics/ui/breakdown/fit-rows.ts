import type { Attachment } from 'svelte/attachments';

export type RowFit = { shown: number; hidden: number; more: boolean };

export const MORE_ROW = 36;

export function fitRows(
  onfit: (fit: RowFit) => void,
  total?: number | null,
): Attachment<HTMLElement> {
  return (box) => {
    let last = '';
    const measure = (): void => {
      const rows = [...box.querySelectorAll<HTMLElement>('[data-row]')];
      for (const row of rows) row.hidden = false;
      box.scrollTop = 0;
      const forced =
        total === null || (total !== undefined && total > items(rows));
      const count = visibleRows(
        rows.map((row) => rowBottom(row, box)),
        box.clientHeight,
        MORE_ROW,
        forced,
      );
      const shown = rows.slice(0, count);
      while (shown.at(-1)?.dataset.row === 'head') shown.pop();
      rows.forEach((row, index) => (row.hidden = index >= shown.length));
      const hidden = items(rows) - items(shown);
      const fit = { shown: items(shown), hidden, more: forced || hidden > 0 };
      const key = `${fit.shown}:${fit.hidden}:${fit.more}`;
      if (key === last) return;
      last = key;
      onfit(fit);
    };
    const resize = new ResizeObserver(measure);
    const mutation = new MutationObserver(measure);
    resize.observe(box);
    mutation.observe(box, { childList: true, subtree: true });
    measure();
    return () => {
      resize.disconnect();
      mutation.disconnect();
    };
  };
}

export function visibleRows(
  bottoms: number[],
  limit: number,
  reserve: number,
  forced: boolean,
): number {
  if (!forced && (bottoms.at(-1) ?? 0) <= limit) return bottoms.length;
  const over = bottoms.findIndex((bottom) => bottom > limit - reserve);
  return over < 0 ? bottoms.length : over;
}

function items(rows: HTMLElement[]): number {
  return rows.filter((row) => row.dataset.row !== 'head').length;
}

function rowBottom(row: HTMLElement, box: HTMLElement): number {
  let top = 0;
  let node: Element | null = row;
  while (node instanceof HTMLElement && node !== box) {
    top += node.offsetTop;
    node = node.offsetParent;
  }
  if (node === box) return top + row.offsetHeight;
  return row.getBoundingClientRect().bottom - box.getBoundingClientRect().top;
}
