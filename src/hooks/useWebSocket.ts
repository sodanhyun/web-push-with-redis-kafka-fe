import { useEffect, useRef, useState, useCallback } from 'react';
import useUserStore from '../store/useUserStore';

/**
 * @file useWebSocket.ts
 * @description WebSocket 연결 및 메시지 처리를 캡슐화하는 커스텀 훅입니다.
 *              컴포넌트에서 WebSocket 로직을 분리하여 재사용성과 유지보수성을 높이고,
 *              연결 상태, 메시지 송수신, 재연결 로직 등을 추상화합니다.
 *              userId를 내부적으로 Zustand 스토어에서 가져와 URL을 구성합니다.
 */

interface UseWebSocketOptions {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: Event) => void;
  onError?: (event: Event) => void;
  reconnectInterval?: number; // milliseconds
  reconnectLimit?: number; // number of attempts
}

const useWebSocket = (options?: UseWebSocketOptions) => {
  const userId = useUserStore((state) => state.userId);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [error, setError] = useState<Event | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const stableConnectionTimeout = useRef<number | null>(null);
  const { onOpen, onMessage, onClose, onError, reconnectInterval = 3000, reconnectLimit = 5 } = options || {};

  const connect = useCallback(() => {
    console.log(">>>> [WebSocket] Attempting to connect... (Version 3)");

    if (!userId) {
      console.warn(">>>> [WebSocket] userId is not available, skipping WebSocket connection.");
      return;
    }

    const VITE_WS_URL = import.meta.env.VITE_WS_URL;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}${VITE_WS_URL}/${userId}`;

    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      console.log(">>>> [WebSocket] Connection attempt skipped: already open or connecting.");
      return;
    }

    if (stableConnectionTimeout.current) {
        clearTimeout(stableConnectionTimeout.current);
    }

    console.log(">>>> [WebSocket] Creating new WebSocket instance.");
    ws.current = new WebSocket(wsUrl);
    setError(null);

    ws.current.onopen = (event) => {
      setIsConnected(true);
      
      stableConnectionTimeout.current = window.setTimeout(() => {
        reconnectAttempts.current = 0;
        console.log(">>>> [WebSocket] Connection is stable, resetting reconnect attempts.");
      }, 1000);

      onOpen?.(event);
    };

    ws.current.onmessage = (event) => {
      setLastMessage(event);
      onMessage?.(event);
    };

    ws.current.onclose = (event) => {
      setIsConnected(false);
      if (stableConnectionTimeout.current) {
          clearTimeout(stableConnectionTimeout.current);
      }
      onClose?.(event);
      if (reconnectAttempts.current < reconnectLimit) {
        reconnectAttempts.current++;
        console.log(`>>>> [WebSocket] Connection closed. Reconnect attempt ${reconnectAttempts.current} of ${reconnectLimit}.`);
        setTimeout(connect, reconnectInterval);
      } else {
        console.error(`>>>> [WebSocket] Connection closed permanently after ${reconnectLimit} retries.`);
        setError(new Event("WebSocket connection closed permanently after multiple retries."));
      }
    };

    ws.current.onerror = (event) => {
      setError(event);
      onError?.(event);
      ws.current?.close(); // Attempt to close on error to trigger onclose and reconnect logic
    };
  }, [userId, onOpen, onMessage, onClose, onError, reconnectInterval, reconnectLimit]);

  useEffect(() => {
    connect();
    return () => {
      if (stableConnectionTimeout.current) {
          clearTimeout(stableConnectionTimeout.current);
      }
      ws.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    } else {
      console.warn("WebSocket is not open. Cannot send message.");
    }
  }, []);

  return { isConnected, lastMessage, error, sendMessage };
};

export default useWebSocket;