<script lang="ts">
  let {
    class: klass = "h-24 w-24",
    spinning = false,
  }: { class?: string; spinning?: boolean } = $props();
</script>

<div class="relative {klass} {spinning ? 'animate-spin' : ''}">
  <div
    class="from-pokemon-red absolute inset-0 rounded-full border-4 border-slate-700 bg-linear-to-b from-50% to-white to-50% opacity-80"
  ></div>
  <div
    class="absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 bg-slate-800"
  ></div>
  <div
    class="absolute top-1/2 left-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-slate-800 bg-white"
  ></div>
</div>
