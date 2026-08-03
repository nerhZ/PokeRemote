<script lang="ts">
  let {
    label,
    active,
    onclick,
    color,
    count,
    variant = "accent",
    disabled = false,
  }: {
    label: string;
    active: boolean;
    onclick: () => void;
    color?: string;
    count?: number;
    variant?: "accent" | "color" | "inverted";
    disabled?: boolean;
  } = $props();

  let klass = $derived.by(() => {
    if (disabled)
      return "border-white/5 bg-white/2 text-white/25 cursor-not-allowed";
    if (!active) return "border-white/10 bg-white/5 text-white/55";
    if (variant === "inverted") return "text-bg-navy border-white bg-white";
    if (variant === "color") return "border-transparent text-white";
    return "bg-accent border-accent text-white";
  });
</script>

<button
  type="button"
  {onclick}
  aria-pressed={active}
  disabled={disabled && !active}
  class="cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase {klass}"
  style={active && variant === "color" && color
    ? `background-color: ${color}`
    : ""}
  >{label}{#if count != null && count > 0}<span
      class="bg-accent ml-1 rounded-full px-1.5 py-0.5 text-[8px] text-white"
      >{count}</span
    >{/if}</button
>
