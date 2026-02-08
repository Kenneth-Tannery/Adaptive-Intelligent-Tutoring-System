import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Flame,
  HelpCircle,
  Send,
  Zap,
} from 'lucide-react';
import { BlockMath } from 'react-katex';
import { useStudentModel } from '../state/studentModelContext.jsx';
import {
  fetchBktSnapshot,
  generateProblem,
  sendOpikTrace,
  submitAnswer,
} from '../services/api.js';

const HINTS = [
  'Think about the 5.',
  'Subtract 5 from both sides.',
  'The answer is 5.',
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const buildFallbackProblem = (skillName, zpdStatus) => {
  if (skillName === '6.EE.A.1') {
    const harder = zpdStatus === 'stretch' || zpdStatus === 'challenge';
    const a = harder ? randomInt(3, 6) : randomInt(1, 3);
    const x = harder ? randomInt(3, 9) : randomInt(2, 6);
    const b = harder ? randomInt(2, 9) : randomInt(1, 6);
    const c = a * x + b;
    return {
      prompt: 'Solve for x.',
      latex: `${a}x + ${b} = ${c}`,
      answer: String(x),
    };
  }
  if (skillName === '7.RP.A.2') {
    const k = randomInt(2, 8);
    return {
      prompt: 'Find the constant of proportionality.',
      latex: `y = ${k}x`,
      answer: String(k),
    };
  }
  const x = randomInt(5, 15);
  const b = randomInt(3, 10);
  const c = x + b;
  return {
    prompt: 'Solve for x.',
    latex: `x + ${b} = ${c}`,
    answer: String(x),
  };
};

const formatPercent = (value) => `${Math.round(value * 100)}%`;

const zpdStyles = {
  support: 'bg-sky-100 text-sky-700 border-sky-200',
  challenge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  stretch: 'bg-amber-100 text-amber-700 border-amber-200',
};

const toNumber = (value) => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!/^[-+]?\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const WorksheetPanel = ({ embedded = false }) => {
  const {
    model,
    totalHints,
    recordAttempt,
    resetHints,
    resetAttempts,
    setBktSnapshot,
    tickTimeOnTask,
    useHint,
    startIntervention,
    recordRecoveryAttempt,
  } = useStudentModel();

  const [problem, setProblem] = useState(() =>
    buildFallbackProblem(model.skillName, model.zpdStatus)
  );
  const [problemSeed, setProblemSeed] = useState(0);
  const [answerInput, setAnswerInput] = useState('');
  const [buddyInput, setBuddyInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'buddy-1',
      role: 'buddy',
      text: `You're working on ${model.skillName}. Let's isolate x carefully and keep the steps clean.`,
    },
  ]);
  const [problemStatus, setProblemStatus] = useState('idle');

  const masteryPercent = Math.round(model.priorSkillMastery * 100);
  const masteryReached = masteryPercent >= 95;
  const velocityHigh = model.learningVelocity >= 0.08;
  const wheelSpinning = model.attemptCount > 10 && model.priorSkillMastery < 0.95;
  const fractionOfHintsUsed = totalHints === 0 ? 0 : model.hintCount / totalHints;
  const currentHint = model.hintCount > 0 ? HINTS[model.hintCount - 1] : null;
  const hasAllHints = model.hintCount >= totalHints;
  const zpdClass = zpdStyles[model.zpdStatus] || zpdStyles.challenge;

  useEffect(() => {
    const timer = setInterval(() => tickTimeOnTask(1), 1000);
    return () => clearInterval(timer);
  }, [tickTimeOnTask]);

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const data = await fetchBktSnapshot({
          studentId: model.studentId,
          skillName: model.skillName,
        });
        if (data) {
          setBktSnapshot({
            priorSkillMastery: data.prior_skill_mastery,
            learningVelocity: data.learning_velocity,
            interventionActive: data.intervention_active,
            recoveryStreak: data.recovery_streak,
          });
        }
      } catch (error) {
        // Backend optional in early frontend prototyping.
      }
    };
    fetchSnapshot();
  }, [model.skillName, model.studentId, setBktSnapshot]);

  useEffect(() => {
    let active = true;
    const loadProblem = async () => {
      setProblemStatus('loading');
      try {
        const data = await generateProblem({
          skillName: model.skillName,
          zpdStatus: model.zpdStatus,
          studentId: model.studentId,
        });
        if (active && data?.latex) {
          setProblem({
            prompt: data.prompt ?? 'Solve for x.',
            latex: data.latex,
            answer: data.answer ?? '',
          });
          resetHints();
          resetAttempts();
        } else if (active) {
          setProblem(buildFallbackProblem(model.skillName, model.zpdStatus));
          resetHints();
          resetAttempts();
        }
      } catch (error) {
        if (active) {
          setProblem(buildFallbackProblem(model.skillName, model.zpdStatus));
          resetHints();
          resetAttempts();
        }
      } finally {
        if (active) {
          setProblemStatus('idle');
        }
      }
    };

    loadProblem();
    return () => {
      active = false;
    };
  }, [
    model.skillName,
    model.studentId,
    model.zpdStatus,
    problemSeed,
    resetHints,
    resetAttempts,
  ]);

  const handleSubmit = async () => {
    const cleanedInput = answerInput.trim();
    if (!cleanedInput) {
      return;
    }

    const expected = problem.answer?.trim() ?? '';
    const expectedNum = toNumber(expected);
    const actualNum = toNumber(cleanedInput);
    const isCorrect = expected
      ? expectedNum !== null && actualNum !== null
        ? Math.abs(expectedNum - actualNum) < 1e-6
        : cleanedInput.trim().toLowerCase() === expected.toLowerCase()
      : cleanedInput.length > 0;

    const nextAttemptCount = model.attemptCount + 1;
    const wasInterventionActive = model.interventionActive;
    const triggeredIntervention = !wasInterventionActive && nextAttemptCount > 3;

    recordAttempt({ correct: isCorrect });

    try {
      const response = await submitAnswer({
        student_id: model.studentId,
        skill_name: model.skillName,
        answer: cleanedInput,
        correct: isCorrect,
        attempt_count: nextAttemptCount,
        time_on_task: model.timeOnTask,
        hints_used: model.hintCount,
      });
      if (response?.prior_skill_mastery !== undefined) {
        setBktSnapshot({
          priorSkillMastery: response.prior_skill_mastery,
          learningVelocity: response.learning_velocity,
          interventionActive: response.intervention_active,
          recoveryStreak: response.recovery_streak,
        });
      }
    } catch (error) {
      // Backend optional in early frontend prototyping.
    }

    if (triggeredIntervention) {
      startIntervention();
    } else if (wasInterventionActive) {
      recordRecoveryAttempt({
        correct: isCorrect,
        hintsUsed: model.hintCount,
        maxHints: totalHints,
      });
    }

    setAnswerInput('');
    if (isCorrect || triggeredIntervention) {
      setProblemSeed((prev) => prev + 1);
    }
  };

  const handleHintClick = () => {
    if (hasAllHints) {
      return;
    }
    useHint();
  };

  const handleBuddySend = async () => {
    const trimmed = buddyInput.trim();
    if (!trimmed) {
      return;
    }

    const message = {
      id: `student-${Date.now()}`,
      role: 'student',
      text: trimmed,
    };
    setChatMessages((prev) => [...prev, message]);
    setBuddyInput('');

    try {
      await sendOpikTrace({
        student_id: model.studentId,
        skill_name: model.skillName,
        time_on_task: model.timeOnTask,
        attempt_count: model.attemptCount,
        hint_count: model.hintCount,
        question: trimmed,
        source: 'buddy_chat',
      });
    } catch (error) {
      // Opik tracing can be wired later.
    }
  };

  const velocityLabel = wheelSpinning
    ? 'Wheel-Spinning'
    : velocityHigh
    ? 'High Velocity'
    : 'Steady Pace';

  const velocityBadgeStyles = wheelSpinning
    ? 'bg-rose-100 text-rose-700'
    : velocityHigh
    ? 'bg-orange-100 text-orange-700'
    : 'bg-slate-100 text-slate-600';

  const VelocityIcon = wheelSpinning ? AlertTriangle : Flame;

  const timeOnTaskMinutes = useMemo(
    () => Math.floor(model.timeOnTask / 60),
    [model.timeOnTask]
  );

  const timeOnTaskSeconds = useMemo(
    () => model.timeOnTask % 60,
    [model.timeOnTask]
  );

  const slowWorkMessage =
    model.timeOnTask >= 120
      ? 'Take your time, this is a tricky one!'
      : null;

  return (
    <div
      className={`relative bg-white/80 border border-white/50 rounded-3xl shadow-xl ${
        embedded ? 'p-6' : 'p-8'
      }`}
    >
      {model.interventionActive && (
        <div className="absolute top-4 right-4 bg-slate-100/70 text-slate-500 border border-dashed border-slate-200 rounded-2xl p-4 text-xs shadow-sm max-w-[260px] opacity-70">
          <div className="flex items-start gap-2">
            <Zap size={18} className="shrink-0 text-slate-400" />
            <div>
              <p className="font-semibold">Support mode</p>
              <p className="opacity-80">
                New question at a gentler level. Complete 3 in a row without
                using all hints to unlock mastery gains.
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                streak {model.recoveryStreak}/3
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            Worksheet
          </p>
          <h2 className="text-xl font-bold text-slate-700 mt-2">
            Skill {model.skillName}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            time_on_task: {timeOnTaskMinutes}m {timeOnTaskSeconds}s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1 min-w-[160px]">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
              mastery
            </p>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  masteryReached
                    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                    : 'bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.4)]'
                }`}
                style={{ width: `${masteryPercent}%` }}
              />
            </div>
          </div>
          <div
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${velocityBadgeStyles}`}
          >
            <VelocityIcon size={14} className="shrink-0" />
            <span>{formatPercent(model.learningVelocity)}</span>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${zpdClass}`}
          >
            {model.zpdStatus} ZPD
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white/70 border border-white/50 rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-indigo-600 font-bold tracking-widest text-xs uppercase">
                  Adaptive Problem Viewer
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  skill_name + zpd_status
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {problemStatus === 'loading' ? 'Generating...' : 'LLM Ready'}
              </span>
            </div>

            <div className="text-center py-4">
              <p className="text-sm text-slate-500 mb-3">{problem.prompt}</p>
              <div className="text-3xl font-bold text-slate-800">
                <BlockMath math={problem.latex} />
              </div>
            </div>

            <div className="w-full max-w-sm mx-auto">
              <input
                type="text"
                value={answerInput}
                onChange={(event) => setAnswerInput(event.target.value)}
                placeholder="Enter your answer for x..."
                className="w-full bg-white/70 border-2 border-indigo-100 focus:border-indigo-400 focus:ring-0 rounded-2xl p-3 text-center text-lg font-medium outline-none transition-all shadow-inner"
              />
            </div>

            <div className="flex flex-wrap gap-3 mt-6 justify-center">
              <button
                onClick={handleSubmit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all transform active:scale-95"
              >
                Submit Answer
              </button>
              <button
                onClick={handleHintClick}
                disabled={hasAllHints}
                className="bg-white border-2 border-indigo-100 hover:bg-indigo-50 text-indigo-600 px-5 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <HelpCircle size={18} />
                {hasAllHints ? 'All Hints Used' : `Hint ${model.hintCount + 1}`}
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/80 border border-white/50 rounded-2xl p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  hint_count
                </p>
                <p className="text-lg font-semibold">{model.hintCount}</p>
              </div>
              <div className="bg-white/80 border border-white/50 rounded-2xl p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  fraction_of_hints_used
                </p>
                <p className="text-lg font-semibold">
                  {formatPercent(fractionOfHintsUsed)}
                </p>
              </div>
              <div className="bg-white/80 border border-white/50 rounded-2xl p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  attempt_count
                </p>
                <p className="text-lg font-semibold">{model.attemptCount}</p>
              </div>
            </div>

            {currentHint && (
              <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-3 text-sm text-indigo-700">
                <span className="font-semibold">Tiered Hint:</span> {currentHint}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-indigo-600/90 rounded-3xl p-5 shadow-2xl border border-white/10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-full p-1 shadow-lg shadow-indigo-900/40">
                <img
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=Buddy&backgroundColor=transparent"
                  alt="Buddy"
                />
              </div>
              <div>
                <h3 className="text-white font-bold">Buddy Agent</h3>
                <p className="text-indigo-200 text-xs">
                  student_logs - intervention layer
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-2xl text-sm shadow-sm leading-relaxed ${
                    message.role === 'buddy'
                      ? 'bg-white text-slate-700 rounded-tl-none'
                      : 'bg-indigo-500/70 text-white rounded-tr-none ml-6'
                  }`}
                >
                  {message.text}
                </div>
              ))}

              {slowWorkMessage && (
                <div className="bg-white text-slate-700 p-3 rounded-2xl rounded-tl-none text-sm shadow-sm">
                  {slowWorkMessage}
                </div>
              )}
            </div>

            <div className="mt-4 relative">
              <input
                type="text"
                value={buddyInput}
                onChange={(event) => setBuddyInput(event.target.value)}
                placeholder="Ask the buddy anything..."
                className="w-full bg-white/10 border border-white/20 rounded-2xl p-3 text-white placeholder:text-indigo-200 focus:outline-none focus:bg-white/20 transition-all text-sm"
              />
              <button
                onClick={handleBuddySend}
                className="absolute right-3 top-3 text-white hover:text-teal-300 transition-colors"
                aria-label="Send buddy question"
              >
                <Send size={18} />
              </button>
            </div>

            <div className="mt-3 bg-white/10 rounded-2xl p-3 text-xs text-indigo-100">
              <p className="font-semibold mb-1">Opik Evaluation</p>
              <p>
                Every buddy question is traced to Opik for helpfulness scoring.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorksheetPanel;
