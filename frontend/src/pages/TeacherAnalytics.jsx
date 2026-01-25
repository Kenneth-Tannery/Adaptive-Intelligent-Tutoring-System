import React from 'react';
import { AlertCircle, BarChart3, Users } from 'lucide-react';
import TopNav from '../components/TopNav.jsx';

const classMetrics = [
  { label: 'class_avg_performance', value: '72%' },
  { label: 'relative_to_class', value: '+8%' },
  { label: 'peer_comparison_percentile', value: '84th' },
];

const riskIndicators = [
  { label: 'dropout_risk', value: '0.18' },
  { label: 'wheel_spinning_indicator', value: '3 students' },
  { label: 'assignment_completion_rate', value: '0.64' },
];

const teacherSignals = [
  { label: 'teacher_engagement', value: '0.71' },
  { label: 'teacher_feedback_rate', value: '0.32' },
  { label: 'received_teacher_feedback', value: '14 events' },
];

const TeacherAnalytics = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-rose-50 text-slate-900">
    <TopNav />
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Teacher Insights
          </p>
          <h1 className="text-3xl font-bold text-slate-800 mt-2">
            Class & Teacher Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Phase 2.5 + Phase 4 features for instructor decisions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-100 px-3 py-2 rounded-full">
          <Users size={16} />
          Class 6B
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-white/80 border border-white/50 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-800">
              Class Performance
            </h2>
          </div>
          <div className="space-y-4 text-sm">
            {classMetrics.map((metric) => (
              <div key={metric.label} className="flex justify-between">
                <span className="text-slate-500">{metric.label}</span>
                <span className="font-semibold text-slate-800">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white/80 border border-white/50 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-800">
              Risk Indicators
            </h2>
          </div>
          <div className="space-y-4 text-sm">
            {riskIndicators.map((metric) => (
              <div key={metric.label} className="flex justify-between">
                <span className="text-slate-500">{metric.label}</span>
                <span className="font-semibold text-slate-800">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white/80 border border-white/50 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-emerald-500" />
            <h2 className="text-lg font-semibold text-slate-800">
              Teacher Signals
            </h2>
          </div>
          <div className="space-y-4 text-sm">
            {teacherSignals.map((metric) => (
              <div key={metric.label} className="flex justify-between">
                <span className="text-slate-500">{metric.label}</span>
                <span className="font-semibold text-slate-800">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8 bg-white/80 border border-white/50 rounded-3xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          At-Risk Students (sample)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {['S-1042', 'S-1099', 'S-1113'].map((student) => (
            <div
              key={student}
              className="bg-rose-50 border border-rose-100 rounded-2xl p-4"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-rose-400">
                student_id
              </p>
              <p className="text-lg font-semibold text-rose-700 mt-2">
                {student}
              </p>
              <p className="text-[11px] text-rose-500 mt-1">
                dropout_risk &gt; 0.3
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);

export default TeacherAnalytics;
