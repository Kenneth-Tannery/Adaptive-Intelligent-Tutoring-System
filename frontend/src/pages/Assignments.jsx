import React from 'react';
import { BookOpen, Calendar, CheckCircle2 } from 'lucide-react';
import TopNav from '../components/TopNav.jsx';

const assignments = [
  {
    id: 'A-101',
    name: 'Linear Equations Skill Builder',
    assignmentType: 'skill_builder',
    skills: ['6.EE.A.1', '6.EE.A.2'],
    problemCount: 12,
    completionRate: 0.72,
    startTime: '2026-01-24 09:10',
  },
  {
    id: 'A-102',
    name: 'Ratio Reasoning Problem Set',
    assignmentType: 'problem_set',
    skills: ['7.RP.A.2'],
    problemCount: 18,
    completionRate: 0.54,
    startTime: '2026-01-25 08:45',
  },
  {
    id: 'A-103',
    name: 'Expressions & Properties',
    assignmentType: 'problem_set',
    skills: ['6.EE.A.3'],
    problemCount: 15,
    completionRate: 0.63,
    startTime: '2026-01-23 14:20',
  },
];

const Assignments = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-cyan-50 text-slate-900">
    <TopNav />
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Assignment Context
          </p>
          <h1 className="text-3xl font-bold text-slate-800 mt-2">
            Assignment + Skill Builder Feed
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tracks assignment_type, problem_count, release context, and
            completion metrics.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-100 px-3 py-2 rounded-full">
          <Calendar size={16} />
          Active Assignments
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-white/80 border border-white/50 rounded-3xl p-6 shadow-sm flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {assignment.assignmentType}
                </p>
                <h2 className="text-xl font-semibold text-slate-800 mt-2">
                  {assignment.name}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-500">
                  assignment_id: {assignment.id}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  start_time: {assignment.startTime}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white/90 border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
                <BookOpen className="text-indigo-500" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                    problem_count
                  </p>
                  <p className="text-lg font-semibold">
                    {assignment.problemCount}
                  </p>
                </div>
              </div>
              <div className="bg-white/90 border border-slate-100 rounded-2xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                  skills
                </p>
                <p className="text-sm font-semibold text-slate-700 mt-2">
                  {assignment.skills.join(', ')}
                </p>
              </div>
              <div className="bg-white/90 border border-slate-100 rounded-2xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                  assignment_completion_rate
                </p>
                <p className="text-lg font-semibold text-slate-800 mt-2">
                  {Math.round(assignment.completionRate * 100)}%
                </p>
              </div>
              <div className="bg-white/90 border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                    session_duration
                  </p>
                  <p className="text-lg font-semibold text-slate-800">38m</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between text-xs text-slate-500">
              <span>Feature coverage: assignment_type, release_date, due_date</span>
              <span>Skill builder filter ready</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Assignments;
