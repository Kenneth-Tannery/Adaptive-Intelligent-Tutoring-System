import React from 'react';
import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
  Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MenuBookIcon from '@mui/icons-material/MenuBook';

const palette = {
  navy: '#0D173B',
  sky: '#4AB7E0',
  gold: '#E2D64B',
  teal: '#2D6668',
  beige: '#C2C19F',
};

const CourseList = ({ courses, expandedCourseId, setExpandedCourseId }) => (
  <Box component="section" sx={{ mt: 5 }}>
    <Stack spacing={2}>
      {courses.map((course) => {
        const expanded = course.id === expandedCourseId;
        const courseProgress = Math.round(course.progress * 100);
        const moduleTitle = course.module ?? `${course.title}: Fundamentals`;
        const lessons =
          course.lessons ??
          [
            { label: 'Lesson', name: 'Core concepts', locked: false },
            { label: 'Project', name: 'Guided practice', locked: true },
            { label: 'Quiz', name: 'Module checkpoint', locked: true },
          ];

        return (
          <Paper
            key={course.id}
            variant="outlined"
            sx={{
              borderRadius: 2,
              borderColor: 'rgba(255, 255, 255, 0.6)',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
              overflow: 'hidden',
            }}
          >
            {!expanded && (
              <Button
                onClick={() => setExpandedCourseId(course.id)}
                fullWidth
                sx={{
                  justifyContent: 'space-between',
                  px: 3,
                  py: 2.5,
                  textTransform: 'none',
                  color: 'inherit',
                }}
              >
                <Box textAlign="left">
                  <Typography variant="caption" sx={{ letterSpacing: '0.2em', color: palette.teal }}>
                    Course
                  </Typography>
                  <Typography variant="h6" fontWeight={600} color={palette.navy}>
                    {course.title}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ width: 120 }}>
                    <LinearProgress
                      variant="determinate"
                      value={courseProgress}
                      sx={{
                        height: 6,
                        borderRadius: 6,
                        backgroundColor: 'rgba(148, 163, 184, 0.3)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: palette.sky,
                        },
                      }}
                    />
                  </Box>
                  <Typography variant="body2" fontWeight={600} color={palette.navy}>
                    {courseProgress}%
                  </Typography>
                  <ExpandMoreIcon sx={{ color: palette.teal }} />
                </Stack>
              </Button>
            )}

            {expanded && (
              <>
                <Box sx={{ px: 3, pt: 3, pb: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Box>
                      <Typography variant="caption" sx={{ letterSpacing: '0.2em', color: palette.teal }}>
                        Keep learning
                      </Typography>
                      <Typography variant="h5" fontWeight={600} color={palette.navy} mt={1}>
                        {course.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Current Module: {moduleTitle}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box textAlign="right">
                        <Typography variant="caption" sx={{ letterSpacing: '0.2em', color: palette.teal }}>
                          progress
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color={palette.navy}>
                          {courseProgress}%
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={() => setExpandedCourseId(null)}
                        size="small"
                        sx={{ border: '1px solid rgba(194,193,159,0.6)' }}
                        aria-label="Collapse course"
                      >
                        <ExpandMoreIcon sx={{ transform: 'rotate(180deg)', color: palette.teal }} />
                      </IconButton>
                    </Stack>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={courseProgress}
                    sx={{
                      mt: 2,
                      height: 8,
                      borderRadius: 6,
                      backgroundColor: 'rgba(194, 193, 159, 0.35)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: palette.gold,
                      },
                    }}
                  />
                </Box>

                <Divider />

                <Box sx={{ px: 3, py: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} lg={8}>
                      <Paper
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          borderColor: 'rgba(226,232,240,0.9)',
                          p: 3,
                          height: '100%',
                        }}
                      >
                        <Typography variant="caption" sx={{ letterSpacing: '0.2em', color: palette.teal }}>
                          Course
                        </Typography>
                        <Typography variant="h6" fontWeight={600} color={palette.navy} mt={1}>
                          {course.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                          {moduleTitle}
                        </Typography>

                        <Stack spacing={2} mt={3}>
                          {lessons.map((lesson) => (
                            <Paper
                              key={lesson.name}
                              variant="outlined"
                              sx={{
                                borderRadius: 2,
                                borderColor: 'rgba(226,232,240,0.9)',
                                px: 2,
                                py: 1.5,
                              }}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                  <Typography variant="caption" sx={{ letterSpacing: '0.2em', color: palette.teal }}>
                                    {lesson.label}
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600} color={palette.navy} mt={0.5}>
                                    {lesson.name}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  {lesson.locked ? 'Locked' : 'Active'}
                                </Typography>
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>

                        <Button
                          variant="outlined"
                          sx={{
                            mt: 3,
                            textTransform: 'none',
                            borderRadius: 2,
                            borderColor: palette.sky,
                            color: palette.sky,
                          }}
                          endIcon={<ArrowForwardIcon />}
                        >
                          Start module practice
                        </Button>
                        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                          {course.practiced ?? '0 / 3 concepts practiced'}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} lg={4}>
                      <Paper
                        sx={{
                          borderRadius: 2,
                          border: '1px solid rgba(252, 211, 77, 0.6)',
                          backgroundColor: 'rgba(254, 243, 199, 0.7)',
                          p: 3,
                        }}
                      >
                        <Typography variant="caption" sx={{ letterSpacing: '0.2em', color: palette.teal }}>
                          Make a study plan
                        </Typography>
                        <Typography variant="body2" color="text.primary" mt={1}>
                          Build a learning rhythm that fits your schedule.
                        </Typography>
                        <Stack direction="row" spacing={2} mt={2}>
                          <Button
                            variant="contained"
                            sx={{
                              textTransform: 'none',
                              borderRadius: 2,
                              backgroundColor: palette.gold,
                              color: palette.navy,
                              boxShadow: 'none',
                              '&:hover': { backgroundColor: palette.gold },
                            }}
                          >
                            Make a plan
                          </Button>
                          <Button variant="text" sx={{ textTransform: 'none', color: palette.navy }}>
                            Dismiss
                          </Button>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ px: 3, py: 2 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                  <MenuBookIcon sx={{ color: palette.teal }} />
                  <Typography variant="caption" color="text.secondary">
                    Start practice session - 0/1 today
                  </Typography>
                </Stack>
                <Button
                  component="a"
                  href="/worksheet/course"
                  variant="contained"
                  sx={{
                    textTransform: 'none',
                    borderRadius: 999,
                    backgroundColor: palette.sky,
                    '&:hover': { backgroundColor: palette.sky },
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Resume
                </Button>
                </Stack>
              </>
            )}
          </Paper>
        );
      })}
    </Stack>

    <Button
      variant="text"
      sx={{ mt: 2, textTransform: 'none', color: palette.sky }}
      endIcon={<ArrowForwardIcon />}
    >
      View all learning in progress
    </Button>
  </Box>
);

export default CourseList;
