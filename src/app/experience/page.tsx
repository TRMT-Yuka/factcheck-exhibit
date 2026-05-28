import { ExperienceClient } from "@/components/experience-client";

export const runtime = "nodejs";

export default function ExperiencePage() {
  return (
    <main className="page-shell">
      <ExperienceClient />
    </main>
  );
}
