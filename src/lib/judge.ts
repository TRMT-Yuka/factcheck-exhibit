import "server-only";

import { appEnv } from "@/lib/env";
import { getPostsForSet, getPrecomputedJudgeResults } from "@/lib/db";
import type { JudgeResponse, JudgeResultRecord, PostRecord } from "@/lib/types";

function buildExternalHeuristicResults(setId: string, posts: PostRecord[]): JudgeResultRecord[] {
  const keywordWeights: Array<[string, number]> = [
    ["不審者", 0.42],
    ["避難", 0.36],
    ["公式", 0.34],
    ["ワクチン", 0.34],
    ["感染症", 0.3],
    ["給水", 0.28],
    ["運休", 0.25],
    ["薬", 0.22],
    ["治る", 0.18],
    ["拡散希望", 0.12]
  ];

  const scored = posts.map((post) => {
    let score = 0.2;

    for (const [keyword, weight] of keywordWeights) {
      if (post.text.includes(keyword)) {
        score += weight;
      }
    }

    if (post.text.includes("らしい") || post.text.includes("という")) {
      score += 0.08;
    }

    score = Math.min(0.99, Number(score.toFixed(2)));

    const rationale =
      score >= 0.85
        ? "安全や健康への影響が大きく、誤情報時の被害拡大が懸念される。"
        : score >= 0.55
          ? "行動変化を促す要素があり、優先確認の価値が高い。"
          : "影響範囲は比較的限定的で、優先度は相対的に低い。";

    return {
      set_id: setId,
      post_id: post.post_id,
      priority_score: score,
      priority_rank: 0,
      rationale_short: rationale
    };
  });

  scored
    .sort((a, b) => b.priority_score - a.priority_score)
    .forEach((result, index) => {
      result.priority_rank = index + 1;
    });

  return scored.sort((a, b) => a.priority_rank - b.priority_rank);
}

export function judgePosts(setId: string, postIds: string[]): JudgeResponse {
  if (appEnv.judgeMode === "precomputed") {
    return {
      mode: appEnv.judgeMode,
      results: getPrecomputedJudgeResults(setId, postIds)
    };
  }

  const posts = getPostsForSet(setId).filter((post) => postIds.includes(post.post_id));

  return {
    mode: appEnv.judgeMode,
    results: buildExternalHeuristicResults(setId, posts)
  };
}
