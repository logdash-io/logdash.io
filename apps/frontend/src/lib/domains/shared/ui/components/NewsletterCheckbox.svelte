<script lang="ts">
  let { emailAccepted = $bindable() } = $props();
</script>

<div
  class="tooltip tooltip-primary flex items-center"
  data-tip="Bi-weekly email updates on new features and improvements"
>
  <label class="label cursor-pointer space-x-1">
    <input
      type="checkbox"
      class="checkbox checkbox-primary checkbox-sm"
      bind:checked={emailAccepted}
    />
    <span class="label-text">Subscribe to changelog</span>
  </label>
</div>
