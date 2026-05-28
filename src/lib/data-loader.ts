import fs from "node:fs";
import path from "node:path";

import type { SeedData } from "@/lib/types";

function readJsonFile<T>(filename: string): T {
  const filePath = path.join(process.cwd(), "src", "data", filename);
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export function loadSeedDataFromDisk(): SeedData {
  return {
    posts: readJsonFile("posts.json"),
    post_sets: readJsonFile("post_sets.json"),
    labels: readJsonFile("labels.json"),
    judge_results: readJsonFile("judge_results.json")
  };
}
