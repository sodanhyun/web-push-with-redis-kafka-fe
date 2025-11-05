import { useState, useEffect } from 'react'; // React 훅을 임포트합니다.
import { startCrawling } from '../api/crawlingApi'; // 크롤링 시작 API를 임포트합니다.
import { sendPushNotification } from '../api/pushApi'; // 테스트 푸시 알림 전송 API를 임포트합니다.

/**
 * @interface CrawlingData
 * @description 웹소켓을 통해 수신되는 크롤링 데이터의 구조를 정의합니다.
 */
interface CrawlingData {
    title: string; // 크롤링된 데이터의 제목
    content: string; // 크롤링된 데이터의 내용
}

/**
 * @interface WebSocketTestProps
 * @description WebSocketTest 컴포넌트의 props 타입을 정의합니다.
 */
interface WebSocketTestProps {
    userId: string; // 현재 로그인한 사용자의 ID
}

/**
 * @function WebSocketTest
 * @description 웹소켓 통신을 통해 실시간 크롤링 진행 상황을 표시하고,
 *              테스트 푸시 알림을 전송하는 기능을 제공하는 React 함수형 컴포넌트입니다.
 *
 * - 백엔드 웹소켓 서버와 연결하여 크롤링 데이터를 실시간으로 수신합니다.
 * - 크롤링 진행률을 프로그레스 바와 함께 표시합니다.
 * - 크롤링 시작 버튼과 테스트 푸시 알림 전송 버튼을 제공합니다.
 */
