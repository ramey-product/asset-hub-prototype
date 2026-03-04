import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { OrgProvider } from "@/components/layout/org-provider";

export const metadata: Metadata = {
  title: "WORKS Asset Hub | Facilitron",
  description: "Inventory & Asset Management Hub for Facilitron WORKS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash: default to light, JS will apply dark if stored */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('works-theme');
                if (t === 'dark') document.documentElement.classList.add('dark');
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <OrgProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="ml-[260px] flex-1 transition-all duration-300">
                {children}
              </main>
            </div>
          </OrgProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
