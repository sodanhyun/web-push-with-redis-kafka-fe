import { useState, useCallback } from 'react';

interface CrawlingData {
    title: string;
    content: string;
    status: string;
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
      console.log("Received WebSocket message for crawling:", data);

      if (data.status === 'complete') {
        setProgress(100);
        setIsCrawling(false);
        setShowCompletionMessage(true);
      } else if (data.status === 'in_progress') {
        setMessages((prevMessages) => [...prevMessages, data]);
        setProgress((prev) => Math.min(prev + 10, 100));
      }
    } catch (err) {
      console.error("Failed to parse WebSocket message for crawling:", err);
    }
  }, []);

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
