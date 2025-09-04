import React, { useState } from 'react';
import { Box, Typography, Container, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileTab from './ProfileTab';
import AdminUsers from './AdminUsers';
import AdminAgents from './AdminAgents';
import DashboardLayout from './DashboardLayout';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  const handleTabChange = (e, value) => setTab(value);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
  <DashboardLayout user={user} tab={tab} onTabChange={handleTabChange} onLogout={handleLogout} titlePrefix={'Welcome, Admin'} extraTabs={["Users", "Agents"]} fullWidthChildren={true}>
      {tab === 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Administrator Dashboard
          </Typography>
          <Box sx={{ mt: 2 }}>
            {/* main admin content here */}
          </Box>
        </>
      )}

  {tab === 1 && <ProfileTab user={user} />}

  {tab === 2 && <AdminUsers />}

  {tab === 3 && <AdminAgents />}
    </DashboardLayout>
  );
};

export default AdminDashboard;
