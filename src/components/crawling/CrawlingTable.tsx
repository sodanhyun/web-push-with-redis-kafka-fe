import { useState, useEffect, useCallback, useMemo } from 'react';
import { startCrawling } from '../../api/crawlingApi';
import { sendPushNotification } from '../../api/pushApi';
import useUserStore from '../../store/useUserStore';
import useWebSocket, { ReadyState } from '../../hooks/useWebSocket'; // ReadyState 임포트

/**
 * @interface CrawlingData
 * @description 웹소켓을 통해 수신되는 크롤링 데이터의 구조를 정의합니다.
 */
interface CrawlingData {
    title: string;
    content: string;
    status: string;
}

/**
 * @function CrawlingTable
 * @description 웹소켓 통신을 통해 실시간 크롤링 진행 상황을 표시하고,
 *              테스트 푸시 알림을 전송하는 기능을 제공하는 React 함수형 컴포넌트입니다.
 */
const CrawlingTable: React.FC = () => {
    const userId = useUserStore((state) => state.userId);

    const [messages, setMessages] = useState<CrawlingData[]>([]);
    const [progress, setProgress] = useState(0);
    const [isCrawling, setIsCrawling] = useState(false);
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);
    const [testPushMessage, setTestPushMessage] = useState("테스트 푸시 알림입니다.");

    // 1. 웹소켓 URL 생성
    const wsUrl = useMemo(() => {
        if (!userId) return null;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const VITE_WS_URL = '/ws'; // 이전에 확인된 경로
        return `${protocol}//${window.location.host}${VITE_WS_URL}/${userId}`;
    }, [userId]);

    // 2. 새로운 웹소켓 훅 사용
    const { readyState, lastMessage } = useWebSocket(wsUrl, {
        onMessage: useCallback((event: MessageEvent) => {
            try {
                const data: CrawlingData = JSON.parse(event.data);
                console.log("Received WebSocket message:", data);

                if (data.status === 'complete') {
                    setProgress(100);
                    setIsCrawling(false);
                    setShowCompletionMessage(true);
                } else if (data.status === 'in_progress') {
                    setMessages(prevMessages => [...prevMessages, data]);
                    setProgress(prev => Math.min(prev + 10, 100));
                }
            } catch (err) {
                console.error("Failed to parse WebSocket message:", err);
            }
        }, []),
        onOpen: useCallback(() => {
            console.log(`WebSocket connected for user: ${userId}`);
        }, [userId]),
        onClose: useCallback((event: CloseEvent) => {
            console.log('WebSocket disconnected');
            // 재연결 로직이 없으므로, 이제 콘솔에서 연결 종료 이벤트를 통해 원인을 파악할 수 있습니다.
            console.log(`Close code: ${event.code}, reason: ${event.reason}`);
        }, []),
        onError: useCallback((e: Event) => {
            console.error('WebSocket error event:', e);
        }, []),
    });

    // lastMessage에 대한 useEffect는 onMessage 콜백에서 로직을 처리하므로 중복되어 제거 가능
    // 필요시 추가 로직 구현
    useEffect(() => {
        if (progress === 100) {
            setIsCrawling(false);
            setShowCompletionMessage(true);
        }
    }, [progress]);

    const handleStartCrawling = async () => {
        setMessages([]);
        setProgress(0);
        setShowCompletionMessage(false);
        setIsCrawling(true);
        await startCrawling(userId);
    };
    
    const handleSendTestPushNotification = async () => {
        if (userId && testPushMessage) {
            try {
                await sendPushNotification(userId, testPushMessage);
            } catch (error) {
                console.error("테스트 푸시 알림 전송 실패:", error);
                alert("테스트 푸시 알림 전송 실패!");
            }
        } else {
            alert("사용자 ID와 메시지를 입력해주세요.");
        }
    };

    // 3. readyState에 따른 연결 상태 메시지 생성
    const connectionStatus = {
        [ReadyState.CONNECTING]: '연결 중...',
        [ReadyState.OPEN]: '연결됨',
        [ReadyState.CLOSING]: '연결 종료 중...',
        [ReadyState.CLOSED]: '연결 끊김',
        [ReadyState.UNINSTANTIATED]: '연결 안 됨',
    }[readyState];

    return (
        <div className="crawling-test-container">
            <h2>WebSocket Crawling Test</h2>
            <p>WebSocket Status: <strong>{connectionStatus}</strong></p> {/* 연결 상태 표시 */}

            <div style={{ marginTop: '20px' }}>
                <input
                    type="text"
                    value={testPushMessage}
                    onChange={(e) => setTestPushMessage(e.target.value)}
                    placeholder="테스트 푸시 메시지 입력"
                    style={{ marginRight: '10px', padding: '8px' }}
                />
                <button onClick={handleSendTestPushNotification} className="crawling-btn">
                    테스트 푸시 알림 보내기
                </button>
            </div>
            {/* 4. disabled 상태 확인 업데이트 */}
            <button onClick={handleStartCrawling} disabled={isCrawling || readyState !== ReadyState.OPEN} className="crawling-btn">
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