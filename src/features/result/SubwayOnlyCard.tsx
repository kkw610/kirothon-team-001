import type { Route } from "@/shared/types";
import { cx } from "./cx";
import { getLineColor, getLineTextColor } from "./lineColor";
import { addMinutes, formatDuration, formatMargin, formatStationName, formatWon, safeTime } from "./format";
import styles from "./result.module.css";
import { buildSubwayOnlyPlan } from "./subwayOnly";

/** 단계의 점·선 색을 CSS 변수로 넘긴다. 노선 색을 모르면 기본 지하철 색을 쓴다. */
const legVars = (color: string | undefined) => (color ? ({ "--leg-color": color } as React.CSSProperties) : undefined);
interface Props {
  route: Route | undefined;
  /** route에 출발 시각이 없을 때 쓰는 출발 시각 (ISO 8601) */
  departureTime?: string;
  /** 희망 도착 시각 (ISO 8601) */
  arrivalDeadline: string;
  originName?: string;
  destinationName?: string;
}

/** 택시 없이 지하철만 탈 때의 경로. 호선별 구간, 도착 시각, 요금을 보여 준다. */
export function SubwayOnlyCard({ route, departureTime, arrivalDeadline, originName, destinationName }: Props) {
  const plan = buildSubwayOnlyPlan(route, departureTime, arrivalDeadline);
  if (!plan) return null;

  const first = plan.legs[0];
  const last = plan.legs[plan.legs.length - 1];
  const firstColor = getLineColor(first.line);
  const stats = [
    { label: "도착", value: safeTime(plan.arrivalTime) },
    { label: "소요", value: formatDuration(plan.totalMin) },
    { label: "요금", value: formatWon(plan.fare) },
    { label: "환승", value: `${plan.transferCount}회` },
  ];

  return (
    <section className={cx(styles.root, styles.card, styles.subwayOnlyCard)} aria-labelledby="subway-only-title">
      <h3 id="subway-only-title" className={cx(styles.heading, styles.sectionTitle)}>
        지하철만 타면
      </h3>
      <p className={cx(styles.subwayVerdict, plan.onTime ? styles.ok : styles.late)}>
        {plan.onTime ? `제시간 도착 · ${formatMargin(plan.marginMin)}` : `제시간 도착 불가 · ${formatMargin(plan.marginMin)}`}
      </p>
      <dl className={styles.subwayStats}>
        {stats.map((s) => (
          <div key={s.label} className={styles.subwayStat}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
      <ol className={styles.timeline}>
        <li className={styles.step} style={legVars(firstColor)}>
          <span className={styles.stepRail} aria-hidden="true">
            <span className={cx(styles.dot, styles.dotSubway)} />
            <span className={cx(styles.railLine, styles.lineSubway)} />
          </span>
          <div className={styles.stepText}>
            <p className={styles.stepName}>{originName ?? formatStationName(first.fromName)}</p>
            <p className={styles.stepTime}>{safeTime(plan.departureTime)} 출발</p>
            <p
              className={styles.stepLeg}
              style={firstColor ? { background: firstColor, color: getLineTextColor(firstColor) } : undefined}
            >
              {first.line} · {formatStationName(first.fromName)} 탑승
            </p>
          </div>
        </li>
        {plan.legs.slice(0, -1).map((leg, i) => (
          <li key={`${leg.line}-${leg.toName}`} className={styles.step} style={legVars(getLineColor(plan.legs[i + 1].line))}>
            <span className={styles.stepRail} aria-hidden="true">
              <span className={cx(styles.dot, styles.dotSubway)} />
              <span className={cx(styles.railLine, styles.lineSubway)} />
            </span>
            <div className={styles.stepText}>
              <p className={styles.stepName}>{formatStationName(leg.toName)}</p>
              <p className={styles.stepTime}>
                {safeTime(addMinutes(plan.departureTime, leg.endMin))} · {leg.line} {leg.stationCount}개 역 이동 후{" "}
                {plan.legs[i + 1].line} 환승
              </p>
            </div>
          </li>
        ))}
        <li className={styles.step}>
          <span className={styles.stepRail} aria-hidden="true">
            <span className={cx(styles.dot, styles.dotDest)} />
          </span>
          <div className={styles.stepText}>
            <p className={styles.stepName}>{destinationName ?? formatStationName(last.toName)}</p>
            <p className={styles.stepTime}>
              {safeTime(plan.arrivalTime)} 도착 · {last.line} {last.stationCount}개 역 이동
            </p>
          </div>
        </li>
      </ol>
    </section>
  );
}
