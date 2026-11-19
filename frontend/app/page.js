/* The prototype started at "/" before the two sites were split into
   /candidate and /employer, so the root URL keeps working.

   The site is built as a static export, where redirect() has no server to
   answer it and only bakes an error shell that redirects once JavaScript
   loads. A meta refresh is prerendered into the HTML instead, so "/" lands on
   the candidate site even before the bundle runs. */
export default function Page() {
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=/candidate" />
      <main className="redirect-page">
        <p>
          Opening the <a href="/candidate">JomWorkLah candidate site</a>…
        </p>
      </main>
    </>
  );
}
