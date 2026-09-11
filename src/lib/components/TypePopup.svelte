<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
  import AttackingMatchups from "./AttackingMatchups.svelte";
  import { styles } from "./TypePopup.styles";

  let { type }: { type: string } = $props();
</script>

<div {...stylex.attrs(styles.title)}>
  {type}
</div>
<AttackingMatchups {type} />
