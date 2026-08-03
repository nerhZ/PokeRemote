/** Fade out and remove the initial full-screen app loader. */
export function dismissAppLoader() {
  const loader = document.getElementById("app-loader");
  if (loader) {
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 350);
  }
}
