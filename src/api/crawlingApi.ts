import axios from 'axios'; // HTTP 요청을 위한 axios 라이브러리를 임포트합니다.

// 백엔드 API의 기본 URL을 정의합니다.
// 이 URL은 애플리케이션의 환경 설정에 따라 변경될 수 있습니다.
const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * @async
 * @function startCrawling
 * @description 특정 사용자 ID에 대해 웹 크롤링 작업을 시작하도록 백엔드에 요청합니다.
 *
 * @param {string} userId - 크롤링 작업을 시작할 사용자의 고유 ID입니다.
 * @returns {Promise<void>} - 요청 성공 시 아무것도 반환하지 않습니다.
 * @throws {Error} - HTTP 요청 중 오류가 발생하면 에러를 던집니다.
 */
export const startCrawling = async (userId: string) => {
    try {
        // `axios.post`를 사용하여 백엔드의 크롤링 시작 엔드포인트에 POST 요청을 보냅니다.
        // URL은 `API_BASE_URL`과 사용자 ID를 포함하여 구성됩니다.
        await axios.post(`${API_BASE_URL}/crawling/start/${userId}`);
        // 요청이 성공적으로 완료되면 추가적인 처리는 필요 없습니다.
    } catch (error) {
        // 요청 중 발생한 오류를 콘솔에 로깅합니다.
        console.error('Error starting crawling:', error);
        // 오류를 다시 던져서 호출하는 쪽에서 오류를 처리할 수 있도록 합니다.
        throw error;
    }
};