import type { Metadata, Viewport } from "next";
import { Poppins, Petit_Formal_Script } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const petitFormal = Petit_Formal_Script({
  variable: "--font-petit-formal",
  weight: ["400"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Athel | Where precision meets execution.",
  description: "Where precision meets execution.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${petitFormal.variable} antialiased dark no-scrollbar`}
      suppressHydrationWarning
    >
      <body className="h-screen flex flex-col overflow-hidden no-scrollbar">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('wheel', function(e) {
                if (e.ctrlKey) {
                  e.preventDefault();
                }
              }, { passive: false });
              document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && (e.key === '=' || e.key === '-' || e.key === '+')) {
                  e.preventDefault();
                }
              });
            `,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
