import React from 'react';
import {
  Box,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const palette = {
  navy: '#0D173B',
  sky: '#4AB7E0',
  sage: '#84AC64',
  teal: '#2D6668',
};

const panelStyles = {
  borderRadius: 3,
  border: '1px solid rgba(255, 255, 255, 0.6)',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
  p: 3,
  height: '100%',
};

const StatsSection = ({ timePatternCards }) => (
  <Box component="section" sx={{ mt: 2 }}>
    <Grid container spacing={3} alignItems="stretch">
      <Grid item xs={12} lg={6}>
        <Paper sx={panelStyles}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
            <ShowChartIcon sx={{ color: palette.sky }} />
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Learning Rate Indicators
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Improvement Rate
              </Typography>
              <Typography variant="caption" color="text.secondary">
                +0.12 (rolling mean)
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={65}
              sx={{
                height: 8,
                borderRadius: 6,
                backgroundColor: 'rgba(148, 163, 184, 0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: palette.sky,
                },
              }}
            />

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Mastery Speed
              </Typography>
              <Typography variant="caption" color="text.secondary">
                9 attempts to streak
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={52}
              sx={{
                height: 8,
                borderRadius: 6,
                backgroundColor: 'rgba(148, 163, 184, 0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: palette.sage,
                },
              }}
            />
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} lg={6}>
        <Paper sx={panelStyles}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
            <AccessTimeIcon sx={{ color: palette.teal }} />
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Time-on-Task Patterns
            </Typography>
          </Stack>

          <Grid container spacing={2}>
            {timePatternCards.map((card) => (
              <Grid item xs={12} sm={4} key={card.label}>
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor: 'rgba(226, 232, 240, 0.9)',
                    p: 2,
                    height: '100%',
                    minHeight: 96,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="body2" fontWeight={600} color={palette.navy}>
                    {card.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color={palette.navy}>
                    {card.value}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  </Box>
);

export default StatsSection;
