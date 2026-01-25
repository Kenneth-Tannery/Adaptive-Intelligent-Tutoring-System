import React, { useState } from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import TopNav from '../components/TopNav.jsx';
import StatsSection from '../components/profile/StatsSection.jsx';
import CourseList from '../components/profile/CourseList.jsx';
import { useStudentModel } from '../state/studentModelContext.jsx';

const courses = [
  {
    id: 'course-1',
    title: 'Learn C#',
    module: 'Learn C#: Logic',
    progress: 0.3,
    status: 'In Progress',
    lessons: [
      { label: 'Lesson', name: 'Understanding Logic in C#', locked: false },
      { label: 'Project', name: 'Space Expedition Boolean Adventure', locked: true },
      { label: 'Quiz', name: 'C# Logic', locked: true },
    ],
    practiced: '0 / 3 concepts practiced',
  },
  {
    id: 'course-2',
    title: 'Learn Python 3',
    progress: 0.21,
  },
  {
    id: 'course-3',
    title: 'Analyze Data with SQL',
    progress: 0.16,
  },
  {
    id: 'course-4',
    title: 'Learn C',
    progress: 0.25,
  },
];

const Profile = () => {
  const { model } = useStudentModel();
  const [expandedCourseId, setExpandedCourseId] = useState(null);

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
