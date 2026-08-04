<script lang="ts">
  import { EV_STATS, evTotal, type EvSpread } from "$lib/storage";

  let {
    evs,
    oninput,
    onIvInput,
    onIvChange = () => {},
    iv,
    stats = EV_STATS,
    label = "EVs",
    warning = "",
    cols = "grid-cols-6",
  }: {
    evs: EvSpread;
    oninput: (key: keyof EvSpread, value: number) => void;
    onIvInput?: (value: number) => void;
    onIvChange?: () => void;
    iv?: number;
    stats?: { key: keyof EvSpread; label: string }[];
    label?: string;
    warning?: string;
    cols?: string;
  } = $props();

  function clampIv(raw: string, fallback: number): number {
    const v = parseInt(raw, 10);
    if (Number.isNaN(v)) return fallback;
    return Math.min(31, Math.max(0, v));
  }
</script>

<div class="rounded-xl border border-white/6 bg-white/2 p-2.5">
  <div class="mb-1.5 flex items-center justify-between gap-2">
    <span class="text-[10px] font-bold tracking-wider text-white/40 uppercase"
      >{label} {evTotal(evs)}/510</span
    >
    {#if iv != null}
      <span class="flex items-center gap-1 text-[10px] text-white/40">
        IV
        <input
          type="number"
          min="0"
          max="31"
          value={iv}
          oninput={(e) =>
            onIvInput?.(clampIv((e.target as HTMLInputElement).value, iv))}
          onchange={onIvChange}
          class="w-12 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-right text-[10px] outline-none"
        />
      </span>
    {/if}
    {#if warning}
      <span class="text-pokemon-red text-[10px]">{warning}</span>
    {/if}
  </div>
  <div class="grid gap-1.5 {cols}">
    {#each stats as stat}
      <label class="flex flex-col items-center gap-0.5">
        <span class="text-[9px] font-bold text-white/40">{stat.label}</span>
        <input
          type="number"
          min="0"
          max="252"
          value={evs[stat.key] || 0}
          oninput={(e) =>
            oninput(
              stat.key,
              parseInt((e.target as HTMLInputElement).value) || 0,
            )}
          class="w-full rounded-md border border-white/10 bg-white/5 px-1 py-1 text-center text-[10px] outline-none"
        />
      </label>
    {/each}
  </div>
</div>
