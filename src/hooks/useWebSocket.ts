import { useState, useEffect, useRef, useCallback } from 'react';

export enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
  UNINSTANTIATED = 4,
}

interface UseWebSocketOptions {
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
}

const useWebSocket = (url: string | null, options: UseWebSocketOptions = {}) => {
  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.UNINSTANTIATED);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const ws = useRef<WebSocket | null>(null);

  // Use refs for callbacks to prevent re-renders from creating new WebSocket connections.
  const onOpenRef = useRef(options.onOpen);
  const onCloseRef = useRef(options.onClose);
  const onMessageRef = useRef(options.onMessage);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onOpenRef.current = options.onOpen;
    onCloseRef.current = options.onClose;
    onMessageRef.current = options.onMessage;
    onErrorRef.current = options.onError;
  }, [options.onOpen, options.onClose, options.onMessage, options.onError]);

  useEffect(() => {
    if (url) {
      setReadyState(ReadyState.CONNECTING);
      const socket = new WebSocket(url);
      ws.current = socket;

      socket.onopen = (event) => {
        console.log('>>>> [WebSocket] Connection established');
        setReadyState(ReadyState.OPEN);
        onOpenRef.current?.(event);
      };

      socket.onmessage = (event) => {
        setLastMessage(event);
        onMessageRef.current?.(event);
      };

      socket.onclose = (event) => {
        console.log('>>>> [WebSocket] Connection closed');
        setReadyState(ReadyState.CLOSED);
        ws.current = null;
        onCloseRef.current?.(event);
      };

      socket.onerror = (event) => {
        console.error('>>>> [WebSocket] Error:', event);
        // onclose will be called automatically after an error.
        onErrorRef.current?.(event);
      };

      return () => {
        // Ensure socket is closed when the component unmounts or URL changes.
        if (socket.readyState === ReadyState.OPEN || socket.readyState === ReadyState.CONNECTING) {
          socket.close();
        }
      };
    } else {
      setReadyState(ReadyState.CLOSED);
    }
  }, [url]);

  const sendMessage = useCallback((message: string) => {
    if (ws.current && ws.current.readyState === ReadyState.OPEN) {
      ws.current.send(message);
    } else {
      console.warn('>>>> [WebSocket] is not open. Cannot send message.');
    }
  }, []);

  return { readyState, lastMessage, sendMessage };
};

export default useWebSocket;
