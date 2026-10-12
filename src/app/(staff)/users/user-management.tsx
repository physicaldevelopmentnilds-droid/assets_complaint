"use client";
import { useState, type FormEvent } from "react";
type User = { id: string; email: string; name: string; role: string; cashbookAccess: boolean };
export default function UserManagement({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState("");
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const form = event.currentTarget;
    const values = new FormData(form);
    const response = await fetch("/api/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: values.get("name"), email: values.get("email"), password: values.get("password") }) });
    if (!response.ok) { setMessage((await response.json()).error || "Could not create officer"); return; }
    const created = await response.json();
    setUsers([{ id: created.id, name: String(values.get("name")), email: String(values.get("email")), role: "officer", cashbookAccess: false }, ...users]);
    form.reset(); setMessage("Officer created.");
  }
  async function promote(id: string) {
    setMessage("");
    const response = await fetch(`/api/users/${id}/promote`, { method: "POST" });
    if (!response.ok) { setMessage((await response.json()).error || "Could not promote officer"); return; }
    setUsers(users.map((user) => user.id === id ? { ...user, role: "admin" } : user)); setMessage("Officer promoted.");
  }
  async function changeOfficer(user: User, remove = false) {
    if (remove && !window.confirm(`Remove ${user.name}? Their account access will end; their records will remain.`)) return;
    setMessage("");
    try {
      const response = await fetch(`/api/users/${user.id}`, { method: remove ? "DELETE" : "PATCH", headers: { "content-type": "application/json" }, ...(remove ? {} : { body: JSON.stringify({ cashbookAccess: !user.cashbookAccess }) }) });
      if (!response.ok) { setMessage((await response.json()).error || "Could not update officer"); return; }
      setUsers((current) => remove ? current.filter((item) => item.id !== user.id) : current.map((item) => item.id === user.id ? { ...item, cashbookAccess: !item.cashbookAccess } : item));
      setMessage(remove ? "Officer removed; access revoked." : "Cashbook permission updated.");
    } catch { setMessage("Connection failed. No update was confirmed."); }
  }
  return <><section><h2>Create officer</h2><form onSubmit={create} className="stack"><label>Name<input name="name" required maxLength={120} /></label><label>Email<input name="email" type="email" required /></label><label>Initial password<input name="password" type="password" required minLength={12} autoComplete="new-password" /></label><button className="button">Create officer</button></form></section>{message && <p role="status">{message}</p>}<section><h2>Staff accounts</h2><div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Cashbook access</th><th>Actions</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td>{user.role === "admin" ? "Full access" : user.cashbookAccess ? "Approved" : "Not approved"}</td><td>{user.role === "officer" && <div className="action-row"><button onClick={() => changeOfficer(user)}>{user.cashbookAccess ? "Revoke cashbook" : "Approve cashbook"}</button><button onClick={() => promote(user.id)}>Promote to admin</button><button onClick={() => changeOfficer(user, true)}>Remove officer</button></div>}</td></tr>)}</tbody></table></div></section></>;
}
