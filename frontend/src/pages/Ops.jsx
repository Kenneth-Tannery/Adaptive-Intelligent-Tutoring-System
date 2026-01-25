import React from 'react';
import { Database, GitBranch, RefreshCcw } from 'lucide-react';
import TopNav from '../components/TopNav.jsx';

const Ops = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-indigo-50 text-slate-900">
    <TopNav />
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Model Ops
          </p>
          <h1 className="text-3xl font-bold text-slate-800 mt-2">
            Data + Feature Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Demonstrates how engineered features flow into the tutoring system.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 bg-teal-100 px-3 py-2 rounded-full">
          <RefreshCcw size={16} />
          Pipeline Ready
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-white/80 border border-white/50 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Database className="text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-800">
              Data Validation
            </h2>
          </div>
          <ul className="text-sm text-slate-600 space-y-2">
            <li>Load 10 relational tables</li>
            <li>Parse skills → skill_id_numeric</li>
            <li>Merge problem_logs + assignment_logs</li>
            <li>Filter for skill_builder assignments</li>
          </ul>
        </section>

        <section className="bg-white/80 border border-white/50 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <GitBranch className="text-emerald-500" />
            <h2 className="text-lg font-semibold text-slate-800">
              Feature Engineering
            </h2>
          </div>
          <ul className="text-sm text-slate-600 space-y-2">
            <li>prior_skill_mastery (BKT)</li>
            <li>learning_velocity, mastery_speed</li>
            <li>hint_abuse_score, productive_help_seeking</li>
            <li>zpd bounds + problem_in_zpd</li>
          </ul>
        </section>

        <section className="bg-white/80 border border-white/50 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCcw className="text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-800">
              Deployment Targets
            </h2>
          </div>
          <ul className="text-sm text-slate-600 space-y-2">
            <li>Frontend → Vercel</li>
            <li>Backend → Render/Railway</li>
            <li>Dataset → Supabase</li>
            <li>Evaluation → Opik traces</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
);

export default Ops;
