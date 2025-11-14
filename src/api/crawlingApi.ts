import httpClient from './httpClient'; // HTTP 요청을 위한 httpClient를 임포트합니다.

/**
 * @file crawlingApi.ts
 * @description 크롤링 관련 백엔드 API 호출을 담당하는 모듈입니다.
 *              중앙 집중식 `httpClient`를 사용하여 API 요청을 수행하며,
 *              크롤링 작업 시작과 관련된 기능을 제공합니다.
 */

/**
 * @async
 * @function startCrawling
 * @description 특정 사용자 ID에 대해 웹 크롤링 작업을 시작하도록 백엔드에 요청합니다.
 *
 * @param {string} userId - 크롤링 작업을 시작할 사용자의 고유 ID입니다.
 * @returns {Promise<void>} - 요청 성공 시 아무것도 반환하지 않습니다.
 * @throws {Error} - HTTP 요청 중 오류가 발생하면 에러를 던집니다.
 */
export const startCrawling = async () => { // userId 인자 제거
    try {
        // `httpClient.post`를 사용하여 백엔드의 크롤링 시작 엔드포인트에 POST 요청을 보냅니다.
        // URL에서 사용자 ID를 제거합니다. 백엔드에서 JWT를 통해 사용자 ID를 추출합니다.
        await httpClient.post(`/crawling/start`); // URL에서 userId 제거
        // 요청이 성공적으로 완료되면 추가적인 처리는 필요 없습니다.
    } catch (error) {
        // 요청 중 발생한 오류를 콘솔에 로깅합니다.
        console.error('Error starting crawling:', error);
        // 오류를 다시 던져서 호출하는 쪽에서 오류를 처리할 수 있도록 합니다.
        throw error;
    }
};