<script lang="ts">
  let { emailAccepted = $bindable() } = $props();
</script>

<label class="label cursor-pointer space-x-1">
  <input
    type="checkbox"
    class="checkbox checkbox-primary checkbox-sm"
    bind:checked={emailAccepted}
  />
  <span class="label-text">Keep me posted on new features (no spam)</span>
</label>
