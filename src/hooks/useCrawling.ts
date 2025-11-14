/**
 * @file useCrawling.ts
 * @description 크롤링 진행 상황과 관련된 상태(메시지 목록, 진행률, 크롤링 중 여부, 완료 메시지 표시 여부)를 관리하고,
 *              웹소켓 메시지를 처리하는 로직을 캡슐화하는 커스텀 React 훅입니다.
 */

import { useState, useCallback } from 'react';

/**
 * @interface CrawlingData
 * @description 백엔드로부터 수신하는 크롤링 진행 상황 메시지의 데이터 구조를 정의합니다.
 */
interface CrawlingData {
    title: string;    // 크롤링된 항목의 제목
    content: string;  // 크롤링된 항목의 내용
    status: string;   // 크롤링 진행 상태 (예: 'IN_PROGRESS', 'COMPLETE')
    progress: number; // 현재 크롤링 진행률 (0-100)
}

/**
 * @interface UseCrawlingResult
 * @description useCrawling 훅이 반환하는 값들의 타입을 정의합니다.
 */
interface UseCrawlingResult {
  messages: CrawlingData[];           // 수신된 크롤링 메시지 목록
  progress: number;                   // 현재 크롤링 진행률
  isCrawling: boolean;                // 크롤링이 진행 중인지 여부
  showCompletionMessage: boolean;     // 크롤링 완료 메시지를 표시할지 여부
  handleWebSocketMessage: (event: MessageEvent) => void; // 웹소켓 메시지를 처리하는 함수
  resetCrawlingState: () => void;     // 크롤링 관련 상태를 초기화하는 함수
  setIsCrawling: (isCrawling: boolean) => void; // isCrawling 상태를 설정하는 함수
}

/**
 * @hook useCrawling
 * @description 크롤링 진행 상황을 관리하는 커스텀 훅입니다.
 * @returns {UseCrawlingResult} 크롤링 관련 상태와 액션들을 포함하는 객체
 */
const useCrawling = (): UseCrawlingResult => {
  // 크롤링 메시지 목록 상태
  const [messages, setMessages] = useState<CrawlingData[]>([]);
  // 크롤링 진행률 상태
  const [progress, setProgress] = useState(0);
  // 크롤링 진행 중 여부 상태
  const [isCrawling, setIsCrawling] = useState(false);
  // 크롤링 완료 메시지 표시 여부 상태
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  /**
   * @function handleWebSocketMessage
   * @description 웹소켓으로부터 수신된 메시지를 처리하는 함수입니다.
   *              메시지 내용에 따라 크롤링 상태를 업데이트합니다.
   * @param {MessageEvent} event - 웹소켓 메시지 이벤트 객체
   */
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data: CrawlingData = JSON.parse(event.data);
      // 디버그 로그: console.log("Received WebSocket message for crawling:", data);

      // 메시지 상태가 'COMPLETE'인 경우 크롤링 완료 처리
      if (data.status === 'COMPLETE') {
        setProgress(100); // 진행률을 100%로 설정
        setIsCrawling(false); // 크롤링 중 아님으로 설정
        setShowCompletionMessage(true); // 완료 메시지 표시
      } else if (data.status === 'IN_PROGRESS') {
        // 메시지 상태가 'IN_PROGRESS'인 경우 진행 상황 업데이트
        setMessages((prevMessages) => [...prevMessages, data]); // 새 메시지를 메시지 목록에 추가
        setProgress(data.progress); // 백엔드에서 받은 progress 값으로 진행률 업데이트
      }
    } catch (err) {
      console.error("Failed to parse WebSocket message for crawling:", err);
    }
  }, [setMessages, setProgress, setIsCrawling, setShowCompletionMessage]); // 상태 setter 함수들을 의존성 배열에 포함

  /**
   * @function resetCrawlingState
   * @description 크롤링 관련 모든 상태를 초기값으로 재설정하는 함수입니다.
   *              새로운 크롤링 작업을 시작하기 전에 호출됩니다.
   */
  const resetCrawlingState = useCallback(() => {
    setMessages([]); // 메시지 목록 초기화
    setProgress(0); // 진행률 초기화
    setShowCompletionMessage(false); // 완료 메시지 숨김
    setIsCrawling(true); // 크롤링 시작 상태로 설정
  }, []); // 의존성 배열이 비어있으므로 컴포넌트 마운트 시 한 번만 생성됩니다.

  return {
    messages,
    progress,
    isCrawling,
    showCompletionMessage,
    handleWebSocketMessage,
    resetCrawlingState,
    setIsCrawling,
  };
};

export default useCrawling;