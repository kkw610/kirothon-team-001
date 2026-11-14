import styles from "./brand.module.css";

export type MascotMood = "idle" | "happy" | "loading" | "late" | "error";

/** 표정별 그림이 생기면 이 표만 고친다. 지금은 모두 같은 그림이다. */
const MOOD_SRC: Record<MascotMood, string> = {
  idle: "/brand/mascot.svg",
  happy: "/brand/mascot.svg",
  loading: "/brand/mascot.svg",
  late: "/brand/mascot.svg",
  error: "/brand/mascot.svg",
};

export interface MascotProps {
  /** 가로·세로 px. 기본 64 */
  size?: number;
  mood?: MascotMood;
}

export function Mascot({ size = 64, mood = "idle" }: MascotProps) {
  return (
    // 정적 SVG라 next/image 최적화가 필요 없다.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.mascot}
      src={MOOD_SRC[mood]}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      data-mood={mood}
    />
  );
}
