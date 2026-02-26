export function applyTheme(themeVars = {}) {
  try {
    const root = document.documentElement;
    Object.entries(themeVars).forEach(([k, v]) => {
      if (typeof k === "string" && k.startsWith("--") && typeof v === "string") {
        root.style.setProperty(k, v);
      }
    });
  } catch (e) {
    console.warn("[Site] applyTheme failed:", e);
  }
}
