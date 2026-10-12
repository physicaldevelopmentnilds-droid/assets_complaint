import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NILDS Physical Development Division",
  description: "Division operations",
  icons: { icon: "/nilds-logo.jpeg" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false, noimageindex: true } },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
