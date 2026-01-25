import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Workspace from './pages/Workspace.jsx';
import StudentModelDashboard from './pages/StudentModelDashboard.jsx';
import Assignments from './pages/Assignments.jsx';
import TeacherAnalytics from './pages/TeacherAnalytics.jsx';
import Ops from './pages/Ops.jsx';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Workspace />} />
      <Route path="/student/:studentId/model" element={<StudentModelDashboard />} />
      <Route path="/assignments" element={<Assignments />} />
      <Route path="/teacher/:teacherId/analytics" element={<TeacherAnalytics />} />
      <Route path="/ops" element={<Ops />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
