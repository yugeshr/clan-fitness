import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

const satoshi = localFont({
  variable: "--font-satoshi",
  src: [
    { path: "./fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Satoshi-Black.woff2", weight: "900", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Clan Fitness",
  description: "Track gym, steps, and food with your accountability group.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
        variables: {
          colorPrimary: "#3bffad",
          colorBackground: "#121212",
          colorDanger: "#ee4d37",
          borderRadius: "0.5rem",
        },
      }}
    >
      <html
        lang="en"
        className={`${satoshi.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}
