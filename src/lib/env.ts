import path from "node:path";

import type { JudgeMode, SelectionMode } from "@/lib/types";

const judgeMode: JudgeMode =
  process.env.APP_JUDGE_MODE === "external" ? "external" : "precomputed";
const selectionMode: SelectionMode =
  process.env.APP_SELECTION_MODE === "radio" ? "radio" : "checkbox";

export const appEnv: {
  adminPin: string;
  judgeMode: JudgeMode;
  selectionMode: SelectionMode;
  dbPath: string;
} = {
  adminPin: process.env.APP_ADMIN_PIN ?? "2468",
  judgeMode,
  selectionMode,
  dbPath: process.env.APP_DB_PATH
    ? path.resolve(process.cwd(), process.env.APP_DB_PATH)
    : path.resolve(process.cwd(), "data", "exhibit.sqlite")
};
