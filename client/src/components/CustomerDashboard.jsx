import React, { useState } from 'react';
import { Box, Typography, Container, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileTab from './ProfileTab';
import DashboardLayout from './DashboardLayout';

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  const handleTabChange = (e, value) => setTab(value);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <DashboardLayout user={user} tab={tab} onTabChange={handleTabChange} onLogout={handleLogout} titlePrefix={'Welcome,'}>
      {tab === 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Customer Dashboard
          </Typography>
          <Box sx={{ mt: 2 }}>
            {/* main customer content here */}
          </Box>
        </>
      )}

      {tab === 1 && <ProfileTab user={user} />}
    </DashboardLayout>
  );
};

export default CustomerDashboard;
