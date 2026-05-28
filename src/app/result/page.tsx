import { ResultClient } from "@/components/result-client";

export const runtime = "nodejs";

export default function ResultPage() {
  return (
    <main className="page-shell">
      <ResultClient />
    </main>
  );
}
