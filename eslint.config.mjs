import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const FEATURES = ["places", "transit", "taxi", "recommender", "map", "result", "search-form"];

/** 기능 폴더는 다른 기능 폴더를 import할 수 없다. 공유는 @/shared만 쓴다. */
const featureBoundaries = FEATURES.map((name) => ({
  files: [`src/features/${name}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: FEATURES.filter((f) => f !== name).map((f) => `@/features/${f}*`),
            message: "기능 폴더끼리 직접 import하지 말고 @/shared의 타입으로 주고받으세요.",
          },
        ],
      },
    ],
  },
}));

const config = [
  ...nextVitals,
  ...nextTs,
  ...featureBoundaries,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
];

export default config;
