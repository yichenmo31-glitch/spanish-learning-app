import { LearningGoal, LearningLevel, SessionPlan, WordDefinition } from '../types';
import { insightsAPI } from './apiService';

/**
 * Learning-planner agent.
 *
 * Gathers the learner's context (weak spots + due vocabulary + profile) and
 * produces a plan for the next session. The plan then seeds ChatSession's
 * system instruction so the coach practises the right things.
 *
 * ⚠️ ARCHITECTURE NOTE — this currently runs client-side and the plan is built
 * by a deterministic heuristic (buildHeuristicPlan) so the flow works end-to-end
 * without a live LLM (see the P0 model-access issue). Before shipping the real
 * agent, the buildPlanWithLLM step must move to a backend function
 * (Supabase Edge Function / Vercel serverless) so the model key stays server-side.
 */

const goalTopics: Record<LearningGoal, string> = {
  [LearningGoal.DAILY]: 'Everyday small talk: greetings, plans, and how your day went',
  [LearningGoal.TRAVEL]: 'Getting around: asking for directions, ordering, and checking in',
  [LearningGoal.WORK]: 'Professional basics: introductions, scheduling, and quick updates',
  [LearningGoal.CONFIDENCE]: 'Low-pressure free chat to build fluency and confidence',
};

function buildHeuristicPlan(
  level: LearningLevel,
  goal: LearningGoal,
  mistakes: string[],
  dueVocab: WordDefinition[]
): SessionPlan {
  const grammarFocus = mistakes.slice(0, 3);
  const targetVocab = dueVocab.slice(0, 6).map(w => w.word);

  const rationaleParts: string[] = [];
  if (grammarFocus.length) {
    rationaleParts.push(`revisiting things you've been working on (${grammarFocus.length} point${grammarFocus.length > 1 ? 's' : ''})`);
  }
  if (targetVocab.length) {
    rationaleParts.push(`reusing ${targetVocab.length} words from your notebook`);
  }
  const rationale = rationaleParts.length
    ? `Focused on ${rationaleParts.join(' and ')}.`
    : 'A fresh start tailored to your goal.';

  return {
    topic: goalTopics[goal],
    rationale,
    targetVocab,
    grammarFocus,
    warmUpLine: '¡Hola! ¿Cómo estás hoy? Cuéntame algo sobre tu día.',
  };
}

/**
 * TODO (server-side): replace with a real LLM call that reasons over the
 * gathered context and returns a richer, more natural plan. Keep the same
 * SessionPlan shape so nothing downstream changes.
 */
async function buildPlanWithLLM(
  level: LearningLevel,
  goal: LearningGoal,
  mistakes: string[],
  dueVocab: WordDefinition[]
): Promise<SessionPlan> {
  return buildHeuristicPlan(level, goal, mistakes, dueVocab);
}

export async function generateSessionPlan(
  level: LearningLevel,
  goal: LearningGoal
): Promise<SessionPlan> {
  try {
    const [mistakes, dueVocab] = await Promise.all([
      insightsAPI.getRecurringMistakes(),
      insightsAPI.getDueVocab(),
    ]);
    return await buildPlanWithLLM(level, goal, mistakes, dueVocab);
  } catch (error) {
    console.error('Failed to generate session plan:', error);
    // Never block starting a session — fall back to a generic plan.
    return buildHeuristicPlan(level, goal, [], []);
  }
}
