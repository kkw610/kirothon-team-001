import type { Option } from "@/shared/types";
import { buildBreakdownRows, type BreakdownKind } from "./breakdown";
import { cx } from "./cx";
import styles from "./result.module.css";

interface Props {
  option: Option;
}

function barClass(kind: BreakdownKind): string | undefined {
  if (kind === "subway") return styles.barSubway;
  if (kind === "taxiWait" || kind === "taxi") return styles.barTaxi;
  return undefined;
}

export function BreakdownCard({ option }: Props) {
  const rows = buildBreakdownRows(option);
  return (
    <section className={cx(styles.root, styles.card, styles.breakdownCard)}>
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
            {row.note && <p className={styles.rowNote}>{row.note}</p>}
          </div>
        );
      })}
    </section>
  );
}
