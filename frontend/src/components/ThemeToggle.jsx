import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import Button from "./ui/Button.jsx";

function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.body.classList.toggle("dark", dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content",dark ? "#0f172a" : "#fff7ed");
  }, [dark]);

  function toggleTheme() {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");
    setDark(isDark);

    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  return (
    <Button variant="ghost" onClick={toggleTheme} className="px-2 sm:px-3" aria-label={dark ? "Claro" : "Escuro"}>
      {dark ? <Sun size={18} aria-hidden="true"/> : <Moon size={18} aria-hidden="true"/>}
      <span className="hidden sm:inline">{dark ? "Claro" : "Escuro"}</span>
    </Button>
  );
}

export default ThemeToggle;
