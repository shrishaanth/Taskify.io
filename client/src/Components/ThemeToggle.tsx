import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../Context/ThemeContext";
import { Moon, Sun } from "lucide-react";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Dark Mode"
      data-no-transition
      style={{ transition: "none" }}
      className="relative flex h-8 w-14 items-center rounded-full bg-gray-200 dark:bg-gray-700 p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {/* Sliding pill */}
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className={`absolute h-6 w-6 rounded-full shadow-md ${
          isDark ? "bg-gray-900 left-[calc(100%-28px)]" : "bg-white left-1"
        }`}
      />

      {/* Icons */}
      <span className="relative z-10 flex w-full items-center justify-between px-0.5">
        {/* Sun icon — left side */}
        <AnimatePresence mode="wait">
          {!isDark && (
            <motion.span
              key="sun"
              initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={13} className="text-yellow-500" />
            </motion.span>
          )}
        </AnimatePresence>

        <span className="flex-1" />

        {/* Moon icon — right side */}
        <AnimatePresence mode="wait">
          {isDark && (
            <motion.span
              key="moon"
              initial={{ opacity: 0, scale: 0.5, rotate: 90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={13} className="text-blue-300" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
};

export default ThemeToggle;
