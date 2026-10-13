import Link from "next/link";
import Brand from "./brand";

export default function Home() {
  return <main className="home-page">
    <header className="home-header"><Brand /><span className="national-assembly">National Assembly</span></header>
    <section className="home-content">
      <p className="eyebrow">Physical Development Division</p>
      <h1>Division operations</h1>
      <p className="home-subtitle">Choose a service to continue.</p>
      <div className="entry-grid">
        <Link className="entry-card entry-card-public" href="/complaints/new"><span className="entry-number">PUBLIC SERVICE</span><h2>Asset Complaint Form</h2><p>Report a building or asset issue to the Physical Development Division.</p><span className="entry-action">Open complaint form <span aria-hidden="true">→</span></span></Link>
        <Link className="entry-card entry-card-staff" href="/login"><span className="entry-number">STAFF WORKSPACE</span><h2>Staff sign in</h2><p>For Physical Development Division staff only. Sign in to access the division workspace.</p><span className="entry-action">Continue to sign in <span aria-hidden="true">→</span></span></Link>
      </div>
    </section>
    <footer className="home-footer">National Institute for Legislative and Democratic Studies</footer>
  </main>;
}
