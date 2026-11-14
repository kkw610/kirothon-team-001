import type { Option } from "@/shared/types";
import { cx } from "./cx";
import { addMinutes, formatStationName, safeTime } from "./format";
import styles from "./result.module.css";

interface Props {
  option: Option;
  originName: string;
  destinationName: string;
}

/** 출발 → 택시 환승역(또는 도보 하차역) → 도착을 세로 타임라인으로 보여 준다. */
export function RouteSummaryCard({ option, originName, destinationName }: Props) {
  const { departureTime, arrivalTime, subwayMin, taxiWaitMin } = option;
  const getOff = addMinutes(departureTime, subwayMin);
  const taxiStart = addMinutes(departureTime, subwayMin + taxiWaitMin);
  const stopTime =
    option.kind === "walk"
      ? `${safeTime(getOff)} 하차 · 도보로 이동`
      : `${safeTime(getOff)} 하차 · ${safeTime(taxiStart)} 택시 승차`;
  const steps = [
    { key: "origin", name: originName, time: `${safeTime(departureTime)} 출발`, dot: styles.dotSubway, line: styles.lineSubway },
    {
      key: "stop",
      name: formatStationName(option.stopName),
      time: stopTime,
      dot: styles.dotTransfer,
      line: styles.lineTaxi,
    },
    { key: "dest", name: destinationName, time: `${safeTime(arrivalTime)} 도착`, dot: styles.dotDest, line: undefined },
  ];
  return (
    <section className={cx(styles.root, styles.card, styles.routeCard)}>
      <h3 className={cx(styles.heading, styles.sectionTitle)}>경로 요약</h3>
      <ol className={styles.timeline}>
        {steps.map((s) => (
          <li key={s.key} className={styles.step}>
            <span className={styles.stepRail} aria-hidden="true">
              <span className={cx(styles.dot, s.dot)} />
              {s.line && <span className={cx(styles.railLine, s.line)} />}
            </span>
            <div className={styles.stepText}>
              <p className={styles.stepName}>{s.name}</p>
              <p className={styles.stepTime}>{s.time}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
