import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const StudentModelContext = createContext(null);

const TOTAL_HINTS = 3;
const STUDENT_ID_STORAGE_KEY = 'aits_student_id';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getStoredStudentId = () => {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.localStorage.getItem(STUDENT_ID_STORAGE_KEY) ?? '';
};

const createInitialModel = () => ({
  studentId: getStoredStudentId(),
  skillName: '6.EE.A.1',
  zpdStatus: 'challenge',
  baselineZpdStatus: 'challenge',
  priorSkillMastery: 0.0,
  learningVelocity: 0.0,
  attemptCount: 0,
  errorCount: 0,
  timeOnTask: 75,
  hintCount: 0,
  interventionActive: false,
  recoveryStreak: 0,
  snapshotVersion: 0,
});

export const StudentModelProvider = ({ children }) => {
  const [model, setModel] = useState(createInitialModel);

  const recordAttempt = useCallback(({ correct }) => {
    setModel((prev) => {
      return {
        ...prev,
        attemptCount: prev.attemptCount + 1,
        errorCount: correct ? prev.errorCount : prev.errorCount + 1,
      };
    });
  }, []);

  const useHint = useCallback(() => {
    setModel((prev) => ({
      ...prev,
      hintCount: Math.min(prev.hintCount + 1, TOTAL_HINTS),
    }));
  }, []);

  const resetHints = useCallback(() => {
    setModel((prev) => ({ ...prev, hintCount: 0 }));
  }, []);

  const resetAttempts = useCallback(() => {
    setModel((prev) => ({ ...prev, attemptCount: 0, errorCount: 0 }));
  }, []);

  const setTimeOnTask = useCallback((nextSeconds) => {
    setModel((prev) => ({ ...prev, timeOnTask: nextSeconds }));
  }, []);

  const tickTimeOnTask = useCallback((seconds = 1) => {
    setModel((prev) => ({ ...prev, timeOnTask: prev.timeOnTask + seconds }));
  }, []);

  const setSkillContext = useCallback(({ skillName, zpdStatus }) => {
    setModel((prev) => ({
      ...prev,
      skillName: skillName ?? prev.skillName,
      zpdStatus: zpdStatus ?? prev.zpdStatus,
      baselineZpdStatus: prev.interventionActive
        ? prev.baselineZpdStatus
        : zpdStatus ?? prev.zpdStatus,
    }));
  }, []);

  const setStudentId = useCallback((studentId) => {
    setModel((prev) => ({
      ...prev,
      studentId,
      attemptCount: 0,
      errorCount: 0,
      timeOnTask: 0,
      hintCount: 0,
      interventionActive: false,
      recoveryStreak: 0,
      baselineZpdStatus: prev.zpdStatus,
      snapshotVersion: 0,
    }));
    if (typeof window !== 'undefined') {
      if (studentId) {
        window.localStorage.setItem(STUDENT_ID_STORAGE_KEY, studentId);
      } else {
        window.localStorage.removeItem(STUDENT_ID_STORAGE_KEY);
      }
    }
  }, []);

  const setBktSnapshot = useCallback(
    ({ priorSkillMastery, learningVelocity, interventionActive, recoveryStreak }) => {
      setModel((prev) => {
        const next = {
          ...prev,
          priorSkillMastery: priorSkillMastery ?? prev.priorSkillMastery,
          learningVelocity: learningVelocity ?? prev.learningVelocity,
          snapshotVersion: prev.snapshotVersion + 1,
        };

        if (typeof interventionActive === 'boolean') {
          if (interventionActive && !prev.interventionActive) {
            next.interventionActive = true;
            next.recoveryStreak = recoveryStreak ?? 0;
            next.baselineZpdStatus = prev.zpdStatus;
            next.zpdStatus = 'support';
          } else if (!interventionActive && prev.interventionActive) {
            next.interventionActive = false;
            next.recoveryStreak = 0;
            next.zpdStatus = prev.baselineZpdStatus;
          } else {
            next.interventionActive = interventionActive;
            next.recoveryStreak = recoveryStreak ?? prev.recoveryStreak;
          }
        }

        return next;
      });
    },
    []
  );

  const startIntervention = useCallback(() => {
    setModel((prev) => {
      if (prev.interventionActive) {
        return prev;
      }
      return {
        ...prev,
        interventionActive: true,
        recoveryStreak: 0,
        baselineZpdStatus: prev.zpdStatus,
        zpdStatus: 'support',
      };
    });
  }, []);

  const recordRecoveryAttempt = useCallback(({ correct, hintsUsed, maxHints }) => {
    setModel((prev) => {
      if (!prev.interventionActive) {
        return prev;
      }
      const usedMaxHints =
        typeof maxHints === 'number' && typeof hintsUsed === 'number'
          ? hintsUsed >= maxHints
          : false;
      const nextStreak = correct && !usedMaxHints ? prev.recoveryStreak + 1 : 0;
      if (nextStreak >= 3) {
        return {
          ...prev,
          interventionActive: false,
          recoveryStreak: 0,
          zpdStatus: prev.baselineZpdStatus,
        };
      }
      return { ...prev, recoveryStreak: nextStreak };
    });
  }, []);

  const value = useMemo(
    () => ({
      model,
      totalHints: TOTAL_HINTS,
      recordAttempt,
      useHint,
      resetHints,
      resetAttempts,
      setTimeOnTask,
      tickTimeOnTask,
      setSkillContext,
      setStudentId,
      setBktSnapshot,
      startIntervention,
      recordRecoveryAttempt,
    }),
    [
      model,
      recordAttempt,
      resetHints,
      resetAttempts,
      setBktSnapshot,
      setSkillContext,
      setStudentId,
      setTimeOnTask,
      tickTimeOnTask,
      useHint,
      startIntervention,
      recordRecoveryAttempt,
    ]
  );

  return <StudentModelContext.Provider value={value}>{children}</StudentModelContext.Provider>;
};

export const useStudentModel = () => {
  const context = useContext(StudentModelContext);
  if (!context) {
    throw new Error('useStudentModel must be used within StudentModelProvider');
  }
  return context;
};
