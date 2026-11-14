import styles from "./subwayScene.module.css";

export interface SubwaySceneProps {
  className?: string;
}

/** 유령 마스코트가 지붕에 올라탄 지하철이 선로를 달리는 장식용 애니메이션. 스크린 리더에서는 숨긴다. */
export function SubwayScene({ className }: SubwaySceneProps) {
  const stations = [0, 80, 160, 240, 320, 400];
  return (
    <div className={[styles.scene, className].filter(Boolean).join(" ")} aria-hidden="true">
      <svg className={styles.svg} viewBox="0 -48 320 144" preserveAspectRatio="xMidYMid meet" focusable="false">
        <rect className={styles.rail} x="0" y="68" width="320" height="6" rx="3" />
        <g className={styles.stations}>
          {stations.map((x) => (
            <circle key={x} className={styles.station} cx={x + 20} cy="71" r="5" />
          ))}
        </g>
        <g className={styles.train}>
          <g className={styles.lines}>
            <rect className={styles.speed} x="-44" y="30" width="30" height="3" rx="1.5" />
            <rect className={styles.speed} x="-56" y="40" width="42" height="3" rx="1.5" />
            <rect className={styles.speed} x="-38" y="50" width="24" height="3" rx="1.5" />
          </g>
          <image
            className={styles.rider}
            href="/brand/mascot.svg"
            x="10"
            y="-44"
            width="68"
            height="68"
          />
          <g className={styles.bubble}>
            <path
              className={styles.bubbleShape}
              d="M91,-42 H185 A11,11 0 0 1 185,-20 H98 L82,-12 L88,-21.5 A11,11 0 0 1 91,-42 Z"
            />
          </g>
          <rect className={styles.body} x="-10" y="20" width="96" height="42" rx="12" />
          <rect className={styles.stripe} x="-10" y="48" width="96" height="6" />
          <rect className={styles.window} x="0" y="28" width="18" height="14" rx="4" />
          <rect className={styles.window} x="26" y="28" width="18" height="14" rx="4" />
          <rect className={styles.window} x="52" y="28" width="26" height="14" rx="4" />
          <circle className={styles.wheel} cx="14" cy="64" r="5" />
          <circle className={styles.wheel} cx="62" cy="64" r="5" />
        </g>
      </svg>
    </div>
  );
}
