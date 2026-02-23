import * as db from './dbService';
import { GameSessionMetric } from '../types';
import { SessionResultInput, GatewayResult} from '../types/assessment.types';
import { FullAssessmentResult } from './scoringService';

// ============================================
// TẠO GAME SESSION
// ============================================
export const createGameSession = async (
  assessmentId: string,
  result: SessionResultInput,
  features: any[],
  scoringResult: FullAssessmentResult,
  gatewayResults: GatewayResult[],
  summary?: any
) => {
  const gameSession = db.createGameSession({
    assessment_id: assessmentId,
    game_id: 1,
    sequence_order: 1,
    started_at: new Date(result.startedAt).toISOString(),
    ended_at: new Date(result.endedAt).toISOString(),
    status: 'completed',
    raw_data_json: features,
    result_scores: {
      ...scoringResult,
      gatewayResults,
      summary
    },
  });

  const now = new Date().toISOString();
  const engagementLevelValue = result.engagementLevelValue || 0.6;
  const avgAttention = result.avgAttention || 0;
  const avgSmile = result.avgSmile || 0;
  const gazeStability = result.gazeStability || 0;

  const metrics: Omit<GameSessionMetric, 'id'>[] = [
    {
      game_session_id: gameSession.id,
      metric_key: 'avg_attention',
      metric_value: avgAttention,
      unit: '%',
      captured_at: now,
    },
    {
      game_session_id: gameSession.id,
      metric_key: 'avg_smile',
      metric_value: avgSmile,
      unit: '%',
      captured_at: now,
    },
    {
      game_session_id: gameSession.id,
      metric_key: 'gaze_stability',
      metric_value: gazeStability,
      unit: '',
      captured_at: now,
    },
    {
      game_session_id: gameSession.id,
      metric_key: 'engagement',
      metric_value: engagementLevelValue,
      unit: '',
      captured_at: now,
    }
  ];

  // Thêm metrics từ gateway games nếu có
  if (gatewayResults && gatewayResults.length > 0) {
    gatewayResults.forEach((gw, index) => {
      if (gw.metrics) {
        Object.entries(gw.metrics).forEach(([key, value]) => {
          metrics.push({
            game_session_id: gameSession.id,
            metric_key: `gateway_${index}_${key}`,
            metric_value: typeof value === 'number' ? value : 0,
            unit: '',
            captured_at: now,
          });
        });
      }
    });
  }

  // Lưu metrics - chuẩn bị cho async DB trong tương lai
  try {
    // Nếu DB là sync (hiện tại)
    if (typeof db.createGameSessionMetric === 'function' && db.createGameSessionMetric.length === 1) {
      // Sync version
      metrics.forEach(m => db.createGameSessionMetric(m));
    } else {
      // Async version - dùng Promise.all để đảm bảo tất cả đều hoàn thành
      await Promise.all(metrics.map(m => db.createGameSessionMetric(m)));
    }
  } catch (error) {
    console.error('Error saving game session metrics:', error);
    // Vẫn trả về gameSession dù metrics có lỗi
  }

  return gameSession;
};

// ============================================
// TẠO NHIỀU METRICS CÙNG LÚC (VERSION ASYNC)
// ============================================
export const createManyMetrics = async (metrics: Omit<GameSessionMetric, 'id'>[]) => {
  try {
    // Kiểm tra xem db có hỗ trợ batch insert không
    if (typeof db.createManyGameSessionMetrics === 'function') {
      return await db.createManyGameSessionMetrics(metrics);
    } else {
      // Fallback: insert từng cái một
      const results = await Promise.all(
        metrics.map(m => db.createGameSessionMetric(m))
      );
      return results;
    }
  } catch (error) {
    console.error('Error saving multiple metrics:', error);
    throw error;
  }
};

// ============================================
// LẤY METRICS THEO GAME SESSION
// ============================================
export const getMetricsByGameSession = (gameSessionId: string) => {
  return db.getMetricsByGameSession(gameSessionId);
};