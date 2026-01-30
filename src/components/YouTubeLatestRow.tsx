"use client";

import { useEffect, useState } from "react";
import styles from "./YouTubeLatestRow.module.css";

type VideoItem = {
  id: string;
  title: string;
  link: string;
  thumbnail: string;
  published: string;
};

export default function YouTubeLatestRow() {
  const [videos, setVideos] = useState<VideoItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch("/api/youtube/latest", {
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { videos?: VideoItem[] };
        if (payload.videos?.length) {
          setVideos(payload.videos);
        }
      } catch {
        // Keep empty state.
      }
    };

    load();

    return () => controller.abort();
  }, []);

  if (!videos.length) {
    return <div className={styles.emptyState}>Nenhum vídeo encontrado.</div>;
  }

  return (
    <div className={styles.rowWrapper}>
      <div className={styles.row} role="list">
        {videos.map((video) => (
          <a
            key={video.id}
            href={video.link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
            role="listitem"
          >
            <div className={styles.thumbnailWrap}>
              {video.thumbnail ? (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className={styles.thumbnail}
                  loading="lazy"
                />
              ) : (
                <div className={styles.thumbnailFallback} />
              )}
              <span className={styles.playBadge}>▶</span>
            </div>
            <div className={styles.meta}>
              <p className={styles.title}>{video.title}</p>
              <p className={styles.date}>{formatDate(video.published)}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

const formatDate = (value: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
