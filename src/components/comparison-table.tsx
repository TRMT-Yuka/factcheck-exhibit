import type { JudgeResultRecord, LabelRecord, PostRecord } from "@/lib/types";

type ComparisonTableProps = {
  posts: PostRecord[];
  labels: LabelRecord[];
  judgeResults: JudgeResultRecord[];
  chosenPostIds: string[];
};

function labelClass(priorityLabel: string) {
  const normalized = priorityLabel.toLowerCase();
  if (normalized.includes("high")) {
    return "pill high";
  }
  if (normalized.includes("mid")) {
    return "pill mid";
  }
  return "pill low";
}

export function ComparisonTable({
  posts,
  labels,
  judgeResults,
  chosenPostIds
}: ComparisonTableProps) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>投稿</th>
            <th>体験者選択</th>
            <th>AI / 判定システム</th>
            <th>作成者ラベル</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => {
            const label = labels.find((item) => item.post_id === post.post_id);
            const judge = judgeResults.find((item) => item.post_id === post.post_id);
            const selected = chosenPostIds.includes(post.post_id);

            return (
              <tr key={post.post_id}>
                <td style={{ minWidth: 280 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{post.platform ?? "投稿"}</div>
                  <div style={{ lineHeight: 1.6 }}>{post.text}</div>
                </td>
                <td>{selected ? "選択した" : "選択していない"}</td>
                <td style={{ minWidth: 230 }}>
                  {judge ? (
                    <div className="stack">
                      <div>
                        順位 {judge.priority_rank} / スコア {judge.priority_score.toFixed(2)}
                      </div>
                      <div className="muted">{judge.rationale_short}</div>
                    </div>
                  ) : (
                    <span className="muted">判定なし</span>
                  )}
                </td>
                <td style={{ minWidth: 200 }}>
                  {label ? (
                    <div className="stack">
                      <span className={labelClass(label.priority_label)}>
                        {label.priority_label}
                      </span>
                      <span className="muted">{label.label_reason}</span>
                    </div>
                  ) : (
                    <span className="muted">ラベルなし</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
