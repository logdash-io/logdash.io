type ShortcutOptions = {
  key: string;
  meta?: boolean;
};

export function clickShortcut(node: HTMLElement, options: ShortcutOptions) {
  function onKeydown(event: KeyboardEvent) {
    if (
      node.hasAttribute('disabled') &&
      node.getAttribute('disabled') !== 'false'
    ) {
      return;
    }

    if (event.key === options.key && (!options.meta || event.metaKey)) {
      event.preventDefault();
      node.click();
    }
  }

  $effect(() => {
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.removeEventListener('keydown', onKeydown);
    };
  });
}
