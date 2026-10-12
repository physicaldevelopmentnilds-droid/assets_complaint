import ComplaintForm from "./complaint-form";
import Brand from "../../brand";
export default function NewComplaintPage() {
  return <main className="public-page"><header className="public-header"><Brand /><span className="national-assembly">National Assembly</span></header><div className="public-form"><div className="form-intro"><p className="eyebrow">Facilities support</p><h1>Assets Complaint Form</h1><p>Report an issue with a building, room or asset. Office number and picture are optional. Complete the other fields. Keep the reference shown after submission.</p></div><ComplaintForm /></div><footer className="public-footer">NILDS · Physical Development Division</footer></main>;
}
