import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Workspace from './pages/Workspace.jsx';
import StudentModelDashboard from './pages/StudentModelDashboard.jsx';
import Assignments from './pages/Assignments.jsx';
import Profile from './pages/Profile.jsx';
import AssignmentWorksheet from './pages/AssignmentWorksheet.jsx';
import Login from './pages/Login.jsx';
import { useStudentModel } from './state/studentModelContext.jsx';
import { supabase } from './lib/supabaseClient.js';

const RequireStudent = ({ children, session }) => {
  const { model } = useStudentModel();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  if (!model.studentId) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }
      setSession(data.session);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireStudent session={session}>
              <StudentModelDashboard />
            </RequireStudent>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireStudent session={session}>
              <Profile />
            </RequireStudent>
          }
        />
        <Route
          path="/worksheet"
          element={
            <RequireStudent session={session}>
              <Workspace />
            </RequireStudent>
          }
        />
        <Route
          path="/worksheet/:assignmentId"
          element={
            <RequireStudent session={session}>
              <AssignmentWorksheet />
            </RequireStudent>
          }
        />
        <Route
          path="/student/:studentId/model"
          element={
            <RequireStudent session={session}>
              <StudentModelDashboard />
            </RequireStudent>
          }
        />
        <Route
          path="/assignments"
          element={
            <RequireStudent session={session}>
              <Assignments />
            </RequireStudent>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
