import styles from "./result.module.css";

export function ResultSkeleton() {
  return (
    <section className={styles.card} role="status" aria-live="polite" aria-busy="true">
      <p className={styles.sub}>경로 계산 중...</p>
      <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
      <div className={styles.skeleton} />
      <div className={styles.skeleton} />
      <div className={styles.skeleton} />
    </section>
  );
}

interface ErrorProps {
  message: string;
  onRetry: () => void;
}

export function ResultError({ message, onRetry }: ErrorProps) {
  return (
    <section className={`${styles.card} ${styles.errorCard}`} role="alert">
      <p className={styles.errorText}>⚠ {message}</p>
      <button type="button" className={styles.retry} onClick={onRetry}>
        다시 시도
      </button>
    </section>
  );
}
