/**
 * @file cronUtils.ts
 * @description 크롤링 스케줄링에 사용되는 Cron 표현식의 생성, 파싱, 포맷팅을 위한 유틸리티 함수들을 제공합니다.
 *              사용자 친화적인 스케줄링 옵션과 Cron 표현식 간의 변환을 담당합니다.
 */

/**
 * @typedef {('minute' | 'hourly' | 'daily' | 'weekly' | 'monthly')} Frequency
 * @description 스케줄링 주기를 나타내는 타입입니다.
 *              - 'minute': 매분
 *              - 'hourly': 매시간
 *              - 'daily': 매일
 *              - 'weekly': 매주
 *              - 'monthly': 매월
 */
export type Frequency = 'minute' | 'hourly' | 'daily' | 'weekly' | 'monthly';

/**
 * @function generateCronExpression
 * @description 현재 선택된 사용자 친화적인 스케줄링 옵션들을 기반으로 Cron 표현식 문자열을 생성합니다.
 *              Spring CronTrigger는 6필드 (초 분 시 일 월 요일)를 기대하므로 초 필드를 0으로 고정합니다.
 *              주간/월간 스케줄의 경우 Quartz Cron의 규칙에 따라 day-of-month 또는 day-of-week 필드를 '?'로 설정합니다.
 * @param {Frequency} freq - 스케줄링 주기
 * @param {number} min - 분 (0-59)
 * @param {number} hr - 시 (0-23)
 * @param {number} dow - 요일 (0=일요일, 1=월요일, ..., 6=토요일)
 * @param {number} dom - 월의 일 (1-31)
 * @returns {string} 생성된 Cron 표현식 문자열
 */
export const generateCronExpression = (freq: Frequency, min: number, hr: number, dow: number, dom: number): string => {
  const second = 0; // 초 필드는 0으로 고정 (Spring CronTrigger는 6필드를 기대)
  switch (freq) {
    case 'minute':
      return `${second} * * * * *`; // 매분 0초에 실행
    case 'hourly':
      return `${second} ${min} * * * *`; // 매시간 min분 0초에 실행
    case 'daily':
      return `${second} ${min} ${hr} * * *`; // 매일 hr시 min분 0초에 실행
    case 'weekly':
      return `${second} ${min} ${hr} ? * ${dow}`; // 매주 dow요일 hr시 min분 0초에 실행 (dayOfMonth는 '?'로 설정)
    case 'monthly':
      return `${second} ${min} ${hr} ${dom} * ?`; // 매월 dom일 hr시 min분 0초에 실행 (dayOfWeek는 '?'로 설정)
    default:
      return `${second} 0 * * * *`; // 기본값: 매시간 정각 0초에 실행
  }
};

/**
 * @function parseCronExpression
 * @description Cron 표현식 문자열을 파싱하여 사용자 친화적인 스케줄링 옵션들로 변환합니다.
 *              6필드 Cron 표현식 (초 분 시 일 월 요일)을 처리합니다.
 * @param {string} cron - Cron 표현식 문자열
 * @returns {{ freq: Frequency, min: number, hr: number, dow: number, dom: number }}
 *          파싱된 스케줄링 옵션 객체
 */
export const parseCronExpression = (cron: string) => {
  const parts = cron.split(' ');
  // 6필드 Cron 표현식 (초 분 시 일 월 요일)을 기대합니다.
  if (parts.length !== 6) {
    // 유효하지 않은 Cron 표현식은 기본값으로 처리하여 오류를 방지합니다.
    return { freq: 'hourly', min: 0, hr: 0, dow: 0, dom: 1 };
  }

  // 초 필드는 UI에서 사용하지 않으므로 무시하고, 나머지 필드를 파싱합니다.
  const [secStr, minStr, hrStr, domStr, monthStr, dowStr] = parts;

  const min = minStr === '*' ? 0 : parseInt(minStr, 10);
  const hr = hrStr === '*' ? 0 : parseInt(hrStr, 10);
  // '?' 또는 '*'는 해당 필드가 무시됨을 의미하므로 -1로 처리합니다.
  const dom = domStr === '*' || domStr === '?' ? -1 : parseInt(domStr, 10);
  const dow = dowStr === '*' || dowStr === '?' ? -1 : parseInt(dowStr, 10);

  // Cron 표현식의 패턴을 기반으로 Frequency를 결정합니다.
  // 'minute' 주파수: 초 필드를 제외한 모든 필드가 '*'
  if (minStr === '*' && hrStr === '*' && domStr === '*' && monthStr === '*' && dowStr === '*') {
    return { freq: 'minute', min: 0, hr: 0, dow: 0, dom: 1 };
  }
  // 'hourly' 주파수: 분 필드는 특정 값, 나머지 필드는 '*' (초 필드 제외)
  else if (hrStr === '*' && domStr === '*' && monthStr === '*' && dowStr === '*') {
    return { freq: 'hourly', min: min, hr: 0, dow: 0, dom: 1 };
  }
  // 'weekly' 주파수: dayOfMonth 필드가 '?'이고 dayOfWeek가 특정 값
  else if (domStr === '?' && dow !== -1) {
    return { freq: 'weekly', min: min, hr: hr, dow: dow, dom: 1 };
  }
  // 'monthly' 주파수: dayOfMonth 필드가 특정 값이고 dayOfWeek가 '?'
  else if (dom !== -1 && dowStr === '?') {
    return { freq: 'monthly', min: min, hr: hr, dow: 0, dom: dom };
  }
  // 위 패턴에 해당하지 않으면 'daily'로 간주
  else {
    return { freq: 'daily', min: min, hr: hr, dow: 0, dom: 1 };
  }
};

/**
 * @function formatCronExpression
 * @description Cron 표현식 문자열을 사람이 읽기 쉬운 형태로 변환합니다.
 * @param {string} cron - Cron 표현식 문자열
 * @returns {string} 사람이 읽기 쉬운 Cron 표현식 문자열
 */
export const formatCronExpression = (cron: string): string => {
  const parsed = parseCronExpression(cron);
  const { freq, min, hr, dow, dom } = parsed;

  // 요일 이름을 배열로 정의
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

  switch (freq) {
    case 'minute':
      return "매분 실행";
    case 'hourly':
      return `매시간 ${min}분 실행`;
    case 'daily':
      return `매일 ${hr}시 ${min}분 실행`;
    case 'weekly':
      return `매주 ${dayNames[dow]} ${hr}시 ${min}분 실행`;
    case 'monthly':
      return `매월 ${dom}일 ${hr}시 ${min}분 실행`;
    default:
      return cron; // 파싱할 수 없는 경우 원본 Cron 표현식 반환
  }
};