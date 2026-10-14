import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./interactive-hover.css";

/** Magic UI / Aayush Bharti interaction, adapted to navigation and the brand palette. */
export default function InteractiveHoverLink({to,children,className="",...props}) {
  return <Link {...props} to={to} className={`bc-interactive-link ${className}`}>
    <span className="bc-interactive-label"><span className="bc-interactive-dot" aria-hidden="true"/>{children}</span>
    <span className="bc-interactive-active" aria-hidden="true">{children}<ArrowRight size={18}/></span>
  </Link>;
}
