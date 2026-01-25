import React from 'react';
import TopNav from '../components/TopNav.jsx';
import WorksheetPanel from '../components/WorksheetPanel.jsx';

const Workspace = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-teal-50 text-slate-900">
    <TopNav />
    <div className="max-w-6xl mx-auto p-6">
      <WorksheetPanel />
    </div>
  </div>
);

export default Workspace;
