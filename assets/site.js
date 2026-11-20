const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");
const sync = () => {
  const dark = root.dataset.theme === "dark";
  toggle.setAttribute("aria-label", dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.removeAttribute("media"); m.content = dark ? "#121C22" : "#FAF8F6"; });
};
toggle.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  sync();
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
  let chosen = null;
  try { chosen = localStorage.getItem("theme"); } catch {}
  if (chosen) return;
  root.dataset.theme = e.matches ? "dark" : "light";
  sync();
});
sync();
