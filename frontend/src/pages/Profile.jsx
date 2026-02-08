import React, { useEffect, useState } from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import TopNav from '../components/TopNav.jsx';
import StatsSection from '../components/profile/StatsSection.jsx';
import CourseList from '../components/profile/CourseList.jsx';
import { useStudentModel } from '../state/studentModelContext.jsx';
import { fetchCourses } from '../services/api.js';

const Profile = () => {
  const { model } = useStudentModel();
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [courses, setCourses] = useState([]);

  const fallbackCourses = [
    {
      id: 'math-foundations',
      title: 'Math Foundations',
      module: 'Linear Equations',
      progress: 0.32,
      status: 'In Progress',
    },
    {
      id: 'ratios-proportions',
      title: 'Ratios & Proportions',
      module: 'Unit Rates',
      progress: 0.18,
      status: 'In Progress',
    },
    {
      id: 'exponents-powers',
      title: 'Exponents & Powers',
      module: 'Powers of 10',
      progress: 0.24,
      status: 'In Progress',
    },
    {
      id: 'number-sense',
      title: 'Number Sense',
      module: 'Integers & Operations',
      progress: 0.12,
      status: 'In Progress',
    },
  ];

  const timePatternCards = [
    {
      label: 'Time on Task',
      value: `${Math.floor(model.timeOnTask / 60)}m ${model.timeOnTask % 60}s`,
    },
    {
      label: 'Persistence Score',
      value: `${(model.timeOnTask / Math.max(model.attemptCount, 1)).toFixed(1)}%`,
    },
    {
      label: 'Time Between Attempts',
      value: '42s (avg)',
    },
  ];

  useEffect(() => {
    let active = true;
    const loadCourses = async () => {
      try {
        const data = await fetchCourses({ studentId: model.studentId });
        if (!active) {
          return;
        }
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
          return;
        }
      } catch (error) {
        // Fallback to default courses.
      }
      if (active) {
        setCourses(fallbackCourses);
      }
    };

    if (model.studentId) {
      loadCourses();
    }
    return () => {
      active = false;
    };
  }, [model.studentId, model.snapshotVersion]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, rgba(255, 251, 235, 0.9) 0%, rgba(255, 241, 242, 0.9) 45%, rgba(238, 242, 255, 0.9) 100%)',
        color: '#0f172a',
      }}
    >
      <TopNav />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
        <Stack spacing={1} mb={4}>
          <Typography
            variant="caption"
            sx={{
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: '#2D6668',
            }}
          >
            Student Profile
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ color: '#0D173B' }}>
            {model.studentId} - Progress Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Highlights previous lessons, current module, and topic completion.
          </Typography>
        </Stack>

        <StatsSection timePatternCards={timePatternCards} />
        <CourseList
          courses={courses}
          expandedCourseId={expandedCourseId}
          setExpandedCourseId={setExpandedCourseId}
        />
      </Container>
    </Box>
  );
};

export default Profile;
