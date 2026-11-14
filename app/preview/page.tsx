import { ResultView } from "@/features/result";
import type { Option, RecommendResponse } from "@/shared/types";
import { Header } from "@/shared/ui";
import styles from "../page.module.css";

/**
 * 결과 화면 미리보기용 목데이터 (/preview).
 * 이대역(2호선) → 당산역 환승 → 9호선 → 봉은사역. API를 부르지 않는다.
 */
const DEPARTURE = "2026-01-01T08:05:00.000Z"; // 17:05 KST
const DEADLINE = "2026-01-01T09:30:00.000Z"; // 18:30 KST
const at = (min: number) => new Date(new Date(DEPARTURE).getTime() + min * 60_000).toISOString();

function makeOption(
  stopName: string,
  stopCoord: { x: number; y: number },
  subwayMin: number,
  taxiMin: number,
  taxiDistanceM: number,
  taxiFare: number,
  legs: Option["legs"],
): Option {
  const taxiWaitMin = 5;
  const arrivalTime = at(subwayMin + taxiWaitMin + taxiMin);
  const subwayFare = 1550;
  return {
    routeId: `route-${stopName}`,
    stopName,
    stopCoord,
    departureTime: DEPARTURE,
    arrivalTime,
    onTime: arrivalTime <= DEADLINE,
    legs,
    subwayMin,
    taxiWaitMin,
    taxiMin,
    taxiDistanceM,
    subwayFare,
    taxiFare,
    totalCost: subwayFare + taxiFare,
  };
}

const best = makeOption("선정릉", { x: 127.0437, y: 37.5105 }, 40, 4, 1400, 4800, [
  { line: "2호선", fromName: "이대", toName: "당산", startMin: 0, endMin: 14 },
  { line: "9호선", fromName: "당산", toName: "선정릉", startMin: 14, endMin: 40 },
]);

const MOCK: RecommendResponse = {
  best,
  options: [
    best,
    makeOption("언주", { x: 127.0344, y: 37.5073 }, 37, 8, 3200, 7200, [
      { line: "2호선", fromName: "이대", toName: "당산", startMin: 0, endMin: 14 },
      { line: "9호선", fromName: "당산", toName: "언주", startMin: 14, endMin: 37 },
    ]),
    makeOption("학동", { x: 127.0316, y: 37.5143 }, 33, 12, 4900, 9800, [
      { line: "2호선", fromName: "이대", toName: "당산", startMin: 0, endMin: 14 },
      { line: "9호선", fromName: "당산", toName: "학동", startMin: 14, endMin: 33 },
    ]),
    makeOption("당산", { x: 126.9026, y: 37.5346 }, 14, 28, 15500, 21000, [
      { line: "2호선", fromName: "이대", toName: "당산", startMin: 0, endMin: 14 },
    ]),
  ],
  routes: [],
};

export default function PreviewPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <ResultView
          result={MOCK}
          arrivalDeadline={DEADLINE}
          originName="이대역"
          destinationName="봉은사역"
          aside={<div className={styles.mapPlaceholder}>지도는 준비 중이에요</div>}
        />
      </main>
    </>
  );
}
