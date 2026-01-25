import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const StudentModelContext = createContext(null);

const TOTAL_HINTS = 3;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const initialModel = {
  studentId: 'S-1042',
  skillName: '6.EE.A.1',
  zpdStatus: 'challenge',
  priorSkillMastery: 0.84,
  learningVelocity: 0.06,
  attemptCount: 0,
  errorCount: 0,
  timeOnTask: 75,
  hintCount: 0,
};

export const StudentModelProvider = ({ children }) => {
  const [model, setModel] = useState(initialModel);

  const recordAttempt = useCallback(({ correct }) => {
    setModel((prev) => {
      const masteryDelta = correct ? 0.07 : -0.02;
      const nextMastery = clamp(prev.priorSkillMastery + masteryDelta, 0, 1);
      const nextLearningVelocity = nextMastery - prev.priorSkillMastery;

      return {
        ...prev,
        attemptCount: prev.attemptCount + 1,
        errorCount: correct ? prev.errorCount : prev.errorCount + 1,
        priorSkillMastery: nextMastery,
        learningVelocity: nextLearningVelocity,
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
    }));
  }, []);

  const setBktSnapshot = useCallback(
    ({ priorSkillMastery, learningVelocity, attemptCount }) => {
      setModel((prev) => ({
        ...prev,
        priorSkillMastery:
          priorSkillMastery ?? prev.priorSkillMastery,
        learningVelocity: learningVelocity ?? prev.learningVelocity,
        attemptCount: attemptCount ?? prev.attemptCount,
      }));
    },
    []
  );

  const value = useMemo(
    () => ({
      model,
      totalHints: TOTAL_HINTS,
      recordAttempt,
      useHint,
      resetHints,
      setTimeOnTask,
      tickTimeOnTask,
      setSkillContext,
      setBktSnapshot,
    }),
    [
      model,
      recordAttempt,
      resetHints,
      setBktSnapshot,
      setSkillContext,
      setTimeOnTask,
      tickTimeOnTask,
      useHint,
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
