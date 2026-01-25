import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  Flame,
  HelpCircle,
  Send,
  Trophy,
  Zap,
} from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { BlockMath } from 'react-katex';
import TopNav from '../components/TopNav.jsx';
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

const buildFallbackProblem = (skillName, zpdStatus) => {
  if (skillName === '6.EE.A.1') {
    const harder = zpdStatus === 'stretch';
    return {
      prompt: 'Solve for x.',
      latex: harder ? '3x + 7 = 25' : '2x + 5 = 15',
      answer: harder ? '6' : '5',
    };
  }
  if (skillName === '7.RP.A.2') {
    return {
      prompt: 'Find the constant of proportionality.',
      latex: 'y = 4x',
      answer: '4',
    };
  }
  return {
    prompt: 'Solve for x.',
    latex: 'x - 9 = 12',
    answer: '21',
  };
};

const formatPercent = (value) => `${Math.round(value * 100)}%`;

const zpdStyles = {
  support: 'bg-sky-100 text-sky-700 border-sky-200',
  challenge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  stretch: 'bg-amber-100 text-amber-700 border-amber-200',
};

const Workspace = () => {
  const {
    model,
    totalHints,
    recordAttempt,
    resetHints,
    setBktSnapshot,
    tickTimeOnTask,
    useHint,
  } = useStudentModel();

  const [problem, setProblem] = useState(() =>
    buildFallbackProblem(model.skillName, model.zpdStatus)
  );
  const [answerInput, setAnswerInput] = useState('');
  const [buddyInput, setBuddyInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'buddy-1',
      role: 'buddy',
      text: `You're working on ${model.skillName}. Let's isolate x carefully and keep the steps clean.`,
    },
  ]);
  const [showIntervention, setShowIntervention] = useState(false);
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
            attemptCount: data.attempt_count,
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
        });
        if (active && data?.latex) {
          setProblem({
            prompt: data.prompt ?? 'Solve for x.',
            latex: data.latex,
            answer: data.answer ?? '',
          });
          resetHints();
        } else if (active) {
          setProblem(buildFallbackProblem(model.skillName, model.zpdStatus));
        }
      } catch (error) {
        if (active) {
          setProblem(buildFallbackProblem(model.skillName, model.zpdStatus));
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
  }, [model.skillName, model.zpdStatus, resetHints]);

  useEffect(() => {
    if (model.attemptCount > 3) {
      setShowIntervention(true);
    }
  }, [model.attemptCount]);

  const handleSubmit = async () => {
    const cleanedInput = answerInput.trim();
    if (!cleanedInput) {
      return;
    }

    const isCorrect = problem.answer
      ? cleanedInput === problem.answer
      : cleanedInput.length > 0;

    recordAttempt({ correct: isCorrect });

    try {
      const response = await submitAnswer({
        student_id: model.studentId,
        skill_name: model.skillName,
        answer: cleanedInput,
        attempt_count: model.attemptCount + 1,
        time_on_task: model.timeOnTask,
        hints_used: model.hintCount,
      });
      if (response?.prior_skill_mastery !== undefined) {
        setBktSnapshot({
          priorSkillMastery: response.prior_skill_mastery,
          learningVelocity: response.learning_velocity,
        });
      }
    } catch (error) {
      // Backend optional in early frontend prototyping.
    }

    setAnswerInput('');
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-teal-50 text-slate-900">
      <TopNav />
      <div className="p-6">
        <Transition appear show={showIntervention} as={React.Fragment}>
          <Dialog as="div" className="relative z-40" onClose={setShowIntervention}>
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-6">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md rounded-3xl bg-white/90 p-6 shadow-2xl border border-white/40">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                        <Zap size={26} />
                      </div>
                      <div>
                        <Dialog.Title className="text-lg font-bold text-slate-800">
                          Proactive Intervention
                        </Dialog.Title>
                        <p className="text-sm text-slate-600 mt-1">
                          You've reached {model.attemptCount} attempts. Want a new
                          explanation or a worked example?
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 flex gap-3">
                      <button
                        className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200"
                        onClick={() => setShowIntervention(false)}
                      >
                        Show a new strategy
                      </button>
                      <button
                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600"
                        onClick={() => setShowIntervention(false)}
                      >
                        Keep trying
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white/50 backdrop-blur-md border border-white/30 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-700 p-2 rounded-lg text-white font-bold text-xl">
              NF
            </div>
            <div>
              <h1 className="font-bold text-lg">NeuroFlow</h1>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Student Model View
              </p>
            </div>
          </div>

          <div className="flex-1 min-w-[280px] max-w-2xl">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-semibold px-1">
                <span>Mastery Meter · prior_skill_mastery</span>
                <span>{masteryPercent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    masteryReached
                      ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
                      : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                  }`}
                  style={{ width: `${masteryPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${velocityBadgeStyles}`}
            >
              <VelocityIcon size={16} className="shrink-0" />
              <span>
                {formatPercent(model.learningVelocity)} · learning_velocity · {velocityLabel}
              </span>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${zpdClass}`}
            >
              {model.zpdStatus} ZPD
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          <main className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white/70 backdrop-blur-lg border border-white/50 rounded-3xl p-8 shadow-xl relative overflow-hidden">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div>
                  <span className="text-indigo-600 font-bold tracking-widest text-xs uppercase">
                    Adaptive Problem Viewer
                  </span>
                  <h2 className="text-xl font-bold text-slate-700 mt-2">
                    Skill {model.skillName}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">LLM Generated</p>
                  <p className="text-sm font-semibold text-slate-600">
                    ZPD status: {model.zpdStatus}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-sm text-slate-500 mb-4">{problem.prompt}</p>
                <div className="text-4xl font-bold text-slate-800">
                  <BlockMath math={problem.latex} />
                </div>
                {problemStatus === 'loading' && (
                  <p className="text-xs text-slate-400 mt-2">
                    Generating a fresh problem for {model.skillName}...
                  </p>
                )}
              </div>

              <div className="w-full max-w-sm mx-auto">
                <input
                  type="text"
                  value={answerInput}
                  onChange={(event) => setAnswerInput(event.target.value)}
                  placeholder="Enter your answer for x..."
                  className="w-full bg-white/70 border-2 border-indigo-100 focus:border-indigo-400 focus:ring-0 rounded-2xl p-4 text-center text-xl font-medium outline-none transition-all shadow-inner"
                />
              </div>

              <div className="flex flex-wrap gap-4 mt-8 justify-center">
                <button
                  onClick={handleSubmit}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all transform active:scale-95"
                >
                  Submit Answer
                </button>
                <button
                  onClick={handleHintClick}
                  disabled={hasAllHints}
                  className="bg-white border-2 border-indigo-100 hover:bg-indigo-50 text-indigo-600 px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <HelpCircle size={20} />
                  {hasAllHints ? 'All Hints Used' : `Hint ${model.hintCount + 1}`}
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/60 border border-white/40 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    hint_count
                  </p>
                  <p className="text-lg font-semibold">{model.hintCount}</p>
                </div>
                <div className="bg-white/60 border border-white/40 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    fraction_of_hints_used
                  </p>
                  <p className="text-lg font-semibold">
                    {formatPercent(fractionOfHintsUsed)}
                  </p>
                </div>
                <div className="bg-white/60 border border-white/40 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    attempt_count
                  </p>
                  <p className="text-lg font-semibold">{model.attemptCount}</p>
                </div>
              </div>

              {currentHint && (
                <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-700">
                  <span className="font-semibold">Tiered Hint:</span> {currentHint}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/40 p-5 rounded-2xl border border-white/20 flex items-center gap-4">
                <div className="bg-teal-100 p-3 rounded-xl text-teal-600">
                  <CheckCircle />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">
                    Problems Done
                  </p>
                  <h4 className="text-2xl font-bold">128</h4>
                </div>
              </div>
              <div className="bg-white/40 p-5 rounded-2xl border border-white/20 flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
                  <Trophy />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">
                    Skills Mastered
                  </p>
                  <h4 className="text-2xl font-bold">14</h4>
                </div>
              </div>
              <div className="bg-white/40 p-5 rounded-2xl border border-white/20">
                <p className="text-xs text-slate-500 font-bold mb-2 uppercase">
                  Time on Task
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {timeOnTaskMinutes}m {timeOnTaskSeconds}s
                    </p>
                    <p className="text-xs text-slate-400">
                      Feature: time_on_task
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-3 text-indigo-600">
                    <Brain size={26} />
                  </div>
                </div>
              </div>
            </div>
          </main>

          <aside className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            <div className="bg-indigo-600/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl flex flex-col h-[640px] border border-white/10 relative">
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-white rounded-full p-1 shadow-lg shadow-indigo-900/40">
                    <img
                      src="https://api.dicebear.com/7.x/bottts/svg?seed=Buddy&backgroundColor=transparent"
                      alt="Buddy"
                    />
                  </div>
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-indigo-600 rounded-full animate-pulse" />
                </div>
                <h3 className="text-white font-bold mt-2">Buddy Agent</h3>
                <p className="text-indigo-200 text-xs">
                  In-context coach (student_logs)
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${
                      message.role === 'buddy'
                        ? 'bg-white text-slate-700 rounded-tl-none'
                        : 'bg-indigo-500/70 text-white rounded-tr-none ml-6'
                    }`}
                  >
                    {message.text}
                  </div>
                ))}

                {slowWorkMessage && (
                  <div className="bg-white text-slate-700 p-4 rounded-2xl rounded-tl-none text-sm shadow-sm">
                    {slowWorkMessage}
                  </div>
                )}

                {model.attemptCount > 3 && (
                  <div className="bg-amber-300 text-amber-900 p-4 rounded-2xl shadow-lg border-2 border-amber-200 flex gap-3 items-start">
                    <Zap size={24} className="shrink-0 mt-1" />
                    <div>
                      <p className="font-bold text-sm">Intervention Triggered</p>
                      <p className="text-xs opacity-80">
                        attempt_count &gt; 3 → offer alternative explanation.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 relative">
                <input
                  type="text"
                  value={buddyInput}
                  onChange={(event) => setBuddyInput(event.target.value)}
                  placeholder="Ask the buddy anything..."
                  className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder:text-indigo-200 focus:outline-none focus:bg-white/20 transition-all text-sm"
                />
                <button
                  onClick={handleBuddySend}
                  className="absolute right-3 top-3 text-white hover:text-teal-300 transition-colors"
                  aria-label="Send buddy question"
                >
                  <Send size={20} />
                </button>
              </div>

              <div className="mt-4 bg-white/10 rounded-2xl p-4 text-xs text-indigo-100">
                <p className="font-semibold mb-1">Opik Evaluation</p>
                <p>
                  Every buddy question is traced to Opik for helpfulness scoring.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
