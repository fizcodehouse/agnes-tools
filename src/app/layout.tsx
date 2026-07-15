import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agnes Tools",
  description: "AI Image & Video Generation powered by Agnes AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}