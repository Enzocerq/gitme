import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("gh-theme") as Theme | null) ?? "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("gh-theme", theme);
  }, [theme]);

  function toggle() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return { theme, toggle, isDark: theme === "dark" };
}
