import { redirect } from "next/navigation";
import { currentStaff } from "@/lib/auth";
import { canAccessCashbook } from "@/lib/permissions";
import Brand from "../brand";
import LogoutButton from "./logout-button";
import StaffNav from "./staff-nav";
export const runtime = "nodejs";
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const staff = await currentStaff();
  if (!staff) redirect("/login");
  return <div className="staff-shell">
    <aside className="sidebar">
      <Brand compact />
      <div className="sidebar-divider" />
      <p className="nav-caption">Division workspace</p>
      <StaffNav admin={staff.role === "admin"} cashbook={canAccessCashbook(staff)} />
      <div className="account"><span className="account-avatar" aria-hidden="true">{staff.name.charAt(0).toUpperCase()}</span><div className="account-details"><strong>{staff.name}</strong><small>{staff.role}</small></div><LogoutButton /></div>
    </aside>
    <div className="workspace">
      <header className="workspace-header"><span><span className="national-assembly">National Assembly</span> <span aria-hidden="true">/</span> Physical Development Division</span><span className="workspace-header-tag">Internal workspace</span></header>
      <div className="staff-content">{children}</div>
    </div>
  </div>;
}
