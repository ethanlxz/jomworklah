import LegacyScripts from "./legacy-scripts";

/* Markup mirror of the static index.html body. app.js fills #header, #sidebar,
   #footer and #main on boot, so the skeleton must stay identical. */
export default function Page() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header id="header" className="site-header"></header>
      <div id="shell" className="shell">
        <aside id="sidebar" className="sidebar" aria-label="Workspace"></aside>
        <main id="main" tabIndex={-1}></main>
      </div>
      <footer id="footer" className="site-footer"></footer>
      <dialog id="modal" aria-labelledby="modal-title"></dialog>
      <div id="toast" className="toast" role="status" aria-live="polite"></div>
      <noscript>Enable JavaScript to explore the JomWorkLah demo.</noscript>
      <LegacyScripts />
    </>
  );
}
