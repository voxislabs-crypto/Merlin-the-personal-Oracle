export const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

export const describeArc = (
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
};

export const getAspectColor = (aspectType: string): string => {
  const colors: Record<string, string> = {
    conjunction: "hsl(45, 88%, 68%)",
    opposition: "hsl(320, 80%, 65%)",
    trine: "hsl(185, 70%, 65%)",
    square: "hsl(0, 62%, 50%)",
    sextile: "hsl(45, 88%, 68%)",
  };
  return colors[aspectType] || "hsl(45, 88%, 68%)";
};