const WebSocketTest: React.FC<WebSocketTestProps> = ({ userId }) => {
    // 웹소켓을 통해 수신된 크롤링 메시지들을 저장하는 상태입니다.
    const [messages, setMessages] = useState<CrawlingData[]>([]);
    // 크롤링 진행률을 나타내는 상태 (0-100%).
    const [progress, setProgress] = useState(0);
    // 크롤링이 현재 진행 중인지 여부를 나타내는 상태입니다.
    const [isCrawling, setIsCrawling] = useState(false);
    // 크롤링 완료 메시지 표시 여부를 제어하는 상태입니다.
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);
    // 테스트 푸시 알림으로 보낼 메시지 내용을 저장하는 상태입니다.
    const [testPushMessage, setTestPushMessage] = useState("테스트 푸시 알림입니다.");
    
    const VITE_WS_URL = import.meta.env.VITE_WS_URL;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}${VITE_WS_URL}/${userId}`;

    /**
     * @useEffect
     * @description 컴포넌트 마운트 시 웹소켓 연결을 설정하고, 언마운트 시 연결을 해제합니다.
     *
     * - `userId`가 유효할 때만 웹소켓 연결을 시도합니다.
     * - 웹소켓 연결이 열리면 콘솔에 메시지를 로깅합니다.
     * - 웹소켓으로부터 메시지를 수신하면 JSON 파싱 후 `messages` 상태를 업데이트하고 `progress`를 증가시킵니다.
     * - 크롤링 완료 메시지(`status: 'complete'`)를 받으면 `progress`를 100%로 설정합니다.
     * - 웹소켓 연결이 닫히면 콘솔에 메시지를 로깅합니다.
     */
    useEffect(() => {
        // userId가 없으면 웹소켓 연결을 시도하지 않습니다.
        if (!userId) return;

        // 백엔드 웹소켓 서버에 연결합니다.
        const ws = new WebSocket(wsUrl);

        // 웹소켓 연결이 성공적으로 열렸을 때 실행됩니다.
        ws.onopen = () => {
            console.log(`WebSocket connected for user: ${userId}`);
        };

        // 웹소켓으로부터 메시지를 수신했을 때 실행됩니다.
        ws.onmessage = (event) => {
            // 수신된 데이터를 JSON으로 파싱합니다.
            const data = JSON.parse(event.data);
            // 데이터의 `status`가 'complete'이면 크롤링이 완료된 것으로 간주합니다.
            if (data.status === 'complete') {
                setProgress(100); // 진행률을 100%로 설정
            } else {
                // 일반 크롤링 데이터인 경우, 메시지 목록에 추가하고 진행률을 증가시킵니다.
                setMessages(prevMessages => [...prevMessages, data]);
                setProgress(prev => Math.min(prev + 10, 100)); // 진행률을 10%씩 증가시키되 100%를 초과하지 않도록 합니다.
            }
        };

        // 웹소켓 연결이 닫혔을 때 실행됩니다.
        ws.onclose = () => {
            console.log('WebSocket disconnected');
        };

        // 컴포넌트 언마운트 시 웹소켓 연결을 닫습니다.
        return () => {
            ws.close();
        };
    }, [userId]); // userId가 변경될 때마다 이 효과를 재실행합니다.

    /**
     * @async
     * @function handleStartCrawling
     * @description 크롤링 시작 버튼 클릭 핸들러.
     *
     * - 메시지 목록, 진행률, 완료 메시지 상태를 초기화합니다.
     * - `isCrawling` 상태를 true로 설정하여 버튼을 비활성화하고 로딩 상태를 표시합니다.
     * - `startCrawling` API를 호출하여 백엔드에 크롤링 시작을 요청합니다.
     */
    const handleStartCrawling = async () => {
        setMessages([]); // 기존 메시지 초기화
        setProgress(0); // 진행률 초기화
        setShowCompletionMessage(false); // 완료 메시지 숨김
        setIsCrawling(true); // 크롤링 시작 상태로 설정
        await startCrawling(userId); // 크롤링 API 호출
    };

    /**
     * @async
     * @function handleSendTestPushNotification
     * @description 테스트 푸시 알림 전송 버튼 클릭 핸들러.
     *
     * - `userId`와 `testPushMessage`가 유효한 경우에만 알림을 전송합니다.
     * - `sendPushNotification` API를 호출하여 백엔드에 테스트 푸시 알림 전송을 요청합니다.
     * - 성공 또는 실패 시 사용자에게 알림을 표시합니다.
     */
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

    /**
     * @useEffect
     * @description `progress` 상태가 100%가 되면 크롤링 완료 상태를 처리합니다.
     *
     * - `isCrawling`을 false로 설정하여 크롤링 중 상태를 해제합니다.
     * - `showCompletionMessage`를 true로 설정하여 완료 메시지를 표시합니다.
     */
    useEffect(() => {
        if (progress === 100) {
            setIsCrawling(false); // 크롤링 중 상태 해제
            setShowCompletionMessage(true); // 완료 메시지 표시
        }
    }, [progress]); // progress가 변경될 때마다 이 효과를 재실행합니다.

    return (
        <div className="crawling-test-container">
            <h2>WebSocket Crawling Test</h2>

            {/* 테스트 푸시 알림 전송 섹션 */}
            <div style={{ marginTop: '20px' }}>
                <input
                    type="text"
                    value={testPushMessage}
                    onChange={(e) => setTestPushMessage(e.target.value)} // 입력 필드 값 변경 핸들러
                    placeholder="테스트 푸시 메시지 입력"
                    style={{ marginRight: '10px', padding: '8px' }}
                />
                <button onClick={handleSendTestPushNotification} className="crawling-btn">
                    테스트 푸시 알림 보내기
                </button>
            </div>
            {/* 크롤링 시작 버튼 */}
            <button onClick={handleStartCrawling} disabled={isCrawling} className="crawling-btn">
                {isCrawling ? '크롤링 중...' : '크롤링 시작'}
            </button>
            {/* 크롤링 진행률 표시 */}
            {(isCrawling || showCompletionMessage) && (
                <div className="progress-container">
                    <progress value={progress} max="100"></progress> {/* 진행률 바 */}
                    <span>{progress}%</span> {/* 진행률 텍스트 */}
                </div>
            )}
            {/* 크롤링 완료 메시지 */}
            {showCompletionMessage && <h3 style={{ color: 'green', textAlign: 'center' }}>크롤링 완료!</h3>}
            {/* 크롤링 결과 테이블 */}
            <table className="crawling-table">
                <thead>
                    <tr>
                        <th style={{ width: '30%' }}>제목</th>
                        <th>내용</th>
                    </tr>
                </thead>
                <tbody>
                    {/* 수신된 메시지들을 테이블 행으로 매핑하여 표시합니다. */}
                    {messages.map((msg, index) => (
                        <tr key={index}>
                            <td>{msg.title}</td>
                            <td>{msg.content}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default WebSocketTest;