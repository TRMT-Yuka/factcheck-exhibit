import "server-only";

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

import { appEnv } from "@/lib/env";
import { loadSeedDataFromDisk } from "@/lib/data-loader";
import { toCsv } from "@/lib/csv";
import type {
  AnswerPayload,
  DashboardSummary,
  JudgeResultRecord,
  LabelRecord,
  PostRecord,
  SeedData,
  SessionBundle
} from "@/lib/types";

type GlobalWithDb = typeof globalThis & {
  __factcheckExhibitDb?: DatabaseSync;
  __factcheckExhibitDbInitialized?: boolean;
};

function getGlobal() {
  return globalThis as GlobalWithDb;
}

function ensureDatabaseFile() {
  fs.mkdirSync(path.dirname(appEnv.dbPath), { recursive: true });
}

function createDatabase() {
  ensureDatabaseFile();
  return new DatabaseSync(appEnv.dbPath);
}

function initializeDatabase(db: DatabaseSync) {
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS posts (
      post_id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      image_url TEXT,
      platform TEXT,
      timestamp_text TEXT
    );

    CREATE TABLE IF NOT EXISTS post_sets (
      set_id TEXT PRIMARY KEY,
      title TEXT
    );

    CREATE TABLE IF NOT EXISTS post_set_posts (
      set_id TEXT NOT NULL,
      post_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      PRIMARY KEY (set_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS labels (
      post_id TEXT PRIMARY KEY,
      priority_label TEXT NOT NULL,
      label_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS judge_results (
      set_id TEXT NOT NULL,
      post_id TEXT NOT NULL,
      priority_score REAL NOT NULL,
      priority_rank INTEGER NOT NULL,
      rationale_short TEXT NOT NULL,
      PRIMARY KEY (set_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      set_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      set_id TEXT NOT NULL,
      chosen_post_ids TEXT NOT NULL,
      started_at TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      duration_ms INTEGER NOT NULL,
      optional_feedback TEXT
    );
  `);

  const countRow = db.prepare("SELECT COUNT(*) AS count FROM post_sets").get() as {
    count: number;
  };

  if (countRow.count === 0) {
    seedContent(db, loadSeedDataFromDisk());
  }
}

export function getDb() {
  const globalRef = getGlobal();

  if (!globalRef.__factcheckExhibitDb) {
    globalRef.__factcheckExhibitDb = createDatabase();
  }

  if (!globalRef.__factcheckExhibitDbInitialized) {
    initializeDatabase(globalRef.__factcheckExhibitDb);
    globalRef.__factcheckExhibitDbInitialized = true;
  }

  return globalRef.__factcheckExhibitDb;
}

function clearContentTables(db: DatabaseSync) {
  db.exec(`
    DELETE FROM judge_results;
    DELETE FROM labels;
    DELETE FROM post_set_posts;
    DELETE FROM post_sets;
    DELETE FROM posts;
  `);
}

function seedContent(db: DatabaseSync, seedData: SeedData) {
  clearContentTables(db);

  const insertPost = db.prepare(`
    INSERT INTO posts (post_id, text, image_url, platform, timestamp_text)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const post of seedData.posts) {
    insertPost.run(
      post.post_id,
      post.text,
      post.image_url ?? null,
      post.platform ?? null,
      post.timestamp_text ?? null
    );
  }

  const insertSet = db.prepare(`
    INSERT INTO post_sets (set_id, title)
    VALUES (?, ?)
  `);
  const insertSetPost = db.prepare(`
    INSERT INTO post_set_posts (set_id, post_id, position)
    VALUES (?, ?, ?)
  `);

  for (const postSet of seedData.post_sets) {
    insertSet.run(postSet.set_id, postSet.title ?? null);

    postSet.post_ids.forEach((postId, index) => {
      insertSetPost.run(postSet.set_id, postId, index + 1);
    });
  }

  const insertLabel = db.prepare(`
    INSERT INTO labels (post_id, priority_label, label_reason)
    VALUES (?, ?, ?)
  `);
  for (const label of seedData.labels) {
    insertLabel.run(
      label.post_id,
      label.priority_label,
      label.label_reason ?? null
    );
  }

  const insertJudge = db.prepare(`
    INSERT INTO judge_results (set_id, post_id, priority_score, priority_rank, rationale_short)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const result of seedData.judge_results) {
    insertJudge.run(
      result.set_id,
      result.post_id,
      result.priority_score,
      result.priority_rank,
      result.rationale_short
    );
  }
}

function mapPostRow(row: Record<string, unknown>): PostRecord {
  return {
    post_id: String(row.post_id),
    text: String(row.text),
    image_url: row.image_url ? String(row.image_url) : null,
    platform: row.platform ? String(row.platform) : null,
    timestamp_text: row.timestamp_text ? String(row.timestamp_text) : null
  };
}

function mapLabelRow(row: Record<string, unknown>): LabelRecord {
  return {
    post_id: String(row.post_id),
    priority_label: String(row.priority_label),
    label_reason: row.label_reason ? String(row.label_reason) : null
  };
}

function mapJudgeRow(row: Record<string, unknown>): JudgeResultRecord {
  return {
    set_id: String(row.set_id),
    post_id: String(row.post_id),
    priority_score: Number(row.priority_score),
    priority_rank: Number(row.priority_rank),
    rationale_short: String(row.rationale_short)
  };
}

export function getPostsForSet(setId: string) {
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT p.post_id, p.text, p.image_url, p.platform, p.timestamp_text
        FROM post_set_posts psp
        INNER JOIN posts p ON p.post_id = psp.post_id
        WHERE psp.set_id = ?
        ORDER BY psp.position ASC
      `
    )
    .all(setId) as Record<string, unknown>[];

  return rows.map(mapPostRow);
}

export function getLabelsForPosts(postIds: string[]) {
  const db = getDb();
  const statement = db.prepare(
    "SELECT post_id, priority_label, label_reason FROM labels WHERE post_id = ?"
  );
  return postIds
    .map((postId) => statement.get(postId) as Record<string, unknown> | undefined)
    .filter((row): row is Record<string, unknown> => Boolean(row))
    .map(mapLabelRow);
}

export function getPrecomputedJudgeResults(setId: string, postIds: string[]) {
  const db = getDb();
  const statement = db.prepare(
    `
      SELECT set_id, post_id, priority_score, priority_rank, rationale_short
      FROM judge_results
      WHERE set_id = ? AND post_id = ?
    `
  );

  return postIds
    .map((postId) => statement.get(setId, postId) as Record<string, unknown> | undefined)
    .filter((row): row is Record<string, unknown> => Boolean(row))
    .map(mapJudgeRow)
    .sort((a, b) => a.priority_rank - b.priority_rank);
}

export function startNewSession(): SessionBundle {
  const db = getDb();
  const setRow = db
    .prepare(
      `
        SELECT set_id, title
        FROM post_sets
        ORDER BY RANDOM()
        LIMIT 1
      `
    )
    .get() as { set_id: string; title?: string | null } | undefined;

  if (!setRow) {
    throw new Error("No post sets available.");
  }

  const startedAt = new Date().toISOString();
  const sessionId = randomUUID();

  db.prepare(
    `
      INSERT INTO sessions (session_id, set_id, created_at)
      VALUES (?, ?, ?)
    `
  ).run(sessionId, setRow.set_id, startedAt);

  const posts = getPostsForSet(setRow.set_id);
  const postIds = posts.map((post) => post.post_id);
  const labels = getLabelsForPosts(postIds);

  return {
    session_id: sessionId,
    set_id: setRow.set_id,
    title: setRow.title ?? null,
    started_at: startedAt,
    selection_mode: appEnv.selectionMode,
    post_ids: postIds,
    posts,
    labels
  };
}

export function saveAnswer(answer: AnswerPayload) {
  const db = getDb();
  const startedAt = new Date(answer.started_at).getTime();
  const submittedAt = new Date(answer.submitted_at).getTime();
  const durationMs =
    Number.isFinite(startedAt) && Number.isFinite(submittedAt)
      ? Math.max(0, submittedAt - startedAt)
      : 0;

  db.prepare(
    `
      INSERT INTO answers (
        session_id,
        set_id,
        chosen_post_ids,
        started_at,
        submitted_at,
        duration_ms,
        optional_feedback
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    answer.session_id,
    answer.set_id,
    JSON.stringify(answer.chosen_post_ids),
    answer.started_at,
    answer.submitted_at,
    durationMs,
    answer.optional_feedback?.trim() || null
  );

  return { durationMs };
}

export function replaceSeedData(seedData: SeedData) {
  const db = getDb();
  db.exec("DELETE FROM sessions;");
  seedContent(db, seedData);
}

export function resetDatabase() {
  const db = getDb();
  db.exec(`
    DELETE FROM answers;
    DELETE FROM sessions;
  `);
  seedContent(db, loadSeedDataFromDisk());
}

export function exportAnswersCsv() {
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT
          session_id,
          set_id,
          chosen_post_ids,
          started_at,
          submitted_at,
          duration_ms,
          optional_feedback
        FROM answers
        ORDER BY submitted_at DESC
      `
    )
    .all() as Record<string, unknown>[];

  return toCsv(
    [
      "session_id",
      "set_id",
      "chosen_post_ids",
      "started_at",
      "submitted_at",
      "duration_ms",
      "optional_feedback"
    ],
    rows.map((row) => [
      String(row.session_id ?? ""),
      String(row.set_id ?? ""),
      String(row.chosen_post_ids ?? ""),
      String(row.started_at ?? ""),
      String(row.submitted_at ?? ""),
      Number(row.duration_ms ?? 0),
      row.optional_feedback == null ? "" : String(row.optional_feedback)
    ])
  );
}

export function getDashboardSummary(): DashboardSummary {
  const db = getDb();
  const postCount = db.prepare("SELECT COUNT(*) AS count FROM posts").get() as {
    count: number;
  };
  const setCount = db.prepare("SELECT COUNT(*) AS count FROM post_sets").get() as {
    count: number;
  };
  const answerCount = db.prepare("SELECT COUNT(*) AS count FROM answers").get() as {
    count: number;
  };
  const lastAnswer = db
    .prepare("SELECT submitted_at FROM answers ORDER BY submitted_at DESC LIMIT 1")
    .get() as { submitted_at?: string } | undefined;

  return {
    postCount: postCount.count,
    setCount: setCount.count,
    answerCount: answerCount.count,
    lastAnswerAt: lastAnswer?.submitted_at ?? null,
    judgeMode: appEnv.judgeMode,
    selectionMode: appEnv.selectionMode,
    dbPath: appEnv.dbPath
  };
}
