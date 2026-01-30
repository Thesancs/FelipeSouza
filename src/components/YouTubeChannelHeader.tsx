"use client";

import { useEffect, useState } from "react";
import styles from "./YouTubeChannelHeader.module.css";

type ChannelData = {
  name: string;
  handle: string;
  avatar: string;
  subscribers: string;
  views: string;
  videos: string;
  channelUrl: string;
};

const fallbackData: ChannelData = {
  name: "—",
  handle: "—",
  avatar: "—",
  subscribers: "—",
  views: "—",
  videos: "—",
  channelUrl: "https://www.youtube.com/@FelipeSousza/about",
};

export default function YouTubeChannelHeader() {
  const [data, setData] = useState<ChannelData>(fallbackData);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch("/api/youtube/channel", {
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as Partial<ChannelData>;
        setData((prev) => ({
          ...prev,
          ...payload,
          channelUrl: payload.channelUrl ?? prev.channelUrl,
        }));
      } catch {
        // Keep fallback data on errors.
      }
    };

    load();

    return () => controller.abort();
  }, []);

  const showViews = data.views && data.views !== "—";

  return (
    <div className={styles.card}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.headerRow}>
        <div className={styles.avatarWrapper}>
          {data.avatar !== "—" ? (
            <img
              src={data.avatar}
              alt={data.name}
              className={styles.avatar}
              loading="lazy"
            />
          ) : (
            <div className={styles.avatarFallback} />
          )}
        </div>
        <div className={styles.titleBlock}>
          <p className={styles.name}>{data.name}</p>
          <p className={styles.handle}>{data.handle}</p>
        </div>
      </div>

      <div className={styles.metricsRow}>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{data.subscribers}</span>
          <span className={styles.metricLabel}>Inscritos</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{data.views}</span>
          <span className={styles.metricLabel}>Views</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{data.videos}</span>
          <span className={styles.metricLabel}>Vídeos</span>
        </div>
      </div>

      <div className={styles.footerRow}>
        {showViews ? (
          <span className={styles.totalViews}>
            Total de visualizações: {data.views}
          </span>
        ) : null}
        <a
          href={data.channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.subscribeButton}
        >
          <YouTubeIcon />
          Inscreva-se
        </a>
      </div>
    </div>
  );
}

function YouTubeIcon() {
  return (
    <svg
      className={styles.youtubeIcon}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18.1 4.9 12 4.9 12 4.9s-6.1 0-7.7.4a2.7 2.7 0 0 0-1.9 1.9A28.6 28.6 0 0 0 2 12a28.6 28.6 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.6.4 7.7.4 7.7.4s6.1 0 7.7-.4a2.7 2.7 0 0 0 1.9-1.9A28.6 28.6 0 0 0 22 12a28.6 28.6 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z"
      />
    </svg>
  );
}
