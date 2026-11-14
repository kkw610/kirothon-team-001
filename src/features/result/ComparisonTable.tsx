import type { Option } from "@/shared/types";
import { buildComparisonRows } from "./comparison";
import { cx } from "./cx";
import {
  BEST_BADGE,
  diffMinutes,
  FASTEST_BADGE,
  formatDuration,
  formatMargin,
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
  const rows = buildComparisonRows(options, best, arrivalDeadline);

  return (
    <section className={cx(styles.root, styles.card)}>
      <h3 className={cx(styles.heading, styles.tableTitle)}>역별 비교</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>택시 환승역</th>
              <th className={styles.cellNum}>지하철</th>
              <th className={styles.cellNum}>택시</th>
              <th className={styles.cellNum}>도착</th>
              <th className={styles.cellNum}>총비용</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ option: o, isBest, isFastest, isLate, lateText }) => (
              <tr
                key={`${o.routeId}:${o.stopName}`}
                className={cx(isBest && styles.rowBest, !isBest && isLate && styles.rowLate)}
              >
                <td data-label="택시 환승역" className={styles.cellStop}>
                  {isBest && <span className={styles.badge}>{BEST_BADGE}</span>}
                  {isFastest && <span className={cx(styles.badge, styles.badgeFastest)}>{FASTEST_BADGE}</span>}
                  {o.stopName}
                </td>
                <td data-label="지하철" className={styles.cellNum}>
                  {formatDuration(o.subwayMin)}
                </td>
                <td data-label="택시" className={styles.cellNum}>
                  {formatDuration(o.taxiMin)}
                  <br />
                  <small>{formatTaxiFare(o.taxiFare)}</small>
                </td>
                <td data-label="도착" className={styles.cellNum}>
                  {formatTime(o.arrivalTime)}
                  <br />
                  {isLate && lateText ? (
                    <small className={styles.late}>{lateText}</small>
                  ) : (
                    <small>{formatMargin(diffMinutes(arrivalDeadline, o.arrivalTime))}</small>
                  )}
                </td>
                <td data-label="총비용" className={styles.cellNum}>
                  {formatWon(o.totalCost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
