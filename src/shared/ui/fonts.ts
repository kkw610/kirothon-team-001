import { Jua } from "next/font/google";
import localFont from "next/font/local";

// 프로젝트에서 글꼴을 불러오는 유일한 파일이다.

/** 제목 글꼴 */
export const jua = Jua({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
  fallback: ["system-ui", "sans-serif"],
});

/** 본문 글꼴. pretendard 패키지의 가변 글꼴(굵기 45~920) 한 파일을 쓴다. */
export const pretendard = localFont({
  src: "../../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-body",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});
