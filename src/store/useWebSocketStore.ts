import { create } from 'zustand';
import SockJS from 'sockjs-client';
import * as Stomp from 'stompjs'; // <-- 임포트 방식 변경
import useAuthStore from './useAuthStore'; // useAuthStore 임포트

export const enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
  UNINSTANTIATED = 4,
}

interface WebSocketState {
  stompClient: Stomp.Client | null;
  readyState: ReadyState;
  connectionStatus: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectTimeoutId: NodeJS.Timeout | null;
  connect: (url: string) => void;
  disconnect: () => void;
  sendMessage: (destination: string, body: string, headers?: any) => void;
  subscribe: (destination: string, callback: (message: Stomp.Message) => void, headers?: any) => Stomp.Subscription | undefined;
  unsubscribe: (subscription: Stomp.Subscription) => void;
  resetReconnectAttempts: () => void;
}

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
  stompClient: null, // WebSocket 대신 Stomp.Client 사용
  readyState: ReadyState.UNINSTANTIATED,
  connectionStatus: getStatusString(ReadyState.UNINSTANTIATED),
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectTimeoutId: null,

  connect: (url) => { // onMessageCallback 파라미터 제거
    const { stompClient, readyState, reconnectAttempts, maxReconnectAttempts, reconnectTimeoutId } = get();
    console.log(`[WebSocketStore] connect called. URL: ${url}, Current ReadyState: ${readyState}, Attempts: ${reconnectAttempts}`);

    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId);
      set({ reconnectTimeoutId: null });
    }

    if (readyState === ReadyState.OPEN) {
      console.log('[WebSocketStore] WebSocket is already open, returning.');
      return;
    }
    if (readyState === ReadyState.CONNECTING) {
      console.log('[WebSocketStore] WebSocket is already connecting, returning.');
      return;
    }
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.warn('[WebSocketStore] Max reconnection attempts reached. Not attempting to connect.');
      set({ readyState: ReadyState.CLOSED, connectionStatus: getStatusString(ReadyState.CLOSED) });
      return;
    }

    // 기존 stompClient가 있다면 닫고 정리합니다.
    if (stompClient && (readyState === ReadyState.CLOSED || readyState === ReadyState.CLOSING)) {
      console.log('[WebSocketStore] Closing existing WebSocket before new connection attempt.');
      stompClient.disconnect(() => {
        set({ stompClient: null, readyState: ReadyState.UNINSTANTIATED, connectionStatus: getStatusString(ReadyState.UNINSTANTIATED) });
      });
    } else if (stompClient) {
        console.warn('[WebSocketStore] Unexpected WebSocket state, disconnecting existing stompClient.');
        stompClient.disconnect(() => {
          set({ stompClient: null, readyState: ReadyState.UNINSTANTIATED, connectionStatus: getStatusString(ReadyState.UNINSTANTIATED) });
        });
    }

    set({ readyState: ReadyState.CONNECTING, connectionStatus: getStatusString(ReadyState.CONNECTING) });
    console.log('[WebSocketStore] Setting readyState to CONNECTING.');

    // SockJS를 사용하여 WebSocket 연결
    const socket = new SockJS(url);
    const newStompClient = Stomp.over(socket);
    newStompClient.debug = null; // Stomp.js 디버그 로그 비활성화

    // JWT 토큰 가져오기
    const accessToken = useAuthStore.getState().accessToken;
    const headers = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};

    newStompClient.connect(
      headers, // JWT 토큰을 헤더에 포함
      () => {
        console.log('>>>> [WebSocket] Connection established. Setting readyState to OPEN.');
        set({ readyState: ReadyState.OPEN, connectionStatus: getStatusString(ReadyState.OPEN), stompClient: newStompClient, reconnectAttempts: 0 }); // Reset attempts on success
      },
      (error: Stomp.Frame | CloseEvent) => {
        console.error('>>>> [WebSocket] Connection error:', error);
        set((state) => {
          const nextAttempts = state.reconnectAttempts + 1;
          const delay = Math.min(1000 * Math.pow(2, nextAttempts), 30000); // Exponential backoff, max 30s

          if (nextAttempts < state.maxReconnectAttempts) {
            console.log(`>>>> [WebSocket] Attempting to reconnect in ${delay / 1000} seconds (Attempt ${nextAttempts}/${state.maxReconnectAttempts}).`);
            const timeoutId = setTimeout(() => get().connect(url), delay); // Use get().connect to get the latest connect function
            return {
              readyState: ReadyState.CLOSED, // Temporarily set to CLOSED while waiting for reconnect
              connectionStatus: getStatusString(ReadyState.CLOSED),
              stompClient: null,
              reconnectAttempts: nextAttempts,
              reconnectTimeoutId: timeoutId,
            };
          } else {
            console.error('>>>> [WebSocket] Max reconnection attempts reached. Connection failed permanently.');
            return {
              readyState: ReadyState.CLOSED,
              connectionStatus: getStatusString(ReadyState.CLOSED),
              stompClient: null,
              reconnectAttempts: nextAttempts,
              reconnectTimeoutId: null,
            };
          }
        });

        if (error instanceof CloseEvent) {
          console.log(`>>>> [WebSocket] Connection closed due to error. Code: ${error.code}, Reason: ${error.reason}`);
        } else if (error instanceof Stomp.Frame) {
          console.log(`>>>> [WebSocket] STOMP error frame: ${error.body}`);
        }
      }
    );

    set({ stompClient: newStompClient }); // stompClient 인스턴스 저장
    console.log('[WebSocketStore] New stompClient instance set in store.');
  },

  disconnect: () => {
    const { stompClient, readyState, reconnectTimeoutId } = get();
    console.log(`[WebSocketStore] disconnect called. Current ReadyState: ${readyState}`);

    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId);
      set({ reconnectTimeoutId: null });
    }

    if (stompClient && stompClient.connected) { // stompClient.connected 확인
      stompClient.disconnect(() => {
        set({ readyState: ReadyState.CLOSED, connectionStatus: getStatusString(ReadyState.CLOSED), stompClient: null, reconnectAttempts: 0 });
        console.log('[WebSocketStore] StompClient disconnected. Setting readyState to CLOSED.');
      });
    } else {
      set({ readyState: ReadyState.CLOSED, connectionStatus: getStatusString(ReadyState.CLOSED), stompClient: null, reconnectAttempts: 0 });
      console.log('[WebSocketStore] StompClient was not connected, setting readyState to CLOSED.');
    }
  },

  sendMessage: (destination: string, body: string, headers?: any) => {
    const { stompClient, readyState } = get();
    if (stompClient && stompClient.connected && readyState === ReadyState.OPEN) { // stompClient.connected 확인
      stompClient.send(destination, headers, body); // destination, headers, body
      console.log(`[WebSocketStore] Message sent to ${destination}: ${body}`);
    } else {
      console.warn('>>>> [WebSocket] StompClient is not open. Cannot send message.');
    }
  },

  subscribe: (destination: string, callback: (message: Stomp.Message) => void, headers?: any) => {
    const { stompClient, readyState } = get();
    if (stompClient && stompClient.connected && readyState === ReadyState.OPEN) {
      return stompClient.subscribe(destination, callback, headers);
    } else {
      console.warn('>>>> [WebSocket] StompClient is not open. Cannot subscribe.');
      return undefined;
    }
  },

  unsubscribe: (subscription: Stomp.Subscription) => {
    if (subscription) {
      subscription.unsubscribe();
      console.log(`[WebSocketStore] Unsubscribed from ${subscription.id}`);
    }
  },

  resetReconnectAttempts: () => {
    set({ reconnectAttempts: 0 });
  },
}));

export default useWebSocketStore;
