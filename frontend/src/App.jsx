import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Workspace from './pages/Workspace.jsx';
import StudentModelDashboard from './pages/StudentModelDashboard.jsx';
import Assignments from './pages/Assignments.jsx';
import Profile from './pages/Profile.jsx';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<StudentModelDashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/worksheet" element={<Workspace />} />
      <Route path="/student/:studentId/model" element={<StudentModelDashboard />} />
      <Route path="/assignments" element={<Assignments />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
