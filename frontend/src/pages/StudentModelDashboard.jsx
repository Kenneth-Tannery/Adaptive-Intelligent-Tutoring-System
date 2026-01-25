import React from 'react';
import { ArrowUpRight, Gauge, LineChart, Sparkles } from 'lucide-react';
import TopNav from '../components/TopNav.jsx';
import { useStudentModel } from '../state/studentModelContext.jsx';

const formatPercent = (value) => `${Math.round(value * 100)}%`;

const StudentModelDashboard = () => {
  const { model, totalHints } = useStudentModel();
  const fractionOfHintsUsed =
    totalHints === 0 ? 0 : model.hintCount / totalHints;

  const learningCards = [
    {
      label: 'prior_skill_mastery',
      value: formatPercent(model.priorSkillMastery),
      note: 'BKT posterior after last attempt',
    },
    {
      label: 'learning_velocity',
      value: formatPercent(model.learningVelocity),
      note: 'Change in mastery across attempts',
    },
    {
      label: 'skill_attempt_number',
      value: model.attemptCount,
      note: 'Nth attempt for this skill',
    },
  ];

  const helpSeekingCards = [
    {
      label: 'hint_count',
      value: model.hintCount,
      note: 'Hints used this problem',
    },
    {
      label: 'fraction_of_hints_used',
      value: formatPercent(fractionOfHintsUsed),
      note: 'Hint usage ratio',
    },
    {
      label: 'hint_abuse_score',
      value: fractionOfHintsUsed > 0.8 ? 'High' : 'Normal',
      note: 'Trigger when hints > 80%',
    },
  ];

  const timePatternCards = [
    {
      label: 'time_on_task',
      value: `${Math.floor(model.timeOnTask / 60)}m ${model.timeOnTask % 60}s`,
      note: 'Current problem duration',
    },
    {
      label: 'persistence_score',
      value: (model.timeOnTask / Math.max(model.attemptCount, 1)).toFixed(1),
      note: 'time_on_task / attempt_count',
    },
    {
      label: 'time_between_attempts',
      value: '42s (avg)',
      note: 'Derived from student_logs',
    },
  ];

  const errorCards = [
    {
      label: 'consecutive_errors',
      value: model.errorCount,
      note: 'Rolling 3 attempt window',
    },
    {
      label: 'error_after_hint',
      value: model.hintCount > 0 && model.errorCount > 0 ? 'Yes' : 'No',
      note: 'Hint used but still incorrect',
    },
    {
      label: 'wrong_response_count',
      value: model.errorCount,
      note: 'student_logs aggregation',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-teal-50 text-slate-900">
      <TopNav />
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Student Model Dashboard
            </p>
            <h1 className="text-3xl font-bold text-slate-800 mt-2">
              BKT + Behavioral Features
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Live snapshot for student {model.studentId} on {model.skillName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
              ZPD: {model.zpdStatus}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
              Opportunities to learn: {model.attemptCount + 4}
            </span>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {learningCards.map((card) => (
            <div
              key={card.label}
              className="bg-white/70 border border-white/50 rounded-2xl p-5 shadow-sm"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {card.label}
              </p>
              <p className="text-2xl font-bold text-slate-800 mt-2">
                {card.value}
              </p>
              <p className="text-xs text-slate-500 mt-2">{card.note}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/70 border border-white/50 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <LineChart className="text-indigo-500" />
              <h2 className="text-lg font-semibold text-slate-800">
                Learning Rate Indicators
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-xs text-slate-500">
                <span>improvement_rate</span>
                <span>+0.12 (rolling mean)</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[65%]" />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>mastery_speed</span>
                <span>9 attempts to streak</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 w-[52%]" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 border border-white/50 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-800">
                Help-Seeking Behavior
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {helpSeekingCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white/80 border border-slate-100 rounded-2xl p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {card.label}
                  </p>
                  <p className="text-lg font-semibold text-slate-800 mt-2">
                    {card.value}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">{card.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white/70 border border-white/50 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Gauge className="text-teal-500" />
              <h2 className="text-lg font-semibold text-slate-800">
                Time-on-Task Patterns
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {timePatternCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white/80 border border-slate-100 rounded-2xl p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {card.label}
                  </p>
                  <p className="text-lg font-semibold text-slate-800 mt-2">
                    {card.value}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">{card.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/70 border border-white/50 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <ArrowUpRight className="text-rose-500" />
              <h2 className="text-lg font-semibold text-slate-800">
                Error Patterns
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {errorCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white/80 border border-slate-100 rounded-2xl p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {card.label}
                  </p>
                  <p className="text-lg font-semibold text-slate-800 mt-2">
                    {card.value}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">{card.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentModelDashboard;
