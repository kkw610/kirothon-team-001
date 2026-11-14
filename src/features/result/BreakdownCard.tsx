import type { Option } from "@/shared/types";
import { buildBreakdownRows, type BreakdownKind, type BreakdownNames } from "./breakdown";
import { cx } from "./cx";
import { TAXI_FARE_DISCLAIMER } from "./format";
import styles from "./result.module.css";

interface Props {
  option: Option;
  names?: BreakdownNames;
}

function barClass(kind: BreakdownKind): string | undefined {
  if (kind === "subway") return styles.barSubway;
  if (kind === "taxiWait") return styles.barWait;
  if (kind === "taxi") return styles.barTaxi;
  if (kind === "walk") return styles.barWait;
  return undefined;
}

export function BreakdownCard({ option, names }: Props) {
  const rows = buildBreakdownRows(option, names);
  return (
    <section className={cx(styles.root, styles.card, styles.breakdownCard)}>
      <h3 className={cx(styles.heading, styles.sectionTitle)}>시간·비용 내역</h3>
      {rows.map((row) => {
        const isTotal = row.kind === "total";
        return (
          <div key={row.kind} className={cx(styles.breakdownRow, isTotal && styles.totalRow)}>
            <span className={cx(styles.bar, barClass(row.kind))} aria-hidden="true" />
            <div className={styles.rowTitle}>
              <p className={styles.rowLabel}>{row.label}</p>
              {row.range && <p className={styles.rowRange}>{row.range}</p>}
            </div>
            <p className={styles.rowDuration}>{row.duration}</p>
            <p className={cx(styles.rowCost, isTotal && styles.totalCost)}>{row.cost}</p>
          </div>
        );
      })}
      {option.kind !== "walk" && <p className={styles.note}>{TAXI_FARE_DISCLAIMER}</p>}
    </section>
  );
}
