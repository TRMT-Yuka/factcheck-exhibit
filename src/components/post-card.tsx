import Image from "next/image";

import type { PostRecord } from "@/lib/types";

type PostCardProps = {
  post: PostRecord;
  selected: boolean;
  selectionMode: "checkbox" | "radio";
  onToggle: (postId: string) => void;
};

function getPlatformTheme(platform?: string | null) {
  const normalized = platform?.toLowerCase() ?? "";

  if (normalized.includes("instagram")) {
    return {
      badge: "Instagram",
      accentClass: "is-instagram"
    };
  }

  if (normalized.includes("threads")) {
    return {
      badge: "Threads",
      accentClass: "is-threads"
    };
  }

  if (normalized.includes("youtube")) {
    return {
      badge: "YouTube",
      accentClass: "is-youtube"
    };
  }

  if (normalized.includes("facebook")) {
    return {
      badge: "Facebook",
      accentClass: "is-facebook"
    };
  }

  if (normalized.includes("line")) {
    return {
      badge: "LINE転載",
      accentClass: "is-line"
    };
  }

  if (normalized.includes("tiktok")) {
    return {
      badge: "TikTok",
      accentClass: "is-tiktok"
    };
  }

  return {
    badge: "X",
    accentClass: "is-x"
  };
}

function getPersona(postId: string) {
  const personas = [
    { name: "さとう みなみ", handle: "@37minami", avatar: "/avatars/avatar-01.png" },
    { name: "海沿いのゆう", handle: "@umi_yuu12", avatar: "/avatars/avatar-02.jpg" },
    { name: "kento", handle: "@kentogram", avatar: "/avatars/avatar-03.jpg" },
    { name: "nana_photo", handle: "@nanalog_23", avatar: "/avatars/avatar-04.jpg" },
    { name: "まつだ あおい", handle: "@aoi_note", avatar: "/avatars/avatar-05.jpg" },
    { name: "たける父", handle: "@tk_home", avatar: "/avatars/avatar-06.jpg" },
    { name: "nori暮らしメモ", handle: "@nori_life", avatar: "/avatars/avatar-07.jpg" },
    { name: "ゆき防災メモ", handle: "@yuki_days", avatar: "/avatars/avatar-08.png" },
    { name: "りこ", handle: "@rico_clip", avatar: "/avatars/avatar-09.jpg" },
    { name: "mika", handle: "@mika_stories", avatar: "/avatars/avatar-01.png" },
    { name: "daichi", handle: "@dd_run", avatar: "/avatars/avatar-02.jpg" },
    { name: "haru_84", handle: "@haru84_", avatar: "/avatars/avatar-03.jpg" },
    { name: "そらの部屋", handle: "@sora_room", avatar: "/avatars/avatar-04.jpg" },
    { name: "ami", handle: "@ami_local", avatar: "/avatars/avatar-05.jpg" }
  ];

  const numericId = Number(postId.replace("p", ""));
  return personas[(numericId - 1 + personas.length) % personas.length];
}

export function PostCard({
  post,
  selected,
  selectionMode,
  onToggle
}: PostCardProps) {
  const theme = getPlatformTheme(post.platform);
  const persona = getPersona(post.post_id);

  return (
    <article className={`timeline-card ${theme.accentClass}${selected ? " is-selected" : ""}`}>
      <div className="timeline-card__header">
        <div className="timeline-card__avatar" aria-hidden="true">
          <Image
            src={persona.avatar}
            alt=""
            width={48}
            height={48}
            className="timeline-card__avatar-image"
          />
        </div>
        <div className="timeline-card__identity">
          <div className="timeline-card__name-row">
            <strong>{persona.name}</strong>
            <span className="timeline-card__dot" />
            <span>{post.timestamp_text ?? "数分前"}</span>
          </div>
          <div className="timeline-card__handle">{persona.handle}</div>
        </div>
      </div>

      <div className="timeline-card__body">
        <p>{post.text}</p>
      </div>

      {post.image_url ? <img className="timeline-card__image" src={post.image_url} alt="" /> : null}

      <div className="timeline-card__actions" aria-hidden="true">
        <span title="返信">💬</span>
        <span title="共有">↻</span>
        <span title="いいね">♡</span>
      </div>

      <label className="timeline-card__selector">
        <input
          type={selectionMode}
          checked={selected}
          onChange={() => onToggle(post.post_id)}
          aria-label={`${post.post_id} を選択`}
        />
        <span className="timeline-card__selector-text">
          {selected ? "要注意な投稿に選択中" : "要注意な投稿に選択"}
        </span>
      </label>
    </article>
  );
}
