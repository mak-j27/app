import React from 'react';
import { Box, Typography, Grid, Paper, Avatar, List, ListItem, ListItemText } from '@mui/material';

const ProfileTab = ({ user }) => {
  if (!user) return <Typography>Loading...</Typography>;

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <Paper sx={{ p: 3 }} elevation={1}>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Avatar sx={{ width: 72, height: 72 }}>{initials}</Avatar>
        </Grid>
        <Grid item xs>
          <Typography variant="h6">{user.firstName} {user.lastName}</Typography>
          <Typography variant="body2" color="text.secondary">{user.email}</Typography>
          <Typography variant="body2" color="text.secondary">{user.phone}</Typography>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Profile Details</Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="Role" secondary={user.role} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Joined" secondary={new Date(user.createdAt).toLocaleString()} />
          </ListItem>
          {user.address && (
            <>
              <ListItem>
                <ListItemText primary="Address" secondary={`${user.address.doorNo}, ${user.address.street}, ${user.address.area}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary="City / State / Pincode" secondary={`${user.address.city} / ${user.address.state} / ${user.address.pincode}`} />
              </ListItem>
            </>
          )}

          {user.role === 'agent' && (
            <>
              <ListItem>
                <ListItemText primary="Available" secondary={user.available ? 'Yes' : 'No'} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Rating" secondary={user.rating ?? 'N/A'} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Total Deliveries" secondary={user.totalDeliveries ?? 0} />
              </ListItem>
            </>
          )}

          {user.role === 'customer' && (
            <>
              <ListItem>
                <ListItemText primary="Orders" secondary={(user.orders || []).length} />
              </ListItem>
            </>
          )}

        </List>
      </Box>
    </Paper>
  );
};

export default ProfileTab;
