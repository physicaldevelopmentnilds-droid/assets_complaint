"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/complaints", label: "Assets Complaints" },
  { href: "/memos", label: "Memo Tracking" },
  { href: "/cashbook", label: "Cashbook" },
  { href: "/reports", label: "Reports" },
  { href: "/audit", label: "Audit history" },
  { href: "/settings", label: "Settings" },
];

export default function StaffNav({ admin, cashbook }: { admin: boolean; cashbook: boolean }) {
  const pathname = usePathname();
  return <nav aria-label="Staff navigation" className="staff-nav">
    {links.filter(({ href }) => (href !== "/audit" || admin) && (href !== "/cashbook" || cashbook)).map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined}>{label}</Link>)}
    {admin && <Link href="/users" aria-current={pathname === "/users" ? "page" : undefined}>User management</Link>}
  </nav>;
}
