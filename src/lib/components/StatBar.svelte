<script lang="ts">
  let {
    label,
    value,
    color = "#777",
    max = 255,
    size = "md",
  }: {
    label: string;
    value: number;
    color?: string;
    max?: number;
    size?: "sm" | "md";
  } = $props();

  const classes = $derived.by(() => {
    if (size === "sm") {
      return {
        row: "flex items-center gap-2",
        label: "w-12 text-right text-[10px] font-bold text-white/45",
        value: "w-7 text-xs font-black",
        bar: "h-1.5",
        solid: true,
      };
    }
    return {
      row: "flex items-center gap-3",
      label: "w-14 text-right text-[11px] font-bold text-white/50",
      value: "w-8 text-right text-sm font-black",
      bar: "h-2",
      solid: false,
    };
  });
</script>

<div class={classes.row}>
  <span class={classes.label}>{label}</span>
  <span class={classes.value} style="color: {color}">{value}</span>
  <div class="flex-1 overflow-hidden rounded-full bg-white/6 {classes.bar}">
    <div
      class="h-full rounded-full"
      style="width: {(value / max) * 100}%; background: {classes.solid
        ? color
        : `linear-gradient(90deg, ${color}, ${color}80)`}"
    ></div>
  </div>
</div>
