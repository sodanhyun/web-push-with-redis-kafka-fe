import { useCallback, useEffect, useState } from "react";
import { addCrawlingSchedule, getCrawlingSchedules, cancelCrawlingSchedule, updateCrawlingSchedule, type CrawlingSchedule } from "../../api/scheduleApi";
import { generateCronExpression, parseCronExpression, formatCronExpression, type Frequency } from "../../utils/cronUtils";
import useAuthStore from '../../store/useAuthStore';

/**
 * @function CrawlingScheduler
 * @description 크롤링 스케줄 작업을 추가, 조회, 수정, 취소할 수 있는 React 컴포넌트입니다.
 *              사용자 인터페이스를 통해 Cron 표현식 기반의 동적 스케줄링을 관리합니다.
 */
const CrawlingScheduler: React.FC = () => {
  const userId = useAuthStore((state) => state.userId);
  /**
   * @property {CrawlingSchedule[]} schedules
   * @description 현재 등록된 모든 크롤링 스케줄 목록을 저장하는 상태 변수입니다.
   */
  const [schedules, setSchedules] = useState<CrawlingSchedule[]>([]);
  /**
   * @property {Frequency} frequency
   * @description 스케줄링 주기를 선택하는 상태 변수입니다. (예: 'hourly', 'daily')
   */
  const [frequency, setFrequency] = useState<Frequency>('hourly');
  /**
   * @property {number} minute
   * @description 스케줄링할 분(0-59)을 저장하는 상태 변수입니다.
   */
  const [minute, setMinute] = useState<number>(0);
  /**
   * @property {number} hour
   * @description 스케줄링할 시(0-23)를 저장하는 상태 변수입니다.
   */
  const [hour, setHour] = useState<number>(0);
  /**
   * @property {number} dayOfWeek
   * @description 스케줄링할 요일(0=일요일, 1=월요일, ..., 6=토요일)을 저장하는 상태 변수입니다.
   */
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  /**
   * @property {number} dayOfMonth
   * @description 스케줄링할 월의 일(1-31)을 저장하는 상태 변수입니다.
   */
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);

  /**
   * @property {number | null} editingScheduleId
   * @description 현재 수정 중인 스케줄의 ID를 저장하는 상태 변수입니다. 수정 모드가 아니면 `null`입니다.
   */
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  /**
   * @property {string} editingCronExpression
   * @description 수정 모드일 때 Cron 표현식 입력 필드의 상태 변수입니다.
   */
  const [editingCronExpression, setEditingCronExpression] = useState<string>('');
  /**
   * @property {string | null} error
   * @description API 호출 또는 입력 유효성 검사 중 발생한 에러 메시지를 저장하는 상태 변수입니다.
   */
  const [error, setError] = useState<string | null>(null);

  /**
   * @function fetchSchedules
   * @description 백엔드로부터 크롤링 스케줄 목록을 비동기적으로 불러오는 함수입니다.
   *              성공 시 `schedules` 상태를 업데이트하고, 실패 시 에러를 설정합니다.
   */
  const fetchSchedules = useCallback(async () => {
    // if (!userId) return; // userId가 없으면 스케줄을 불러오지 않습니다. (제거)
    try {
      const data = await getCrawlingSchedules(); // userId 인자 제거
      setSchedules(data);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setError('스케줄 목록을 불러오는데 실패했습니다.');
    }
  }, []); // userId를 의존성 배열에서 제거

  /**
   * @useEffect
   * @description 컴포넌트가 마운트될 때 스케줄 목록을 한 번 불러옵니다.
   *              `fetchSchedules` 함수가 변경될 때마다 재실행됩니다.
   */
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  /**
   * @function handleAddSchedule
   * @description 새로운 크롤링 스케줄 추가 버튼 클릭 시 호출되는 핸들러입니다.
   *              생성된 Cron 표현식을 사용하여 백엔드에 스케줄 추가를 요청합니다.
   *              성공 시 입력 필드를 초기화하고 스케줄 목록을 새로고침합니다.
   */
  const handleAddSchedule = async () => {
    setError(null);
    // if (!userId) { // userId 유효성 검사 로직 제거
    //   setError('사용자 ID가 없습니다. 로그인 해주세요.');
    //   return;
    // }
    const generatedCron = generateCronExpression(frequency, minute, hour, dayOfWeek, dayOfMonth);
    try {
      await addCrawlingSchedule(generatedCron); // userId 인자 제거
      setFrequency('hourly');
      setMinute(0);
      setHour(0);
      setDayOfWeek(0);
      setDayOfMonth(1);
      fetchSchedules();
    } catch (err) {
      console.error('Failed to add schedule:', err);
      setError('스케줄 추가에 실패했습니다.');
    }
  };

  /**
   * @function handleCancelSchedule
   * @description 스케줄 취소 버튼 클릭 시 호출되는 핸들러입니다.
   *              지정된 ID의 스케줄 작업을 백엔드에 취소 요청하고, 성공 시 스케줄 목록을 새로고침합니다.
   * @param {number} id 취소할 스케줄 작업의 ID
   */
  const handleCancelSchedule = async (id: number) => {
    setError(null);
    // if (!userId) { // userId 유효성 검사 로직 제거
    //   setError('사용자 ID가 없습니다. 로그인 해주세요.');
    //   return;
    // }
    try {
      await cancelCrawlingSchedule(id); // userId 인자 제거
      fetchSchedules();
    } catch (err) {
      console.error('Failed to cancel schedule:', err);
      setError('스케줄 취소에 실패했습니다.');
    }
  };

  /**
   * @function handleUpdateSchedule
   * @description 스케줄 수정 후 저장 버튼 클릭 시 호출되는 핸들러입니다.
   *              지정된 ID의 스케줄 작업을 새로운 Cron 표현식으로 백엔드에 업데이트 요청합니다.
   *              성공 시 수정 모드를 종료하고 스케줄 목록을 새로고침합니다.
   * @param {number} id 업데이트할 스케줄 작업의 ID
   */
  const handleUpdateSchedule = async (id: number) => {
    setError(null);
    // if (!userId) { // userId 유효성 검사 로직 제거
    //   setError('사용자 ID가 없습니다. 로그인 해주세요.');
    //   return;
    // }
    const generatedCron = generateCronExpression(frequency, minute, hour, dayOfWeek, dayOfMonth);
    try {
      await updateCrawlingSchedule(id, generatedCron); // userId 인자 제거
      setEditingScheduleId(null);
      setEditingCronExpression(''); // Clear editing state
      fetchSchedules();
    } catch (err) {
      console.error('Failed to update schedule:', err);
      setError('스케줄 업데이트에 실패했습니다.');
    }
  };

  /**
   * @function startEditing
   * @description 특정 스케줄을 수정 모드로 전환하는 함수입니다.
   * @param {CrawlingSchedule} schedule 수정할 스케줄 객체
   */
  const startEditing = (schedule: CrawlingSchedule) => {
    setEditingScheduleId(schedule.id);
    setEditingCronExpression(schedule.cronExpression); // Keep raw cron for display/initial value
    // 파싱된 값으로 UI 상태 업데이트
    const parsed = parseCronExpression(schedule.cronExpression);
    setFrequency(parsed.freq);
    setMinute(parsed.min === -1 ? 0 : parsed.min);
    setHour(parsed.hr === -1 ? 0 : parsed.hr);
    setDayOfWeek(parsed.dow === -1 ? 0 : parsed.dow);
    setDayOfMonth(parsed.dom === -1 ? 1 : parsed.dom);
  };

  /**
   * @function stopEditing
   * @description 수정 모드를 종료하는 함수입니다.
   */
  const stopEditing = () => {
    setEditingScheduleId(null);
    setEditingCronExpression('');
  };

  return (
    <div className="crawling-scheduler-container">
      <h2>크롤링 스케줄 관리</h2>

      {/* 스케줄 추가 폼 */}
      <div className="schedule-form">
        {/* 사용자 ID는 App.tsx에서 props로 전달받으므로 별도의 입력 필드 필요 없음 */}
        <p>현재 사용자 ID: <strong>{userId || '로그인 필요'}</strong></p>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
          <option value="minute">매분</option>
          <option value="hourly">매시간</option>
          <option value="daily">매일</option>
          <option value="weekly">매주</option>
          <option value="monthly">매월</option>
        </select>

        {frequency === 'monthly' && (
          <label><input
            type="number"
            placeholder="일 (1-31)"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(parseInt(e.target.value, 10))}
            min="1"
            max="31"
          />일</label>
        )}

        {frequency === 'weekly' && (
          <select value={dayOfWeek} onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}>
            <option value={0}>일요일</option>
            <option value={1}>월요일</option>
            <option value={2}>화요일</option>
            <option value={3}>수요일</option>
            <option value={4}>목요일</option>
            <option value={5}>금요일</option>
            <option value={6}>토요일</option>
          </select>
        )}

        {(frequency === 'daily' || frequency === 'weekly' || frequency === 'monthly') && (
          <label><input
            type="number"
            placeholder="시 (0-23)"
            value={hour}
            onChange={(e) => setHour(parseInt(e.target.value, 10))}
            min="0"
            max="23"
          />시</label>
        )}
        
        {frequency !== 'minute' && (
          <label><input
            type="number"
            placeholder="분 (0-59)"
            value={minute}
            onChange={(e) => setMinute(parseInt(e.target.value, 10))}
            min="0"
            max="59"
          />분</label>
        )}

        <button onClick={handleAddSchedule} disabled={!userId}>스케줄 추가</button>
      </div>

      {/* 에러 메시지 표시 */}
      {error && <p className="error-message">{error}</p>}

      <h3>등록된 스케줄</h3>
      {/* 스케줄 목록 테이블 */}
      <table className="schedule-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>사용자 ID</th>
            <th>Cron 표현식</th>
            <th>상태</th>
            <th>생성일</th>
            <th>수정일</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => (
            <tr key={schedule.id}>
              <td>{schedule.id}</td>
              <td>{schedule.userId}</td>
              <td>
                {/* 수정 모드일 경우 입력 필드, 아닐 경우 Cron 표현식 표시 */}
                {editingScheduleId === schedule.id ? (
                  <>
                    <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
                      <option value="minute">매분</option>
                      <option value="hourly">매시간</option>
                      <option value="daily">매일</option>
                      <option value="weekly">매주</option>
                      <option value="monthly">매월</option>
                    </select>
                    

                    {frequency === 'weekly' && (
                      <select value={dayOfWeek} onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}>
                        <option value={0}>일요일</option>
                        <option value={1}>월요일</option>
                        <option value={2}>화요일</option>
                        <option value={3}>수요일</option>
                        <option value={4}>목요일</option>
                        <option value={5}>금요일</option>
                        <option value={6}>토요일</option>
                      </select>
                    )}

                    {frequency === 'monthly' && (
                      <label><input
                        type="number"
                        placeholder="일 (1-31)"
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(parseInt(e.target.value, 10))}
                        min="1"
                        max="31"
                      />일</label>
                    )}

                    {(frequency === 'daily' || frequency === 'weekly' || frequency === 'monthly') && (
                      <label><input
                        type="number"
                        placeholder="시 (0-23)"
                        value={hour}
                        onChange={(e) => setHour(parseInt(e.target.value, 10))}
                        min="0"
                        max="23"
                      />시</label>
                    )}

                    {frequency !== 'minute' && (
                      <label><input
                        type="number"
                        placeholder="분 (0-59)"
                        value={minute}
                        onChange={(e) => setMinute(parseInt(e.target.value, 10))}
                        min="0"
                        max="59"
                      />분</label>
                    )}
                  </>
                ) : (
                  formatCronExpression(schedule.cronExpression)
                )}
              </td>
              <td>{schedule.status}</td>
              <td>{new Date(schedule.createdAt).toLocaleString()}</td>
              <td>{new Date(schedule.updatedAt).toLocaleString()}</td>
              <td>
                {/* 수정 모드일 경우 저장/취소 버튼, 아닐 경우 수정/취소 버튼 표시 */}
                {editingScheduleId === schedule.id ? (
                  <>
                    <button onClick={() => handleUpdateSchedule(schedule.id)} disabled={!userId}>저장</button>
                    <button onClick={stopEditing}>취소</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEditing(schedule)}>수정</button>
                    <button onClick={() => handleCancelSchedule(schedule.id)} disabled={!userId}>취소</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CrawlingScheduler;
