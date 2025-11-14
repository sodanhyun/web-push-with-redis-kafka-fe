/**
 * @file useWebSocketStore.ts
 * @description Zustand를 사용하여 WebSocket (STOMP over SockJS) 연결 상태, 재연결 로직,
 *              메시지 전송 및 구독을 관리하는 중앙 상태 스토어입니다.
 *              프론트엔드와 백엔드 간의 실시간 통신을 위한 모든 웹소켓 관련 로직을 캡슐화합니다.
 */

import { create } from 'zustand';
import SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';
import useAuthStore from './useAuthStore'; // 사용자 인증 정보 (JWT 토큰)를 가져오기 위한 Zustand 스토어

/**
 * @enum ReadyState
 * @description 웹소켓 연결의 현재 상태를 나타내는 열거형입니다.
 */
export const enum ReadyState {
  CONNECTING = 0,     // 연결 시도 중
  OPEN = 1,           // 연결 성공 및 활성화 상태
  CLOSING = 2,        // 연결 종료 중
  CLOSED = 3,         // 연결 끊김
  UNINSTANTIATED = 4, // 초기 상태 (연결 시도 전)
}

/**
 * @interface WebSocketState
 * @description useWebSocketStore에서 관리하는 상태와 액션의 타입을 정의합니다.
 */
interface WebSocketState {
  stompClient: Stomp.Client | null;                      // Stomp 클라이언트 인스턴스
  readyState: ReadyState;                                // 웹소켓 연결 상태 (ReadyState enum 참조)
  connectionStatus: string;                              // 사용자에게 보여줄 연결 상태 문자열
  reconnectAttempts: number;                             // 현재 재연결 시도 횟수
  maxReconnectAttempts: number;                          // 최대 재연결 시도 횟수
  reconnectTimeoutId: NodeJS.Timeout | null;             // 재연결 타이머 ID
  connect: (url: string) => void;                        // 웹소켓 연결을 시작하는 함수
  disconnect: () => void;                                // 웹소켓 연결을 종료하는 함수
  sendMessage: (destination: string, body: string, headers?: { [key: string]: string }) => void; // 메시지를 전송하는 함수
  subscribe: (destination: string, callback: (message: Stomp.Message) => void, headers?: { [key: string]: string }) => Stomp.Subscription | undefined; // 특정 목적지(topic/queue)를 구독하는 함수
  unsubscribe: (subscription: Stomp.Subscription) => void; // 구독을 해지하는 함수
  resetReconnectAttempts: () => void;                    // 재연결 시도 횟수를 초기화하는 함수
}

/**
 * @function getStatusString
 * @description ReadyState 열거형 값에 따라 사용자 친화적인 연결 상태 문자열을 반환합니다.
 * @param {ReadyState} readyState - 현재 웹소켓 연결 상태
 * @returns {string} 연결 상태를 나타내는 문자열
 */
const getStatusString = (readyState: ReadyState): string => {
  return {
    [ReadyState.CONNECTING]: '연결 중...',
    [ReadyState.OPEN]: '연결됨',
    [ReadyState.CLOSING]: '연결 종료 중...',
    [ReadyState.CLOSED]: '연결 끊김',
    [ReadyState.UNINSTANTIATED]: '연결 안 됨',
  }[readyState];
};

/**
 * @hook useWebSocketStore
 * @description Zustand 스토어를 사용하여 웹소켓 연결 및 STOMP 통신을 전역적으로 관리합니다.
 *              애플리케이션 전반에서 웹소켓 연결 상태를 공유하고, 메시지를 주고받는 기능을 제공합니다.
 */
