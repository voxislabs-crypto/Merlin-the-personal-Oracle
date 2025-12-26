import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merlin - Your Personal Oracle",
  description: "Where ancient celestial wisdom meets cybernetic divination",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
