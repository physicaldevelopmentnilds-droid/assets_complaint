import Image from "next/image";

export default function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand-lockup${compact ? " brand-lockup-compact" : ""}`}>
    <span className="brand-mark"><Image src="/nilds-logo.jpeg" alt="NILDS National Assembly emblem" width={72} height={74} priority /></span>
    <span className="brand-words"><strong>NILDS</strong><span>Physical Development Division</span></span>
  </div>;
}
