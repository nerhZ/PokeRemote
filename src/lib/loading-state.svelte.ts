/** Shared flag for slow in-page data loads that should surface the top loading bar. */
class PageLoading {
  active = $state(false);
}

export const pageLoading = new PageLoading();
