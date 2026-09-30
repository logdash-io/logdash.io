<script lang="ts">
  import { onMount } from 'svelte';
  import { wizardState } from '$lib/domains/app/clusters/application/wizard.state.svelte.js';
  import {
    SETTINGS_INPUT_CLASS,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card';
  import { Input } from '@logdash/hyper-ui/presentational';
  import ColorPalette from '../ColorPalette.svelte';

  const project = $derived(wizardState.project);

  onMount(() => {
    document.getElementById('project-name')?.focus();
  });

  function onNameChange(e: Event): void {
    wizardState.setProjectName((e.target as HTMLInputElement).value);
  }

  function onColorSelect(color: string): void {
    wizardState.setProjectColor(color);
  }
</script>

<SettingsCardItem>
  <label class="flex min-w-0 items-center gap-3">
    <span class="text-neutral-500 w-16 shrink-0">Name</span>
    <Input
      id="project-name"
      size="sm"
      class={['-my-1.5 w-full max-w-64', SETTINGS_INPUT_CLASS]}
      placeholder="acme.com"
      value={project.name}
      oninput={onNameChange}
      minlength={3}
      maxlength={64}
    />
  </label>
</SettingsCardItem>

<SettingsCardItem>
  <div class="flex min-w-0 items-center gap-3">
    <span class="text-neutral-500 w-16 shrink-0">Color</span>
    <ColorPalette selectedColor={project.color} onSelect={onColorSelect} />
  </div>
</SettingsCardItem>
