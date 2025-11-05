import axios from 'axios';

/**
 * 백엔드 API의 기본 URL을 가져오거나 기본값 '/api'를 사용합니다.
 */
const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * @interface CrawlingSchedule
 * @description 백엔드에서 관리되는 크롤링 스케줄 작업의 구조를 정의하는 인터페이스입니다.
 */
export interface CrawlingSchedule {
  id: number; // 스케줄 작업의 고유 ID
  userId: string; // 작업을 등록한 사용자 ID
  cronExpression: string; // 작업 실행을 위한 Cron 표현식
  jobName: string; // 실행될 Spring Batch Job의 이름
  jobParameters: string | null; // Job에 전달될 파라미터 (JSON 문자열 또는 null)
  status: 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED'; // 작업의 현재 상태
  createdAt: string; // 스케줄이 생성된 시각 (ISO 8601 형식)
  updatedAt: string; // 스케줄이 마지막으로 업데이트된 시각 (ISO 8601 형식)
}

/**
 * 새로운 크롤링 스케줄 작업을 백엔드에 추가합니다.
 *
 * @param {string} userId 스케줄 작업을 등록할 사용자 ID
 * @param {string} cronExpression 작업을 실행할 Cron 표현식
 * @returns {Promise<CrawlingSchedule>} 새로 추가된 스케줄 작업 정보를 담은 Promise
 */
export const addCrawlingSchedule = async (userId: string, cronExpression: string): Promise<CrawlingSchedule> => {
  const response = await axios.post<CrawlingSchedule>(`${API_URL}/schedules/crawling`, {
    userId,
    cronExpression,
  });
  return response.data;
};

/**
 * 백엔드에 등록된 모든 크롤링 스케줄 작업 목록을 조회합니다.
 *
 * @returns {Promise<CrawlingSchedule[]>} 크롤링 스케줄 작업 목록을 담은 Promise
 */
export const getCrawlingSchedules = async (): Promise<CrawlingSchedule[]> => {
  const response = await axios.get<CrawlingSchedule[]>(`${API_URL}/schedules/crawling`);
  return response.data;
};

/**
 * 지정된 ID의 크롤링 스케줄 작업을 백엔드에서 취소합니다.
 *
 * @param {number} id 취소할 스케줄 작업의 ID
 * @returns {Promise<void>} 작업 취소 완료를 알리는 Promise
 */
export const cancelCrawlingSchedule = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/schedules/crawling/${id}`);
};

/**
 * 지정된 ID의 크롤링 스케줄 작업의 Cron 표현식을 업데이트합니다.
 *
 * @param {number} id 업데이트할 스케줄 작업의 ID
 * @param {string} cronExpression 새로 설정할 Cron 표현식
 * @returns {Promise<CrawlingSchedule>} 업데이트된 스케줄 작업 정보를 담은 Promise
 */
export const updateCrawlingSchedule = async (id: number, cronExpression: string): Promise<CrawlingSchedule> => {
  const response = await axios.put<CrawlingSchedule>(`${API_URL}/schedules/crawling/${id}`, {
    cronExpression,
  });
  return response.data;
};
