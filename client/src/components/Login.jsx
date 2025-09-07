import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  Dialog,
  DialogContent,
} from '@mui/material';
import { useAuth } from '../context/index.js';
import { useNavigate } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await login(formData);
      // response may be { success, data: user } or { success, user }
      const user = response?.data || response?.user || response;

      // Redirect based on role
      const role = user?.role;
      switch (role) {
        case 'customer':
          navigate('/customer/dashboard');
          break;
        case 'agent':
          navigate('/agent/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
          />
          <Box sx={{ textAlign: 'right', mt: 1 }}>
            <Button
              onClick={() => setForgotOpen(true)}
              sx={{ textTransform: 'none', fontSize: '0.9rem' }}
            >
              Forgot password?
            </Button>
          </Box>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Button
              onClick={() => navigate('/register')}
              sx={{ textTransform: 'none' }}
            >
              Don't have an account? Register here
            </Button>
          </Box>
        </Box>
      </Box>
  <Dialog className="dialog-animated" open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="modal-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Forgot password</span>
          <IconButton size="small" onClick={() => setForgotOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <ForgotPassword formId="forgot-form" onClose={() => setForgotOpen(false)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForgotOpen(false)}>Cancel</Button>
          <Button type="submit" form="forgot-form" variant="contained">Send</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login;
