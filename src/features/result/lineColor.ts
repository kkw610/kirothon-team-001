/** 서울 지하철 노선 공식 색. 키는 노선 이름에서 뽑은 식별자. */
const LINE_COLORS: Record<string, string> = {
  "1": "#0052A4",
  "2": "#00A84D",
  "3": "#EF7C1C",
  "4": "#00A5DE",
  "5": "#996CAC",
  "6": "#CD7C2F",
  "7": "#747F00",
  "8": "#E6186C",
  "9": "#BDB092",
  신분당: "#D4003B",
  수인분당: "#FABE00",
  공항: "#0090D2",
  경의중앙: "#77C4A3",
  경춘: "#0C8E72",
  우이신설: "#B0CE18",
  신림: "#6789CA",
  경강: "#0054A6",
  서해: "#8FC31F",
  김포골드: "#A17E46",
  의정부: "#FDA600",
  용인에버라인: "#56AD2D",
  인천1: "#7CA8D5",
  인천2: "#ED8B00",
};

/** "수도권2호선", "9호선(급행)", "신분당선" 같은 이름에서 노선 색을 찾는다. 모르는 노선이면 undefined. */
export function getLineColor(line: string | undefined): string | undefined {
  if (!line) return undefined;
  const name = line.replace(/\(.*?\)/g, "").replace(/^수도권\s*/, "").trim();
  const numbered = name.match(/^(\d+)호선$/);
  if (numbered) return LINE_COLORS[numbered[1]];
  const key = name.replace(/선$/, "").replace(/\s/g, "");
  if (key === "인천1호" || key === "인천2호") return LINE_COLORS[key.replace("호", "")];
  return LINE_COLORS[key];
}

/** 배경색 위에 올릴 글자색(흰색/검정). 밝은 노선색(9호선, 수인분당선 등)에서 가독성을 지킨다. */
export function getLineTextColor(bg: string): string {
  const n = parseInt(bg.slice(1), 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? "#222" : "#fff";
}
