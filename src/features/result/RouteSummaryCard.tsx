import type { Option } from "@/shared/types";
import { cx } from "./cx";
import { addMinutes, formatStationName, safeTime } from "./format";
import styles from "./result.module.css";

interface Step {
  key: string;
  name: string;
  time: string;
  /** 이 단계에서 출발하는 지하철 구간 (예: "2호선 · 이대역 → 당산역") */
  leg?: string;
  dot: string;
  line?: string;
}

interface Props {
  option: Option;
  originName: string;
  destinationName: string;
}

/** 출발 → 택시 환승역 → 도착을 세로 타임라인으로 보여 준다. */
export function RouteSummaryCard({ option, originName, destinationName }: Props) {
  const { departureTime, arrivalTime, subwayMin, taxiWaitMin } = option;
  const getOff = addMinutes(departureTime, subwayMin);
  const taxiStart = addMinutes(departureTime, subwayMin + taxiWaitMin);
  const legs = option.legs ?? [];
  const legLabel = (i: number) => {
    const leg = legs[i];
    return leg ? `${leg.line} · ${formatStationName(leg.fromName)} → ${formatStationName(leg.toName)}` : undefined;
  };
  // 호선이 바뀌는 환승역마다 단계를 하나씩 끼워 넣어 어느 호선으로 갈아타는지 보여 준다.
  const transferSteps = legs.slice(0, -1).map((leg, i) => ({
    key: `transfer-${i}`,
    name: formatStationName(leg.toName),
    time: `${safeTime(addMinutes(departureTime, leg.endMin))} ${leg.line} → ${legs[i + 1].line} 환승`,
    leg: legLabel(i + 1),
    dot: styles.dotSubway,
    line: styles.lineSubway,
  }));
  const steps: Step[] = [
    { key: "origin", name: originName, time: `${safeTime(departureTime)} 출발`, leg: legLabel(0), dot: styles.dotSubway, line: styles.lineSubway },
    ...transferSteps,
    {
      key: "stop",
      name: formatStationName(option.stopName),
      time: `${safeTime(getOff)} 하차 · ${safeTime(taxiStart)} 택시 승차`,
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
              {s.leg && <p className={styles.stepLeg}>{s.leg}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
