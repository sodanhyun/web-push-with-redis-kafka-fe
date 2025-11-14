import { useState, useCallback } from 'react';

interface CrawlingData {
    title: string;
    content: string;
    status: string;
    progress: number; // progress 필드 추가
}

interface UseCrawlingResult {
  messages: CrawlingData[];
  progress: number;
  isCrawling: boolean;
  showCompletionMessage: boolean;
  handleWebSocketMessage: (event: MessageEvent) => void;
  resetCrawlingState: () => void;
  setIsCrawling: (isCrawling: boolean) => void; // Add setter for isCrawling
}

const useCrawling = (): UseCrawlingResult => {
  const [messages, setMessages] = useState<CrawlingData[]>([]);
  const [progress, setProgress] = useState(0);
  const [isCrawling, setIsCrawling] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data: CrawlingData = JSON.parse(event.data);

      if (data.status === 'COMPLETE') {
        setProgress(100);
        setIsCrawling(false);
        setShowCompletionMessage(true);
      } else if (data.status === 'IN_PROGRESS') {
        setMessages((prevMessages) => [...prevMessages, data]);
        setProgress(data.progress); // 백엔드에서 받은 progress 값 사용
      }
    } catch (err) {
      console.error("Failed to parse WebSocket message for crawling:", err);
    }
  }, [setMessages, setProgress, setIsCrawling, setShowCompletionMessage]); // 의존성 배열 업데이트

  const resetCrawlingState = useCallback(() => {
    setMessages([]);
    setProgress(0);
    setShowCompletionMessage(false);
    setIsCrawling(true); // Set to true when starting a new crawling process
  }, []);

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
