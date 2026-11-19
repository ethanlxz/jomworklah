# JomWorkLah

JomWorkLah is an interactive career guidance prototype for Malaysian graduates and SPM and TVET leavers. It takes a fictional profile through skills evidence, career matching, gap analysis, training options and a learning roadmap.

## Repository layout

- `frontend/` is the Next.js app with both demos: the job-seeker site at `/candidate` and the employer site at `/employer`. The root URL redirects to `/candidate`.
- `backend/` is the API the frontend is built against.

## Run the frontend

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000/candidate> for the job-seeker walkthrough and <http://localhost:3000/employer> for talent search. The app uses HTML, CSS, Tailwind's browser CDN and vanilla JavaScript, so core screens and interactions work offline with local styles and system font fallbacks. An internet connection loads the optional typography, Tailwind utilities, the 3D atlas view and official training sites.

## Three-minute walkthrough

1. Select **Try with Demo Profile → Aina Rahman**. Review her example IT experience and choose **Save & Continue**.
2. Open **Explore Careers**, inspect **Junior Data Analyst** and choose it as the target. The gap comparison will highlight SQL and Data Visualisation.
3. Open **Find Training for These Gaps**. Review an example pathway, follow its official platform link or add a pathway to the roadmap.
4. Open **My Roadmap**. Set weekly study time, generate the plan and complete one task. Check the updated count and open **Overview** to see the new completion percentage.
5. Switch to **Amir Hakim** and select **Automotive Technician** to see different skills, technical training pathways and supervised projects. Each persona has its own target and roadmap.
6. Open **Skills Atlas** in the sidebar to explore the map: switch between training supply, hiring demand and the gap, select a skill cluster, click a state and drill into its districts, or switch to the 3D view. The active persona’s location is outlined on the map.

To test personalisation, edit Aina’s SQL evidence from 1 to 3 in **My Profile** and save. Compare the role’s compatibility and gap, then regenerate the roadmap.

To demonstrate resume selection, use a sample PDF or DOCX up to 5 MB. **Generate Demo Skills Profile** uses a prewritten profile for the active persona. The app handles only the selected filename and size in memory.

## How the demo works

- Compatibility combines weighted coverage of role skills (85%) with interest overlap (15%). Both the evidence scores and role requirements are illustrative.
- Gap priority multiplies the missing evidence points by the illustrative role requirement’s weight. Training suggestions use overlapping gaps and use learning mode and location as tie-breakers.
- Programmes are fictional pathways. Official platform links are directory entry points. Check the provider for course availability, fees, eligibility and recognition.
- The roadmap uses fixed rules and role-specific projects. Completion tracks tasks. Edit evidence directly in **My Profile**.
- The **Skills Atlas** tab is embedded from the standalone Skills Atlas prototype. State and district boundaries are official DOSM/open data; supply, demand, gap, employer and institution figures are illustrative synthetic data. The 3D view loads Three.js from a CDN and needs an internet connection; the 2D map works offline.
- The browser can save demo preferences, targets and roadmap tasks using local storage. Edited profile text, evidence scores and selected file details are session-only. **Clear Saved Demo Progress** clears the stored journeys.

## Project files

- `frontend/app/candidate/page.js` renders the job-seeker skeleton (header, sidebar, main, dialogs) that `frontend/public/js/app.js` fills in on boot.
- `frontend/public/styles.css` holds the design and responsive layout; `frontend/public/skills-atlas.css` scopes the Skills Atlas map component.
- `frontend/public/js/mock-data.js` contains two fictional personas, eight career paths and ten example training pathways. `frontend/public/js/app.js` contains the interactions and scoring.
- `frontend/public/js/skills-atlas.js` and `frontend/public/js/skills-atlas-data.js` contain the map component, its state/district geometry data and its interactions.
- `frontend/app/employer/` is the employer site: `data.js` and `scoring.js` hold the illustrative candidate profiles and match scoring, `talent-search.js` the candidate grid, `candidate-profile.js` the profile view and `contact-dialog.js` the contact flow. `frontend/public/employer.css` styles both.
- `frontend/public/assets/jomworklah-logo.svg` contains the editable vector wordmark and route mark. `frontend/public/assets/jomworklah-mark.svg` is the standalone mark and favicon.
- `frontend/public/assets/career-terrain.jpg` is the hero artwork, made with the built-in ImageGen tool.

<details>
<summary>Hero artwork prompt</summary>

> Create an ultra-polished editorial hero artwork for a Malaysian early-career guidance website, landscape 3:2 composition. Photoreal fine-grained drone photograph, STRAIGHT DOWN top-down look into the densely forested tropical mountain ridges of Peninsular Malaysia with fine tiny canopy texture and dark green folds. Graphic outdoor atlas art direction, tightly cropped with no horizon or sky. The ridge should run diagonally from bottom-left through the middle towards upper-right and must be darker on left and bottom with brighter muted fern and sage at upper right. Desaturated olive, deep forest greens, warm sage, slight warm cinematic grading; crisp print-like detail with dappled shadows. Include delicate widely spaced semi-transparent cream topographic contour linework over the terrain like a field map, drawn with subtle uniform thin strokes, with the most legible contour loops on the right half. The map feels like a premium outdoors editorial photo print. Edge to edge. No words, labels, letters, typography, scale bars, pins, paths, brand, border, frame, snow, built structures, roads, or people. A bright orange path and endpoint labels will be overlaid separately in the web app.

</details>
