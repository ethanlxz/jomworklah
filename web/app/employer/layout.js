import { EmployerFooter, EmployerHeader } from "./employer-header";

export const metadata = {
  title: "Employer demo | JomWorkLah",
  description: "Explore illustrative candidate profiles, skill evidence and role readiness for Malaysian entry-level roles."
};

export default function EmployerLayout({ children }) {
  return (
    <>
      {/* Rendered after the root layout's stylesheets so .emp-* overrides land in order. */}
      <link rel="stylesheet" href="/employer.css" />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <EmployerHeader />
      <main id="main" tabIndex={-1} className="emp-main">
        {children}
      </main>
      <EmployerFooter />
    </>
  );
}
