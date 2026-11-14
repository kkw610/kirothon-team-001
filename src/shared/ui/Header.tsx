import { Button } from "./Button";
import { Chip } from "./Chip";
import { LogoMark } from "./LogoMark";
import styles from "./header.module.css";

export interface HeaderProps {
  /** 현재 검색 조건 요약. 없으면 로고와 이름만 표시한다 */
  conditionSummary?: string;
  /** 조건 바꾸기 버튼 핸들러. conditionSummary가 있을 때만 버튼이 나타난다 */
  onChangeCondition?: () => void;
}

export function Header({ conditionSummary, onChangeCondition }: HeaderProps) {
  const hasSummary = Boolean(conditionSummary);
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <LogoMark size={28} decorative />
          <span className={styles.name}>빨리갈게</span>
        </div>
        {hasSummary ? (
          <>
            <div className={styles.chipSlot}>
              <Chip>{conditionSummary}</Chip>
            </div>
            {onChangeCondition ? (
              <Button
                variant="outline"
                className={styles.action}
                onClick={onChangeCondition}
              >
                조건 바꾸기
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </header>
  );
}
