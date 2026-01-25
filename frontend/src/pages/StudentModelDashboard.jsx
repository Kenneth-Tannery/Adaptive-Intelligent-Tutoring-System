import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
      label: 'Prior Skill Mastery',
      value: formatPercent(model.priorSkillMastery),
    },
    {
      label: 'Learning Velocity',
      value: formatPercent(model.learningVelocity),
    },
    {
      label: 'Skill Attempt Number',
      value: model.attemptCount,
    },
  ];

  const progressCards = [
    {
      label: 'Current Progressing Skill',
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
    },
  ];

  const coursesInProgress = [
    { id: 'course-1', title: 'Learn C#', module: 'Learn C#: Logic', progress: 0.3 },
    { id: 'course-2', title: 'Learn Python 3', module: 'Python fundamentals', progress: 0.21 },
    { id: 'course-3', title: 'Analyze Data with SQL', module: 'Query basics', progress: 0.16 },
    { id: 'course-4', title: 'Learn C', module: 'Pointers and memory', progress: 0.25 },
  ];

  const recentWorksheetId = 'A-101';


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
              Welcome back student {model.studentId}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Live snapshot for student {model.studentId}'s learning progress and performance.
            </p>
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
              className="bg-white/95 border border-slate-200/80 rounded-2xl p-4 shadow-sm min-h-[96px] flex flex-col justify-between"
            >
              <p className="text-sm font-semibold text-slate-700">{card.label}</p>
              <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            </div>
          ))}
        </section>


        <section className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="text-rose-500" />
            <h2 className="text-lg font-semibold text-slate-800">
              Student Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {progressCards.map((card) => (
              <div
                key={card.label}
                className="bg-white/95 border border-slate-200/80 rounded-2xl p-4 shadow-sm min-h-[96px] flex flex-col justify-between"
              >
                <p className="text-sm font-semibold text-slate-700">{card.label}</p>
                <p className="text-lg font-semibold text-slate-800">{card.value}</p>
                {card.meta ? (
                  <p className="text-xs text-slate-500">{card.meta}</p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white/95 border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-700">Recent lesson</p>
              <p className="text-lg font-semibold text-slate-800 mt-2">
                Solving linear equations
              </p>
              <p className="text-xs text-slate-500 mt-1">
                mastery: {Math.round(model.priorSkillMastery * 100)}%
              </p>
              <RouterLink
                to={`/worksheet/${recentWorksheetId}`}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                Resume
                <PlayCircle size={16} />
              </RouterLink>
            </div>

            <div className="bg-white/95 border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-700">Previously learned</p>
              <h3 className="text-lg font-semibold text-slate-800 mt-2">
                Algebra Essentials
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Completed - 12 lessons - mastery 96%
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Courses in Progress</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coursesInProgress.map((course) => (
                <div
                  key={course.title}
                  className="bg-white/95 border border-slate-200/80 rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Course</p>
                      <p className="text-lg font-semibold text-slate-800 mt-2">
                        {course.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{course.module}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {Math.round(course.progress * 100)}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400"
                      style={{ width: `${Math.round(course.progress * 100)}%` }}
                    />
                  </div>
                  <RouterLink
                    to={`/worksheet/${course.id}`}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                  >
                    Resume
                    <PlayCircle size={16} />
                  </RouterLink>
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

