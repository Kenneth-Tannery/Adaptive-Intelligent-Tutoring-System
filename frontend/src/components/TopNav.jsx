import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Workspace' },
  { to: '/student/S-1042/model', label: 'Student Model' },
  { to: '/assignments', label: 'Assignments' },
  { to: '/teacher/T-01/analytics', label: 'Teacher Analytics' },
  { to: '/ops', label: 'Model Ops' },
];

const TopNav = () => (
  <div className="w-full bg-white/60 backdrop-blur-md border-b border-white/40">
    <div className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap gap-3 items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-700 text-white font-bold text-sm px-3 py-2 rounded-xl">
          NF
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">NeuroFlow</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Adaptive ITS
          </p>
        </div>
      </div>
      <nav className="flex flex-wrap gap-2 text-xs font-semibold">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `px-3 py-2 rounded-full transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white/70 text-slate-600 hover:bg-white'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  </div>
);

export default TopNav;
