import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Suspense } from "react";
import { Providers } from "./providers";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Expense Tracker", template: "%s · Expense Tracker" },
  description: "A clearer picture of your everyday money.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} min-h-dvh antialiased`}>
        <Providers>
          <Suspense
            fallback={
              <div className="p-8" role="status">
                Loading…
              </div>
            }
          >
            {children}
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
