import { Jua } from "next/font/google";

// 프로젝트에서 next/font/google을 import하는 유일한 파일이다.
export const jua = Jua({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
  fallback: ["system-ui", "sans-serif"],
});
