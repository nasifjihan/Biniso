import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

// export const metadata = {
//   title: "Biniso",
//   description: "Best products online",
// };

export const metadata = {
  title: "Biniso",
  description: "Best products online",
  keywords: ["ecommerce", "shop", "products", "Bangladesh"],
  authors: [{ name: "Nasif Zeehan" }],
  openGraph: {
    title: "Biniso - Premium Products Online",
    description:
      "Discover our top-quality products, carefully selected for you.",
    url: "https://biniso.com",
    siteName: "Biniso",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Biniso Banner",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Biniso - Premium Products Online",
    description:
      "Discover our top-quality products, carefully selected for you.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
