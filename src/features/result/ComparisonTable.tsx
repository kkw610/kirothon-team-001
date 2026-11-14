import type { Option } from "@/shared/types";
import { buildComparisonRows } from "./comparison";
import { cx } from "./cx";
import {
  BEST_BADGE,
  ON_TIME_LABEL,
  FASTEST_BADGE,
  formatDuration,
  formatTaxiFare,
  formatTime,
  formatWon,
} from "./format";
import styles from "./result.module.css";

interface Props {
  options: Option[];
  best: Option | null;
  arrivalDeadline: string;
}

export function ComparisonTable({ options, best, arrivalDeadline }: Props) {
  // 도착 빠른 순. 동률이면 원래 순서를 유지한다.
  const rows = buildComparisonRows(options, best, arrivalDeadline).sort(
    (a, b) => Date.parse(a.option.arrivalTime) - Date.parse(b.option.arrivalTime),
  );
  return (
    <section className={cx(styles.root, styles.card)}>
      <div className={styles.tableHead}>
        <h3 className={cx(styles.heading, styles.sectionTitle)}>역별 비교</h3>
        <p className={styles.tableHint}>도착 빠른 순</p>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>택시 타는 곳</th>
              <th className={styles.cellNum}>지하철</th>
              <th className={styles.cellNum}>택시</th>
              <th className={styles.cellNum}>택시비</th>
              <th className={styles.cellNum}>총비용</th>
              <th className={styles.cellNum}>도착</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ option: o, isBest, isFastest, isLate, lateText }) => (
              <tr
                key={`${o.routeId}:${o.stopName}`}
                className={cx(isBest && styles.rowBest, !isBest && isLate && styles.rowLate)}
              >
                <td data-label="택시 타는 곳" className={styles.cellStop}>
                  {o.stopName}
                </td>
                <td data-label="지하철" className={styles.cellNum}>
                  {formatDuration(o.subwayMin)}
                </td>
                <td data-label="택시" className={styles.cellNum}>
                  {formatDuration(o.taxiMin)}
                </td>
                <td data-label="택시비" className={styles.cellNum}>
                  {formatTaxiFare(o.taxiFare)}
                </td>
                <td data-label="총비용" className={cx(styles.cellNum, styles.cellTotal)}>
                  {formatWon(o.totalCost)}
                </td>
                <td data-label="도착" className={styles.cellNum}>
                  {formatTime(o.arrivalTime)}
                </td>
                <td data-label="상태" className={styles.cellStatus}>
                  {isBest && <span className={styles.badge}>{BEST_BADGE}</span>}
                  {isFastest && <span className={cx(styles.badge, styles.badgeFastest)}>{FASTEST_BADGE}</span>}
                  {isLate && lateText ? (
                    <span className={styles.lateStatus}>{lateText}</span>
                  ) : (
                    !isBest && <span className={styles.okStatus}>{ON_TIME_LABEL}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
