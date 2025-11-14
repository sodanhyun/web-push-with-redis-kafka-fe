import { useState, useEffect, useCallback } from 'react';
import { startCrawling as apiStartCrawling } from '../../api/crawlingApi';
import { sendPushNotification } from '../../api/pushApi';
import useWebSocketStore, { ReadyState } from '../../store/useWebSocketStore';
import useCrawling from '../../hooks/useCrawling';
import Stomp from 'stompjs'; // Stomp 타입 임포트
import useAuthStore from '../../store/useAuthStore'; // useAuthStore 임포트

/**
 * @function CrawlingTable
 * @description 웹소켓 통신을 통해 실시간 크롤링 진행 상황을 표시하고,
 *              테스트 푸시 알림을 전송하는 기능을 제공하는 React 함수형 컴포넌트입니다.
 */
const CrawlingTable: React.FC = () => {
    const userId = useAuthStore((state) => state.userId); // useAuthStore에서 userId 가져오기
    
    // Get generic WebSocket state and actions
    const { readyState, connect, disconnect, connectionStatus, subscribe, unsubscribe, reconnectAttempts } = useWebSocketStore(); // subscribe, unsubscribe, reconnectAttempts 추가
    
    // Get crawling-specific state and actions from the custom hook
    const { 
        messages, 
        progress, 
        isCrawling, 
        showCompletionMessage, 
        handleWebSocketMessage, 
        resetCrawlingState,
        setIsCrawling, // Get the setter for isCrawling
    } = useCrawling();

    const [testPushMessage, setTestPushMessage] = useState("테스트 푸시 알림입니다.");

    // connect 함수 호출 로직을 useCallback으로 래핑
    const setupWebSocketConnection = useCallback(() => {
        console.log('setupWebSocketConnection called. Current userId:', userId);
        // Only attempt to connect if not already connecting or in a reconnection cycle
        if (userId && (readyState === ReadyState.UNINSTANTIATED || readyState === ReadyState.CLOSED) && reconnectAttempts === 0) {
            const protocol = window.location.protocol;
            // 백엔드 WebSocketConfig에서 설정한 STOMP 엔드포인트 URL
            // SockJS는 /ws 엔드포인트를 사용하고, STOMP는 그 위에서 동작합니다.
            const wsUrl = `${protocol}//${window.location.host}/ws`; 
            console.log('Attempting to connect to WebSocket with URL:', wsUrl);
            connect(wsUrl); // onMessageCallback 파라미터 제거
        } else if (!userId) {
            console.log('userId is null or undefined, disconnecting WebSocket.');
            disconnect();
        }
    }, [userId, connect, disconnect, readyState, reconnectAttempts]); // handleWebSocketMessage 제거

    useEffect(() => {
        console.log('CrawlingTable useEffect triggered.');
        setupWebSocketConnection();

        let subscription: Stomp.Subscription | undefined;

        if (readyState === ReadyState.OPEN && userId) {
            // 웹소켓 연결이 OPEN 상태일 때만 구독
            const destination = `/topic/crawling-progress`; // 공통 토픽으로 변경
            console.log(`Subscribing to ${destination}`);
            subscription = subscribe(destination, (message: Stomp.Message) => {
                const parsedMessage = JSON.parse(message.body);
                console.log("Parsed WebSocket message in CrawlingTable:", parsedMessage); // 추가
                if (parsedMessage.userId === userId) { // 현재 로그인한 사용자의 메시지만 필터링
                    handleWebSocketMessage(new MessageEvent('message', { data: message.body }));
                }
            });
        }

        return () => {
            console.log('CrawlingTable useEffect cleanup.');
            if (subscription) {
                unsubscribe(subscription);
                console.log(`Unsubscribed from ${subscription.id}`);
            }
            // disconnect(); // <-- 이 부분을 제거합니다.
        };
    }, [setupWebSocketConnection, disconnect, readyState, userId, subscribe, unsubscribe, reconnectAttempts]); // handleWebSocketMessage 제거

    const handleStartCrawling = async () => {
        resetCrawlingState(); // Reset crawling-specific state
        try {
            await apiStartCrawling(); // userId 인자 제거
        } catch (error) {
            console.error("크롤링 시작 실패:", error);
            setIsCrawling(false); // If API call fails, set isCrawling to false
        }
    };
    
    const handleSendTestPushNotification = async () => {
        if (testPushMessage) { // userId 조건 제거
            try {
                await sendPushNotification(testPushMessage); // userId 인자 제거
            } catch (error) {
                console.error("테스트 푸시 알림 전송 실패:", error);
                alert("테스트 푸시 알림 전송 실패!");
            }
        } else {
            alert("메시지를 입력해주세요."); // 사용자 ID 관련 메시지 제거
        }
    };

    return (
        <div className="crawling-test-container">
            <h2>WebSocket Crawling Test</h2>
            <p>WebSocket Status: <strong>{connectionStatus}</strong></p>

            <div style={{ marginTop: '20px' }}>
                <input
                    type="text"
                    value={testPushMessage}
                    onChange={(e) => setTestPushMessage(e.target.value)}
                    placeholder="테스트 푸시 메시지 입력"
                    style={{ marginRight: '10px', padding: '8px' }}
                />
                <button onClick={handleSendTestPushNotification} className="crawling-btn" disabled={!userId}> {/* userId가 없으면 비활성화 */}
                    테스트 푸시 알림 보내기
                </button>
            </div>
            
            <button onClick={handleStartCrawling} disabled={isCrawling || readyState !== ReadyState.OPEN || !userId}> {/* userId가 없으면 비활성화 */}
                {isCrawling ? '크롤링 중...' : '크롤링 시작'}
            </button>
            {readyState !== ReadyState.OPEN && <p style={{ color: 'red' }}>WebSocket이 연결되지 않았습니다.</p>}
            
            {(isCrawling || showCompletionMessage) && (
                <div className="progress-container">
                    <progress value={progress} max="100"></progress>
                    <span>{progress}%</span>
                </div>
            )}
            {showCompletionMessage && <h3 style={{ color: 'green', textAlign: 'center' }}>크롤링 완료!</h3>}
            <table className="crawling-table">
                <thead>
                    <tr>
                        <th style={{ width: '20%' }}>제목</th>
                        <th style={{ width: '60%' }}>내용</th>
                        <th style={{ width: '20%' }}>상태</th>
                    </tr>
                </thead>
                <tbody>
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