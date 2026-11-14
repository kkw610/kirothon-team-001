import type { Option } from "@/shared/types";
import { diffMinutes, formatDuration, formatMargin, formatTaxiFare, formatTime, formatWon } from "./format";
import styles from "./result.module.css";

interface Props {
  options: Option[];
  best: Option | null;
  arrivalDeadline: string;
}

export function ComparisonTable({ options, best, arrivalDeadline }: Props) {
  return (
    <section className={styles.card}>
      <h3 className={styles.tableTitle}>역별 비교</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>택시 환승역</th>
              <th>지하철</th>
              <th>택시</th>
              <th>도착</th>
              <th>총비용</th>
            </tr>
          </thead>
          <tbody>
            {options.map((o) => {
              const isBest = best?.routeId === o.routeId && best.stopName === o.stopName;
              const diff = diffMinutes(arrivalDeadline, o.arrivalTime);
              const cls = isBest ? styles.rowBest : o.onTime ? undefined : styles.rowLate;
              return (
                <tr key={`${o.routeId}:${o.stopName}`} className={cls}>
                  <td data-label="택시 환승역" className={styles.cellStop}>
                    {isBest && <span className={styles.badge}>추천</span>} {o.stopName}
                  </td>
                  <td data-label="지하철">{formatDuration(o.subwayMin)}</td>
                  <td data-label="택시">
                    {formatDuration(o.taxiMin)}
                    <br />
                    <small>{formatTaxiFare(o.taxiFare)}</small>
                  </td>
                  <td data-label="도착">
                    {formatTime(o.arrivalTime)}
                    <br />
                    <small>{formatMargin(diff)}</small>
                  </td>
                  <td data-label="총비용">{formatWon(o.totalCost)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