const useWebSocketStore = create<WebSocketState>((set, get) => ({
  // 상태: 웹소켓 클라이언트 인스턴스
  stompClient: null,
  // 상태: 현재 웹소켓 연결 상태
  readyState: ReadyState.UNINSTANTIATED,
  // 상태: 사용자에게 표시할 연결 상태 메시지
  connectionStatus: getStatusString(ReadyState.UNINSTANTIATED),
  // 상태: 재연결 시도 횟수
  reconnectAttempts: 0,
  // 상태: 최대 재연결 시도 횟수 (이후에는 재연결 중단)
  maxReconnectAttempts: 5,
  // 상태: 재연결 타이머 ID
  reconnectTimeoutId: null,

  /**
   * @method connect
   * @description WebSocket 연결을 시작하고 STOMP 클라이언트를 초기화합니다.
   *              연결 실패 시 지수적 백오프(Exponential Backoff) 전략으로 재연결을 시도합니다.
   * @param {string} url - WebSocket 서버의 URL
   */
  connect: (url) => {
    const { stompClient, readyState, reconnectAttempts, maxReconnectAttempts, reconnectTimeoutId } = get();
    // 디버그 로그: console.log(`[WebSocketStore] connect called. URL: ${url}, Current ReadyState: ${readyState}, Attempts: ${reconnectAttempts}`);

    // 기존 재연결 타이머가 있다면 취소
    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId);
      set({ reconnectTimeoutId: null });
    }

    if (readyState === ReadyState.OPEN) {
      // 디버그 로그: console.log('[WebSocketStore] WebSocket is already open, returning.');
      return;
    }
    if (readyState === ReadyState.CONNECTING) {
      // 디버그 로그: console.log('[WebSocketStore] WebSocket is already connecting, returning.');
      return;
    }
    // 최대 재연결 시도 횟수에 도달하면 연결 중단
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.warn('[WebSocketStore] Max reconnection attempts reached. Not attempting to connect.');
      set({ readyState: ReadyState.CLOSED, connectionStatus: getStatusString(ReadyState.CLOSED) });
      return;
    }

    // 기존 stompClient가 유효하지 않거나 닫힌 상태 (stompClient.connected를 사용하여 연결 여부 확인)라면 정리합니다.
    if (stompClient && (readyState === ReadyState.CLOSED || readyState === ReadyState.CLOSING || !stompClient.connected)) {
      // 디버그 로그: console.log('[WebSocketStore] Closing existing WebSocket before new connection attempt.');
      stompClient.disconnect(() => {
        set({ stompClient: null, readyState: ReadyState.UNINSTANTIATED, connectionStatus: getStatusString(ReadyState.UNINSTANTIATED) });
      });
    } else if (stompClient) {
        // 디버그 로그: console.warn('[WebSocketStore] Unexpected WebSocket state, disconnecting existing stompClient.');
        stompClient.disconnect(() => {
          set({ stompClient: null, readyState: ReadyState.UNINSTANTIATED, connectionStatus: getStatusString(ReadyState.UNINSTANTIATED) });
        });
    }

    set({ readyState: ReadyState.CONNECTING, connectionStatus: getStatusString(ReadyState.CONNECTING) });
    // 디버그 로그: console.log('[WebSocketStore] Setting readyState to CONNECTING.');

    // JWT 토큰 가져오기 (HTTP 핸드셰이크 및 STOMP CONNECT 프레임에 사용)
    const accessToken = useAuthStore.getState().accessToken;
    const headers: { [key: string]: string } = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};

    // SockJS를 사용하여 WebSocket 연결을 설정합니다.
    // SockJS는 WebSocket을 지원하지 않는 환경에서 HTTP 폴백을 제공합니다.
    // HTTP 핸드셰이크 시 JWT 토큰을 Authorization 헤더에 포함하여 전달합니다.
    const socket = new SockJS(url, null, { headers: headers });
    // SockJS 위에 STOMP 프로토콜 레이어를 얹습니다.
    const newStompClient = Stomp.over(socket);
    // Stomp.js 라이브러리의 디버그 로그를 비활성화합니다.
    newStompClient.debug = null;

    // STOMP 서버에 연결합니다.
    // 첫 번째 인자인 headers는 STOMP CONNECT 프레임에 포함됩니다.
    newStompClient.connect(
      headers,
      // 연결 성공 콜백
      () => {
        // 디버그 로그: console.log('>>>> [WebSocket] Connection established. Setting readyState to OPEN.');
        set({
          readyState: ReadyState.OPEN,
          connectionStatus: getStatusString(ReadyState.OPEN),
          stompClient: newStompClient,
          reconnectAttempts: 0 // 연결 성공 시 재연결 시도 횟수 초기화
        });
      },
      // 연결 에러 콜백
      (error: Stomp.Frame | CloseEvent) => {
        console.error('>>>> [WebSocket] Connection error:', error);
        set((state) => {
          // 지수적 백오프(Exponential Backoff) 전략으로 재연결 딜레이 계산
          const nextAttempts = state.reconnectAttempts + 1;
          const delay = Math.min(1000 * Math.pow(2, nextAttempts), 30000); // 1초, 2초, 4초... 최대 30초 (최대 5회 시도)

          // 최대 재연결 시도 횟수 미만이면 재연결 시도
          if (nextAttempts < state.maxReconnectAttempts) {
            console.log(`>>>> [WebSocket] Attempting to reconnect in ${delay / 1000} seconds (Attempt ${nextAttempts}/${state.maxReconnectAttempts}).`);
            // setTimeout을 사용하여 일정 시간 후 connect 함수를 다시 호출
            const timeoutId = setTimeout(() => get().connect(url), delay); // get().connect를 사용하여 최신 connect 함수 참조
            return {
              readyState: ReadyState.CLOSED, // 재연결 대기 중에는 CLOSED 상태로 표시
              connectionStatus: getStatusString(ReadyState.CLOSED),
              stompClient: null,
              reconnectAttempts: nextAttempts,
              reconnectTimeoutId: timeoutId,
            };
          } else {
            // 최대 재연결 시도 횟수 도달, 영구적인 연결 실패
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

        // 에러 타입에 따라 상세 로그 출력
        if (error instanceof CloseEvent) {
          console.log(`>>>> [WebSocket] Connection closed due to error. Code: ${error.code}, Reason: ${error.reason}`);
        } else if (error instanceof Stomp.Frame) {
          console.log(`>>>> [WebSocket] STOMP error frame: ${error.body}`);
        }
      }
    );

    // 새로 생성된 stompClient 인스턴스를 스토어에 저장
    set({ stompClient: newStompClient });
    // 디버그 로그: console.log('[WebSocketStore] New stompClient instance set in store.');
  },

  /**
   * @method disconnect
   * @description 현재 WebSocket 연결을 종료합니다.
   *              진행 중인 재연결 시도가 있다면 취소합니다.
   */
  disconnect: () => {
    const { stompClient, readyState, reconnectTimeoutId } = get();
    // 디버그 로그: console.log(`[WebSocketStore] disconnect called. Current ReadyState: ${readyState}`);

    // 재연결 타이머가 있다면 취소
    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId);
      set({ reconnectTimeoutId: null });
    }

    // stompClient가 연결되어 있다면 연결 종료
    if (stompClient && stompClient.connected) {
      stompClient.disconnect(() => {
        set({
          readyState: ReadyState.CLOSED,
          connectionStatus: getStatusString(ReadyState.CLOSED),
          stompClient: null,
          reconnectAttempts: 0 // 연결 해제 시 재연결 시도 횟수 초기화
        });
        console.log('[WebSocketStore] StompClient disconnected. Setting readyState to CLOSED.');
      });
    } else {
      // stompClient가 연결되어 있지 않은 경우 바로 상태 업데이트
      set({
        readyState: ReadyState.CLOSED,
        connectionStatus: getStatusString(ReadyState.CLOSED),
        stompClient: null,
        reconnectAttempts: 0
      });
      console.log('[WebSocketStore] StompClient was not connected, setting readyState to CLOSED.');
    }
  },

  /**
   * @method sendMessage
   * @description 특정 목적지(destination)로 메시지를 전송합니다.
   * @param {string} destination - 메시지를 전송할 STOMP 목적지 (예: `/app/message`)
   * @param {string} body - 메시지 본문
   * @param {{ [key: string]: string }} [headers] - 메시지와 함께 보낼 STOMP 헤더 (선택 사항)
   */
  sendMessage: (destination: string, body: string, headers?: { [key: string]: string }) => {
    const { stompClient, readyState } = get();
    // stompClient가 연결되어 있고 OPEN 상태일 때만 메시지 전송
    if (stompClient && stompClient.connected && readyState === ReadyState.OPEN) {
      stompClient.send(destination, headers || {}, body); // headers가 없을 경우 빈 객체 전달
      // 디버그 로그: console.log(`[WebSocketStore] Message sent to ${destination}: ${body}`);
    } else {
      console.warn('>>>> [WebSocket] StompClient is not open. Cannot send message.');
    }
  },

  /**
   * @method subscribe
   * @description 특정 목적지(destination)를 구독합니다.
   *              STOMP 브로커로부터 해당 목적지로 오는 메시지를 수신합니다.
   * @param {string} destination - 구독할 STOMP 목적지 (예: `/topic/crawling-progress` 또는 `/user/queue/messages`)
   * @param {(message: Stomp.Message) => void} callback - 메시지 수신 시 실행될 콜백 함수
   * @param {{ [key: string]: string }} [headers] - 구독과 함께 보낼 STOMP 헤더 (선택 사항)
   * @returns {Stomp.Subscription | undefined} STOMP 구독 객체 또는 undefined (연결되지 않은 경우)
   */
  subscribe: (destination: string, callback: (message: Stomp.Message) => void, headers?: { [key: string]: string }) => {
    const { stompClient, readyState } = get();
    // stompClient가 연결되어 있고 OPEN 상태일 때만 구독 가능
    if (stompClient && stompClient.connected && readyState === ReadyState.OPEN) {
      return stompClient.subscribe(destination, callback, headers);
    } else {
      console.warn('>>>> [WebSocket] StompClient is not open. Cannot subscribe.');
      return undefined;
    }
  },

  /**
   * @method unsubscribe
   * @description 특정 구독을 해지합니다.
   * @param {Stomp.Subscription} subscription - 해지할 STOMP 구독 객체
   */
  unsubscribe: (subscription: Stomp.Subscription) => {
    if (subscription) {
      subscription.unsubscribe();
      console.log(`[WebSocketStore] Unsubscribed from ${subscription.id}`);
    }
  },

  /**
   * @method resetReconnectAttempts
   * @description 재연결 시도 횟수를 초기화합니다.
   */
  resetReconnectAttempts: () => {
    set({ reconnectAttempts: 0 });
  },
}));

export default useWebSocketStore;