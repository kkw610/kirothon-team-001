import type { Option, RecommendResponse } from "@/shared/types";
import { formatKm, formatTime, formatWon } from "./format";

interface Props {
  result: RecommendResponse;
}

function Breakdown({ option }: { option: Option }) {
  return (
    <ul className="breakdown">
      <li>
        지하철 {option.subwayMin}분 ({formatWon(option.subwayFare)})
      </li>
      <li>택시 대기 {option.taxiWaitMin}분</li>
      <li>
        택시 {option.taxiMin}분, {formatKm(option.taxiDistanceM)} ({formatWon(option.taxiFare)})
      </li>
      <li>
        {formatTime(option.departureTime)} 출발, {formatTime(option.arrivalTime)} 도착
      </li>
    </ul>
  );
}

export function ResultView({ result }: Props) {
  const { best, options } = result;
  const fastest = [...options].sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime))[0];
  const shown = best ?? fastest;

  return (
    <section className="card">
      {best ? (
        <h2>
          {best.stopName}역에서 택시로 갈아타세요 (총 {formatWon(best.totalCost)})
        </h2>
      ) : (
        <h2>제시간에 도착하는 방법이 없습니다</h2>
      )}
      {shown && (
        <>
          {!best && <p>가장 빠른 방법은 {shown.stopName}역에서 택시로 갈아타는 것입니다.</p>}
          <Breakdown option={shown} />
        </>
      )}
      <table>
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
          {options.map((o) => (
            <tr
              key={`${o.routeId}:${o.stopName}`}
              className={best?.routeId === o.routeId && best.stopName === o.stopName ? "best" : undefined}
            >
              <td>{o.stopName}</td>
              <td>{o.subwayMin}분</td>
              <td>
                {o.taxiMin}분 / {formatWon(o.taxiFare)}
              </td>
              <td>
                {formatTime(o.arrivalTime)}
                {o.onTime ? "" : " (지각)"}
              </td>
              <td>{formatWon(o.totalCost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
