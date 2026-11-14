import styles from "./brand.module.css";

export interface LogoMarkProps {
  /** 가로·세로 px. 기본 32 */
  size?: number;
  /** true면 스크린 리더에서 숨긴다(옆에 서비스 이름 텍스트가 있을 때) */
  decorative?: boolean;
}

export function LogoMark({ size = 32, decorative = false }: LogoMarkProps) {
  return (
    // 정적 SVG라 next/image 최적화가 필요 없다.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.logo}
      src="/brand/logo.svg"
      width={size}
      height={size}
      alt={decorative ? "" : "환승이"}
      aria-hidden={decorative ? true : undefined}
    />
  );
}
