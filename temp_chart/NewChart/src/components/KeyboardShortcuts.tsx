import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const KeyboardShortcuts: React.FC = () => {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        setShowShortcuts((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowShortcuts(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const shortcuts = [
    { key: "?", description: "Show/hide keyboard shortcuts" },
    { key: "ESC", description: "Close panels" },
    { key: "Space", description: "Toggle rotation animation" },
    { key: "1-9", description: "Jump to planet" },
    { key: "H", description: "Toggle house numbers" },
  ];

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowShortcuts(!showShortcuts)}
        className="fixed bottom-6 right-6 bg-cosmic-gold/20 backdrop-blur-sm border border-cosmic-gold/50 rounded-full p-3 hover:bg-cosmic-gold/30 transition-colors z-50"
        title="Keyboard Shortcuts (?)"
      >
        <svg
          className="w-5 h-5 text-cosmic-gold"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      </motion.button>

      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-card border-2 border-cosmic-gold/50 rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="font-display font-bold text-2xl text-cosmic-gold mb-4">
                Keyboard Shortcuts
              </h3>
              <div className="space-y-3">
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between p-3 rounded-lg bg-cosmic-gold/5 hover:bg-cosmic-gold/10 transition-colors"
                  >
                    <span className="text-gray-300">
                      {shortcut.description}
                    </span>
                    <kbd className="px-3 py-1 bg-cosmic-gold/20 border border-cosmic-gold/50 rounded text-cosmic-gold font-mono text-sm">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="mt-6 w-full bg-gradient-cta text-primary font-display font-semibold py-2 rounded-lg hover:shadow-lg transition-all"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
