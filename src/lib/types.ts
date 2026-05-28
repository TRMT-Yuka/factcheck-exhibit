export type PriorityLabel = "High" | "Mid" | "Low" | string;
export type JudgeMode = "precomputed" | "external";
export type SelectionMode = "checkbox" | "radio";

export type PostRecord = {
  post_id: string;
  text: string;
  image_url?: string | null;
  platform?: string | null;
  timestamp_text?: string | null;
};

export type PostSetRecord = {
  set_id: string;
  title?: string | null;
  post_ids: string[];
};

export type LabelRecord = {
  post_id: string;
  priority_label: PriorityLabel;
  label_reason?: string | null;
};

export type JudgeResultRecord = {
  set_id: string;
  post_id: string;
  priority_score: number;
  priority_rank: number;
  rationale_short: string;
};

export type SeedData = {
  posts: PostRecord[];
  post_sets: PostSetRecord[];
  labels: LabelRecord[];
  judge_results: JudgeResultRecord[];
};

export type SessionBundle = {
  session_id: string;
  set_id: string;
  title?: string | null;
  started_at: string;
  selection_mode: SelectionMode;
  post_ids: string[];
  posts: PostRecord[];
  labels: LabelRecord[];
};

export type AnswerPayload = {
  session_id: string;
  set_id: string;
  chosen_post_ids: string[];
  started_at: string;
  submitted_at: string;
  optional_feedback?: string;
};

export type JudgeResponse = {
  mode: JudgeMode;
  results: JudgeResultRecord[];
};

export type DashboardSummary = {
  postCount: number;
  setCount: number;
  answerCount: number;
  lastAnswerAt?: string | null;
  judgeMode: JudgeMode;
  selectionMode: SelectionMode;
  dbPath: string;
};
