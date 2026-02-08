import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TopNav from '../components/TopNav.jsx';
import { useStudentModel } from '../state/studentModelContext.jsx';
import { fetchAssignments } from '../services/api.js';

const palette = {
  navy: '#0D173B',
  sky: '#4AB7E0',
  sage: '#84AC64',
  gold: '#E2D64B',
  teal: '#2D6668',
  beige: '#C2C19F',
};

const fallbackAssignments = [
  {
    id: 'A-101',
    name: 'Linear Equations Skill Builder',
    assignmentType: 'Skill Builder',
    skills: ['6.EE.A.1', '6.EE.A.2'],
    problemCount: 12,
    completionRate: 0.72,
    startTime: '2026-01-24 09:10',
    sessionDuration: '38m',
  },
  {
    id: 'A-102',
    name: 'Ratio Reasoning Problem Set',
    assignmentType: 'Problem Set',
    skills: ['7.RP.A.2'],
    problemCount: 18,
    completionRate: 0.54,
    startTime: '2026-01-25 08:45',
    sessionDuration: '42m',
  },
  {
    id: 'A-103',
    name: 'Expressions & Properties',
    assignmentType: 'Problem Set',
    skills: ['6.EE.A.3'],
    problemCount: 15,
    completionRate: 0.63,
    startTime: '2026-01-23 14:20',
    sessionDuration: '35m',
  },
];

const Assignments = () => {
  const { model } = useStudentModel();
  const [assignments, setAssignments] = useState(fallbackAssignments);

  useEffect(() => {
    let active = true;
    const loadAssignments = async () => {
      try {
        const data = await fetchAssignments({ studentId: model.studentId });
        if (!active) {
          return;
        }
        if (Array.isArray(data) && data.length > 0) {
          setAssignments(data);
          return;
        }
      } catch (error) {
        // Keep fallback assignments.
      }
      if (active) {
        setAssignments(fallbackAssignments);
      }
    };

    if (model.studentId) {
      loadAssignments();
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
        color: palette.navy,
      }}
    >
      <TopNav />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'center' }} justifyContent="space-between" mb={4}>
          <Box>
            <Typography
              variant="caption"
              sx={{ letterSpacing: '0.35em', textTransform: 'uppercase', color: palette.teal }}
            >
              Assignment Context
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: palette.navy, mt: 1 }}>
              Assignments
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Track assignment type, problem count, and completion progress for every session.
            </Typography>
          </Box>
          <Chip
            icon={<CalendarTodayIcon sx={{ color: palette.sky }} />}
            label="Active Assignments"
            sx={{
              bgcolor: 'rgba(74, 183, 224, 0.18)',
              color: palette.navy,
              fontWeight: 600,
              px: 1.5,
            }}
          />
        </Stack>

        <Stack spacing={3}>
          {assignments.map((assignment) => {
            const completionRate =
              assignment.completion_rate ?? assignment.completionRate ?? 0;
            const assignmentType =
              assignment.assignment_type ?? assignment.assignmentType ?? 'Practice';
            const problemCount =
              assignment.problem_count ?? assignment.problemCount ?? 0;
            const skills = assignment.skills ?? [];
            const sessionDuration =
              assignment.session_duration ?? assignment.sessionDuration ?? '—';
            const status = assignment.status ?? 'Not Started';
            return (
              <Paper
                key={assignment.id}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: 'rgba(194, 193, 159, 0.6)',
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
                  p: { xs: 2.5, md: 3 },
                }}
              >
                <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" fontWeight={600} sx={{ color: palette.navy, mt: 1 }}>
                      {assignment.name}
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        Assignment ID: {assignment.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {assignmentType}
                      </Typography>
                    </Stack>
                  </Box>
                  <Box minWidth={{ xs: '100%', lg: 220 }}>
                    <Typography variant="caption" sx={{ letterSpacing: '0.2em', color: palette.teal }}>
                      Completion Rate
                    </Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ color: palette.navy, mt: 0.5 }}>
                      {Math.round(completionRate * 100)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={completionRate * 100}
                      sx={{
                        mt: 1,
                        height: 8,
                        borderRadius: 6,
                        backgroundColor: 'rgba(194, 193, 159, 0.35)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: palette.sky,
                        },
                      }}
                    />
                    <Button
                      component={RouterLink}
                      to={`/worksheet/${assignment.id}`}
                      variant="contained"
                      sx={{
                        mt: 2,
                        textTransform: 'none',
                        borderRadius: 999,
                        backgroundColor: palette.sky,
                        '&:hover': { backgroundColor: palette.sky },
                      }}
                      endIcon={<ArrowForwardIcon />}
                    >
                      Start
                    </Button>
                  </Box>
                </Stack>

                <Divider sx={{ my: 3, borderColor: 'rgba(194, 193, 159, 0.4)' }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Paper
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        borderColor: 'rgba(226,232,240,0.9)',
                        p: 2,
                        height: '100%',
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <MenuBookIcon sx={{ color: palette.sky }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.2em' }}>
                            Problem Count
                          </Typography>
                          <Typography variant="h6" fontWeight={600} sx={{ color: palette.navy, mt: 0.5 }}>
                            {problemCount}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        borderColor: 'rgba(226,232,240,0.9)',
                        p: 2,
                        height: '100%',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.2em' }}>
                        Skills
                      </Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color: palette.navy, mt: 1 }}>
                        {skills.length ? skills.join(', ') : '—'}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Paper
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        borderColor: 'rgba(226,232,240,0.9)',
                        p: 2,
                        height: '100%',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.2em' }}>
                        Session Duration
                      </Typography>
                      <Typography variant="h6" fontWeight={600} sx={{ color: palette.navy, mt: 0.5 }}>
                        {sessionDuration}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Paper
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        borderColor: 'rgba(226,232,240,0.9)',
                        p: 2,
                        height: '100%',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CheckCircleIcon sx={{ color: palette.sage }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.2em' }}>
                            Status
                          </Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ color: palette.navy, mt: 0.5 }}>
                            {status}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>

              </Paper>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
};

export default Assignments;
