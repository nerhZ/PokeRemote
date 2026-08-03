<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import EmptyState from "$lib/components/EmptyState.svelte";
</script>

<div class="flex min-h-[calc(100vh-73px)] items-center justify-center">
  <EmptyState
    title={page.status === 404 ? "Page not found" : "Something went wrong"}
    subtitle={page.status === 404
      ? "The page you're looking for doesn't exist or has been moved."
      : (page.error?.message ?? "An unexpected error occurred.")}
    actionLabel="Back to Pokédex"
    onaction={() => goto(resolve("/"))}
  />
</div>
