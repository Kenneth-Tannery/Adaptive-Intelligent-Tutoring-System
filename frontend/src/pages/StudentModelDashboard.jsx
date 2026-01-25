import React, { useState } from 'react';
import { Pin, PlayCircle, Sparkles } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import TopNav from '../components/TopNav.jsx';
import { useStudentModel } from '../state/studentModelContext.jsx';
import WorksheetPanel from '../components/WorksheetPanel.jsx';

const formatPercent = (value) => `${Math.round(value * 100)}%`;

const StudentModelDashboard = () => {
  const { model } = useStudentModel();
  const [worksheetOpen, setWorksheetOpen] = useState(false);

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

  const progressCards = [
    {
      label: 'Current Skill',
      value: model.skillName,
      meta: `prior_skill_mastery ${Math.round(model.priorSkillMastery * 100)}%`,
    },
    {
      label: 'Learning Velocity',
      value: `${Math.round(model.learningVelocity * 100)}%`,
      meta: 'Rate of change in BKT score',
    },
    {
      label: 'Time on Task',
      value: `${Math.floor(model.timeOnTask / 60)}m ${model.timeOnTask % 60}s`,
      meta: 'Latest problem session',
    },
  ];

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{
        background:
          'linear-gradient(135deg, rgba(255, 251, 235, 0.9) 0%, rgba(255, 241, 242, 0.9) 45%, rgba(238, 242, 255, 0.9) 100%)',
        color: '#0D173B',
      }}
    >
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
          <button
            onClick={() => setWorksheetOpen(true)}
            className="px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-md"
          >
            Open Worksheet
          </button>
        </div>
      </div>

      <Transition appear show={worksheetOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-40" onClose={setWorksheetOpen}>
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
                <Dialog.Panel className="w-full max-w-6xl rounded-3xl bg-white/90 p-6 shadow-2xl border border-white/40">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <Dialog.Title className="text-lg font-bold text-slate-800">
                        Student Worksheet
                      </Dialog.Title>
                      <p className="text-xs text-slate-500 mt-1">
                        Adaptive problem viewer + Buddy support in one view.
                      </p>
                    </div>
                    <button
                      onClick={() => setWorksheetOpen(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Close
                    </button>
                  </div>
                  <WorksheetPanel embedded />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

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


        <section className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="text-rose-500" />
            <h2 className="text-lg font-semibold text-slate-800">
              Student Profile Snapshot
            </h2>
            <span className="text-xs text-slate-400">
              Moved from profile view
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {progressCards.map((card) => (
              <div
                key={card.label}
                className="bg-white/90 border border-white/60 rounded-2xl p-5 shadow-sm"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {card.label}
                </p>
                <p className="text-lg font-semibold text-slate-800 mt-2">
                  {card.value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{card.meta}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white/90 border border-white/60 rounded-2xl p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Recent lesson
              </p>
              <p className="text-lg font-semibold text-slate-800 mt-2">
                Solving linear equations
              </p>
              <p className="text-xs text-slate-500 mt-1">
                mastery: {Math.round(model.priorSkillMastery * 100)}%
              </p>
              <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
                Resume
                <PlayCircle size={16} />
              </button>
            </div>

            <div className="bg-white/90 border border-white/60 rounded-2xl p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Previously learned
              </p>
              <h3 className="text-lg font-semibold text-slate-800 mt-2">
                Algebra Essentials
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Completed · 12 lessons · mastery 96%
              </p>
              <button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">
                Pin to top
                <Pin size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentModelDashboard;

