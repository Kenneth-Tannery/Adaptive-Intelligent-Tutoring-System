import React from 'react';
import { Box, Container, IconButton, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import TopNav from '../components/TopNav.jsx';
import WorksheetPanel from '../components/WorksheetPanel.jsx';

const AssignmentWorksheet = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, rgba(255, 251, 235, 0.9) 0%, rgba(255, 241, 242, 0.9) 45%, rgba(238, 242, 255, 0.9) 100%)',
        color: '#0D173B',
      }}
    >
      <TopNav />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
        <Stack spacing={1} mb={4}>
          <Typography
            variant="caption"
            sx={{ letterSpacing: '0.35em', textTransform: 'uppercase', color: '#2D6668' }}
          >
            Assignment Worksheet
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton
              onClick={() => navigate(-1)}
              size="small"
              sx={{
                color: '#0D173B',
                '&:hover': { backgroundColor: 'transparent' },
              }}
              aria-label="Go back"
            >
              <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#0D173B' }}>
              Assignment {assignmentId}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Practice problems and buddy support for this assignment.
          </Typography>
        </Stack>

        <WorksheetPanel />
      </Container>
    </Box>
  );
};

export default AssignmentWorksheet;
