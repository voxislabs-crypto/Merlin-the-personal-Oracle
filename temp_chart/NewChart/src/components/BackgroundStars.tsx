import React from "react";

export const BackgroundStars: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(240,65%,8%)] via-[hsl(235,55%,15%)] to-[hsl(240,65%,8%)]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(2px 2px at 20% 30%, white, transparent),
            radial-gradient(2px 2px at 60% 70%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(1px 1px at 80% 10%, white, transparent),
            radial-gradient(2px 2px at 90% 60%, white, transparent),
            radial-gradient(1px 1px at 33% 80%, white, transparent),
            radial-gradient(1px 1px at 15% 60%, white, transparent)
          `,
          backgroundSize: "200% 200%",
          backgroundPosition: "50% 50%",
          opacity: 0.4,
        }}
      />
    </div>
  );
};
