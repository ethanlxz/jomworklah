import { notFound } from "next/navigation";
import { getCandidate, sharedCandidates } from "../../data";
import CandidateProfile from "../../candidate-profile";

export function generateStaticParams() {
  return sharedCandidates.map(candidate => ({ id: candidate.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const candidate = getCandidate(id);
  if (!candidate) return { title: "Candidate not found | JomWorkLah" };
  return {
    title: `${candidate.name} | JomWorkLah employer demo`,
    description: `${candidate.headline} in ${candidate.location}. Skill evidence, gaps and roadmap progress for Malaysian entry-level roles.`
  };
}

export default async function CandidatePage({ params }) {
  const { id } = await params;
  if (!getCandidate(id)) notFound();

  return <CandidateProfile id={id} />;
}
