import type { Metadata, Viewport } from "next";
import "./globals.css";
import { FarmProvider } from "@/lib/store";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "TriBloom Farms · Farm Dashboard",
  description: "Polyhouse, harvest, packing, dispatch and sales tracking for TriBloom Farms.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1f3a2b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className="h-full">
      <body className="antialiased h-full w-full overflow-hidden">
        <FarmProvider>
          <AppShell>{children}</AppShell>
        </FarmProvider>
      </body>
    </html>
  );
}
