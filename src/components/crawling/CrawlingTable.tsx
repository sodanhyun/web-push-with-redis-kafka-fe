import { useState, useEffect, useCallback } from 'react';
import { startCrawling as apiStartCrawling } from '../../api/crawlingApi';
import { sendPushNotification } from '../../api/pushApi';
import useUserStore from '../../store/useUserStore';
import useWebSocketStore, { ReadyState } from '../../store/useWebSocketStore';
import useCrawling from '../../hooks/useCrawling';

/**
 * @function CrawlingTable
 * @description 웹소켓 통신을 통해 실시간 크롤링 진행 상황을 표시하고,
 *              테스트 푸시 알림을 전송하는 기능을 제공하는 React 함수형 컴포넌트입니다.
 */
const CrawlingTable: React.FC = () => {
    const userId = useUserStore((state) => state.userId);
    
    // Get generic WebSocket state and actions
    const { readyState, connect, disconnect, connectionStatus } = useWebSocketStore();
    
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
        if (userId) {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/${userId}`;
            console.log('Attempting to connect to WebSocket with URL:', wsUrl);
            connect(wsUrl, handleWebSocketMessage);
        } else {
            console.log('userId is null or undefined, disconnecting WebSocket.');
            disconnect();
        }
    }, [userId, connect, disconnect, handleWebSocketMessage]);

    useEffect(() => {
        console.log('CrawlingTable useEffect triggered.');
        setupWebSocketConnection();

        return () => {
            console.log('CrawlingTable useEffect cleanup.');
            disconnect();
        };
    }, [setupWebSocketConnection, disconnect]); // setupWebSocketConnection이 변경될 때마다 실행

    const handleStartCrawling = async () => {
        resetCrawlingState(); // Reset crawling-specific state
        try {
            await apiStartCrawling(userId);
        } catch (error) {
            console.error("크롤링 시작 실패:", error);
            setIsCrawling(false); // If API call fails, set isCrawling to false
        }
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
                <button onClick={handleSendTestPushNotification} className="crawling-btn">
                    테스트 푸시 알림 보내기
                </button>
            </div>
            
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