/**
 * @file CrawlingTable.tsx
 * @description 웹소켓(STOMP over SockJS) 통신을 통해 실시간 크롤링 진행 상황을 표시하고,
 *              테스트 푸시 알림을 전송하는 기능을 제공하는 React 함수형 컴포넌트입니다.
 *              현재 로그인한 사용자에게만 크롤링 진행 상황 메시지가 전달됩니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { startCrawling as apiStartCrawling } from '../../api/crawlingApi';
import { sendPushNotification } from '../../api/pushApi';
import useWebSocketStore, { ReadyState } from '../../store/useWebSocketStore';
import useCrawling from '../../hooks/useCrawling';
import Stomp from 'stompjs'; // Stomp 타입 임포트 (Stomp.Message 타입 사용을 위함)
import useAuthStore from '../../store/useAuthStore'; // 사용자 인증 정보 (userId)를 가져오기 위한 Zustand 스토어

/**
 * @function CrawlingTable
 * @description 실시간 크롤링 진행 상황 및 테스트 푸시 알림 기능을 제공하는 컴포넌트입니다.
 */
const CrawlingTable: React.FC = () => {
    // useAuthStore에서 현재 로그인한 사용자의 ID를 가져옵니다.
    const userId = useAuthStore((state) => state.userId);
    
    // useWebSocketStore에서 웹소켓 연결 상태 및 관련 액션들을 가져옵니다.
    const { readyState, connect, disconnect, connectionStatus, subscribe, unsubscribe, reconnectAttempts } = useWebSocketStore();
    
    // useCrawling 커스텀 훅에서 크롤링 관련 상태와 액션들을 가져옵니다.
    const { 
        messages, 
        progress, 
        isCrawling, 
        showCompletionMessage, 
        handleWebSocketMessage, 
        resetCrawlingState,
        setIsCrawling,
    } = useCrawling();

    // 테스트 푸시 알림 메시지를 관리하는 상태
    const [testPushMessage, setTestPushMessage] = useState("테스트 푸시 알림입니다.");

    /**
     * @function setupWebSocketConnection
     * @description 웹소켓 연결을 설정하는 함수입니다. userId가 유효하고 연결이 필요할 때만 연결을 시도합니다.
     *              useCallback으로 래핑하여 불필요한 재생성을 방지합니다.
     */
    const setupWebSocketConnection = useCallback(() => {
        // userId가 존재하고, 연결이 안 되어 있거나 닫힌 상태이며, 재연결 시도 중이 아닐 때만 연결을 시도합니다.
        if (userId && (readyState === ReadyState.UNINSTANTIATED || readyState === ReadyState.CLOSED) && reconnectAttempts === 0) {
            const protocol = window.location.protocol;
            // 백엔드 WebSocketConfig에서 설정한 STOMP 엔드포인트 URL을 구성합니다.
            // SockJS는 /ws 엔드포인트를 사용하고, STOMP는 그 위에서 동작합니다.
            const wsUrl = `${protocol}//${window.location.host}/ws`; 
            connect(wsUrl); // useWebSocketStore의 connect 함수를 호출하여 연결을 시작합니다.
        } else if (!userId) {
            // userId가 없으면 웹소켓 연결을 해제합니다.
            disconnect();
        }
    }, [userId, connect, disconnect, readyState, reconnectAttempts]);

    /**
     * @hook useEffect
     * @description 컴포넌트 마운트 시 웹소켓 연결을 설정하고, 연결 상태 변화에 따라 STOMP 구독을 관리합니다.
     *              컴포넌트 언마운트 시 구독을 해지하고 정리 작업을 수행합니다.
     */
    useEffect(() => {
        setupWebSocketConnection(); // 웹소켓 연결 설정 함수 호출

        let subscription: Stomp.Subscription | undefined;

        // 웹소켓 연결이 OPEN 상태이고 userId가 유효할 때만 STOMP 구독을 시도합니다.
        if (readyState === ReadyState.OPEN && userId) {
            // 백엔드에서 특정 사용자에게 메시지를 보내는 큐를 구독합니다.
            // STOMP 브로커가 /user/{userId}/queue/crawling-progress 형태로 메시지를 라우팅합니다.
            const destination = `/user/queue/crawling-progress`;
            subscription = subscribe(destination, (message: Stomp.Message) => {
                const parsedMessage = JSON.parse(message.body);
                // STOMP 브로커가 이미 특정 유저에게만 메시지를 전달하므로, 클라이언트 측에서 userId 필터링은 필요 없습니다.
                handleWebSocketMessage(new MessageEvent('message', { data: message.body }));
            });
        }

        // 클린업 함수: 컴포넌트 언마운트 시 또는 의존성 변경 시 실행됩니다.
        return () => {
            if (subscription) {
                unsubscribe(subscription); // 활성화된 구독이 있다면 해지합니다.
            }
        };
    }, [setupWebSocketConnection, disconnect, readyState, userId, subscribe, unsubscribe, reconnectAttempts, handleWebSocketMessage]); // 의존성 배열

    /**
     * @function handleStartCrawling
     * @description "크롤링 시작" 버튼 클릭 시 호출되는 함수입니다.
     *              크롤링 상태를 초기화하고 백엔드 API를 호출하여 크롤링 작업을 시작합니다.
     */
    const handleStartCrawling = async () => {
        resetCrawlingState(); // 크롤링 관련 상태 (메시지, 진행률 등)를 초기화합니다.
        try {
            await apiStartCrawling(); // 백엔드에 크롤링 시작 API를 호출합니다.
        } catch (error) {
            console.error("크롤링 시작 실패:", error);
            setIsCrawling(false); // API 호출 실패 시 isCrawling 상태를 false로 설정합니다.
        }
    };
    
    /**
     * @function handleSendTestPushNotification
     * @description "테스트 푸시 알림 보내기" 버튼 클릭 시 호출되는 함수입니다.
     *              입력된 메시지로 백엔드 API를 호출하여 테스트 푸시 알림을 전송합니다.
     */
    const handleSendTestPushNotification = async () => {
        if (testPushMessage) {
            try {
                await sendPushNotification(testPushMessage); // 백엔드에 테스트 푸시 알림 전송 API를 호출합니다.
            } catch (error) {
                console.error("테스트 푸시 알림 전송 실패:", error);
                alert("테스트 푸시 알림 전송 실패!");
            }
        } else {
            alert("메시지를 입력해주세요.");
        }
    };

    return (
        <div className="crawling-test-container">
            <h2>WebSocket Crawling Test</h2>
            {/* 현재 웹소켓 연결 상태를 표시합니다. */}
            <p>WebSocket Status: <strong>{connectionStatus}</strong></p>

            {/* 테스트 푸시 알림 전송 섹션 */}
            <div style={{ marginTop: '20px' }}>
                <input
                    type="text"
                    value={testPushMessage}
                    onChange={(e) => setTestPushMessage(e.target.value)}
                    placeholder="테스트 푸시 메시지 입력"
                    style={{ marginRight: '10px', padding: '8px' }}
                />
                {/* userId가 없거나 웹소켓이 연결되지 않으면 버튼을 비활성화합니다. */}
                <button onClick={handleSendTestPushNotification} className="crawling-btn" disabled={!userId || readyState !== ReadyState.OPEN}>
                    테스트 푸시 알림 보내기
                </button>
            </div>
            
            {/* 크롤링 시작 버튼 */}
            {/* 크롤링 중이거나, 웹소켓이 연결되지 않았거나, userId가 없으면 버튼을 비활성화합니다. */}
            <button onClick={handleStartCrawling} disabled={isCrawling || readyState !== ReadyState.OPEN || !userId}>
                {isCrawling ? '크롤링 중...' : '크롤링 시작'}
            </button>
            {/* 웹소켓이 연결되지 않았을 때 경고 메시지를 표시합니다. */}
            {readyState !== ReadyState.OPEN && <p style={{ color: 'red' }}>WebSocket이 연결되지 않았습니다.</p>}
            
            {/* 크롤링 진행률 바와 완료 메시지 */}
            {(isCrawling || showCompletionMessage) && (
                <div className="progress-container">
                    <progress value={progress} max="100"></progress>
                    <span>{progress}%</span>
                </div>
            )}
            {showCompletionMessage && <h3 style={{ color: 'green', textAlign: 'center' }}>크롤링 완료!</h3>}
            
            {/* 크롤링 메시지 테이블 */}
            <table className="crawling-table">
                <thead>
                    <tr>
                        <th style={{ width: '20%' }}>제목</th>
                        <th style={{ width: '60%' }}>내용</th>
                        <th style={{ width: '20%' }}>상태</th>
                    </tr>
                </thead>
                <tbody>
                    {/* 수신된 크롤링 메시지들을 테이블 행으로 렌더링합니다. */}
                    {messages.map((msg, index) => (
                        <tr key={index}>
                            <td>{msg.title}</td>
                            <td>{msg.content}</td>
                            <td>{msg.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CrawlingTable;
