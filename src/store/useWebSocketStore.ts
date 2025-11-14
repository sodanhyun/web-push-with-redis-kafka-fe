import { create } from 'zustand';

export const enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
  UNINSTANTIATED = 4,
}

interface WebSocketState {
  socket: WebSocket | null;
  readyState: ReadyState;
  connectionStatus: string; // <-- 여기에 추가
  connect: (url: string, onMessageCallback?: (event: MessageEvent) => void) => void;
  disconnect: () => void;
  sendMessage: (message: string) => void;
}

// readyState를 connectionStatus 문자열로 변환하는 헬퍼 함수
const getStatusString = (readyState: ReadyState): string => {
  return {
    [ReadyState.CONNECTING]: '연결 중...',
    [ReadyState.OPEN]: '연결됨',
    [ReadyState.CLOSING]: '연결 종료 중...',
    [ReadyState.CLOSED]: '연결 끊김',
    [ReadyState.UNINSTANTIATED]: '연결 안 됨',
  }[readyState];
};

const useWebSocketStore = create<WebSocketState>((set, get) => ({
  socket: null,
  readyState: ReadyState.UNINSTANTIATED,
  connectionStatus: getStatusString(ReadyState.UNINSTANTIATED), // <-- 초기값 설정

  connect: (url, onMessageCallback) => {
    const currentSocket = get().socket;
    const currentReadyState = get().readyState;
    console.log(`[WebSocketStore] connect called. URL: ${url}, Current ReadyState: ${currentReadyState}`);

    if (currentReadyState === ReadyState.OPEN) {
      console.log('[WebSocketStore] WebSocket is already open, returning.');
      return;
    }
    if (currentReadyState === ReadyState.CONNECTING) {
      console.log('[WebSocketStore] WebSocket is already connecting, returning.');
      return;
    }

    if (currentSocket && (currentReadyState === ReadyState.CLOSED || currentReadyState === ReadyState.CLOSING)) {
      console.log('[WebSocketStore] Closing existing WebSocket before new connection attempt.');
      currentSocket.close();
      set({ socket: null, readyState: ReadyState.UNINSTANTIATED, connectionStatus: getStatusString(ReadyState.UNINSTANTIATED) });
    } else if (currentSocket) {
        console.warn('[WebSocketStore] Unexpected WebSocket state, closing existing socket.');
        currentSocket.close();
        set({ socket: null, readyState: ReadyState.UNINSTANTIATED, connectionStatus: getStatusString(ReadyState.UNINSTANTIATED) });
    }

    set({ readyState: ReadyState.CONNECTING, connectionStatus: getStatusString(ReadyState.CONNECTING) });
    console.log('[WebSocketStore] Setting readyState to CONNECTING.');
    const newSocket = new WebSocket(url);

    newSocket.onopen = () => {
      console.log('>>>> [WebSocket] Connection established. Setting readyState to OPEN.');
      set({ readyState: ReadyState.OPEN, connectionStatus: getStatusString(ReadyState.OPEN) });
    };

    newSocket.onmessage = (event) => {
      onMessageCallback?.(event);
    };

    newSocket.onclose = (event) => {
      console.log(`>>>> [WebSocket] Connection closed. Code: ${event.code}, Reason: ${event.reason}. Setting readyState to CLOSED.`);
      set({ readyState: ReadyState.CLOSED, socket: null, connectionStatus: getStatusString(ReadyState.CLOSED) });
    };

    newSocket.onerror = (event) => {
      console.error('>>>> [WebSocket] Error event:', event);
      // onclose will be called automatically after an error.
    };

    set({ socket: newSocket });
    console.log('[WebSocketStore] New socket instance set in store.');
  },

  disconnect: () => {
    const { socket, readyState } = get();
    console.log(`[WebSocketStore] disconnect called. Current ReadyState: ${readyState}`);
    if (socket) {
      socket.close();
      set({ readyState: ReadyState.CLOSING, connectionStatus: getStatusString(ReadyState.CLOSING) });
      console.log('[WebSocketStore] Setting readyState to CLOSING.');
    }
  },

  sendMessage: (message: string) => {
    const { socket } = get();
    if (socket && socket.readyState === ReadyState.OPEN) {
      socket.send(message);
    } else {
      console.warn('>>>> [WebSocket] is not open. Cannot send message.');
    }
  },
}));

export default useWebSocketStore;
