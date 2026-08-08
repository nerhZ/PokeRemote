<script lang="ts">
  let {
    value = $bindable(""),
    placeholder = "Search...",
    class: klass = "",
  }: {
    value?: string;
    placeholder?: string;
    class?: string;
  } = $props();
</script>

<input
  type="search"
  bind:value
  {placeholder}
  aria-label={placeholder}
  class="focus:border-accent/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm placeholder-white/30 outline-none {klass}"
/>
