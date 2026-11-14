import type { Metadata } from "next";
import { jua, pretendard } from "@/shared/ui/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "택시 환승역 추천",
  description: "제시간에 도착하면서 가장 싸게 택시로 갈아탈 지하철역을 추천합니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${jua.variable} ${pretendard.variable}`}>
      <body>{children}</body>
    </html>
  );
}
