import Link from "next/link";

export function EmployerHeader() {
  return (
    <header className="site-header emp-header">
      <div className="header-inner content-width flex items-center justify-between">
        <Link className="brand" href="/candidate" aria-label="JomWorkLah, back to the candidate site">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/jomworklah-logo.svg" alt="JomWorkLah" width="187" height="42" />
        </Link>
        <nav className="emp-nav" aria-label="Employer site">
          <span className="demo-tag">
            <span className="orange-dot" />
            Employer demo
          </span>
          <Link className="emp-nav-link" href="/candidate">
            Candidate site
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function EmployerFooter() {
  return (
    <footer className="site-footer">
      <div className="content-width footer-inner flex items-center justify-between">
        <Link className="brand footer-brand" href="/candidate">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/jomworklah-logo.svg" alt="JomWorkLah" width="137" height="31" />
        </Link>
        <span>
          Employer demo <span aria-hidden="true">·</span> Illustrative candidate data
        </span>
      </div>
    </footer>
  );
}
