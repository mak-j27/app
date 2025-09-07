import React, { useState } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import "./styles/RegistrationForm.css";
import {
  Box,
  Button,
  Container,
  TextField,
  LinearProgress,
  Typography,
  Grid,
  Alert,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { getPasswordStrength } from '../utils/passwordUtils';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/index.js";

const validationSchema = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password should be at least 8 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match")
    .required("Confirm password is required"),
  phone: yup
    .string()
    .matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
    .required("Phone number is required"),
  isAgent: yup
    .boolean()
    .required("Please select whether you are a delivery agent"),

  // Address fields
  doorNo: yup.string().required("Door/Flat No. is required"),
  street: yup.string().required("Street is required"),
  area: yup.string().required("Area is required"),

  // Common fields
  city: yup.string().required("City is required"),
  state: yup.string().required("State is required"),
  pincode: yup
    .string()
    .matches(/^[0-9]{6}$/, "Pincode must be 6 digits")
    .required("Pincode is required"),
});

const RegistrationForm = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const formik = useFormik({
    initialValues: {
      // Personal Details
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      isAgent: false,

      // Address Fields
      doorNo: "",
      street: "",
      area: "",

      // Common Fields
      city: "",
      state: "",
      pincode: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setError("");
      setIsSubmitting(true);
      try {
        // Remove confirmPassword and format data based on role
        const { confirmPassword: _, isAgent, ...formData } = values;

        const role = isAgent ? "agent" : "customer";

        // Base user data for both roles
        let registerData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role,
          address: {
            doorNo: formData.doorNo,
            street: formData.street,
            area: formData.area,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          },
        };

  const response = await register(registerData);

        if (response && (response.success || response.data)) {
          setError(""); // Clear any existing errors
          setSuccess(response.message || "Registration successful!");
          setOpenDialog(true); // Show the success dialog
          // Auto-redirect after a short delay to the appropriate dashboard
          const role = response.data?.role || response.role || registerData.role;
          setTimeout(() => {
            setOpenDialog(false);
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
                navigate('/login');
            }
          }, 1800); // 1.8s so user sees dialog briefly
        } else {
          setSuccess(""); // Clear any existing success messages
          setError(response.error || "Registration failed");
        }
      } catch (err) {
        console.error("Registration error:", err);
        setError(
          err.response?.data?.message || err.message || "Registration failed"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const pwStrength = getPasswordStrength(formik.values.password);
  const strengthPercent = pwStrength.percent;
  const strengthLabel = pwStrength.label;
  const strengthColor = pwStrength.color;
  const entropy = pwStrength.entropy;

  return (
    <Container component="main" maxWidth="md">
      <Box className="container">
        {/* Header */}
        <Box className="page-header" sx={{ mb: 2 }}>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Create your account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quick and secure registration — fill the details below to get started.
          </Typography>
        </Box>

        <Box component="form" onSubmit={formik.handleSubmit} className="form" noValidate>
          <Grid container spacing={2} className="contaier">
            <Grid item xs={12}>
              <fieldset className="fieldset">
                <legend className="legend">Personal Details</legend>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="firstName"
                      name="firstName"
                      label="First Name"
                      value={formik.values.firstName}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.firstName &&
                        Boolean(formik.errors.firstName)
                      }
                      helperText={
                        formik.touched.firstName && formik.errors.firstName
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="lastName"
                      name="lastName"
                      label="Last Name"
                      value={formik.values.lastName}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.lastName &&
                        Boolean(formik.errors.lastName)
                      }
                      helperText={
                        formik.touched.lastName && formik.errors.lastName
                      }
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="email"
                      name="email"
                      label="Email Address"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.email && Boolean(formik.errors.email)
                      }
                      helperText={formik.touched.email && formik.errors.email}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="phone"
                      name="phone"
                      label="Phone Number"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.phone && Boolean(formik.errors.phone)
                      }
                      helperText={formik.touched.phone && formik.errors.phone}
                    />
                  </Grid>
                </Grid>
              </fieldset>
            </Grid>
    <Grid item xs={12}>
              <fieldset className="fieldset">
                <legend className="legend">Security Details</legend>
                <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="password"
                      name="password"
                      label="Password"
                      type="password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.password &&
                        Boolean(formik.errors.password)
                      }
                      helperText={
                        formik.touched.password && formik.errors.password
                      }
                    />
                    {/* Password strength */}
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress variant="determinate" value={strengthPercent} sx={{ height: 8, borderRadius: 2, backgroundColor: '#e6e6e6', '& .MuiLinearProgress-bar': { backgroundColor: strengthColor } }} />
                      <Typography variant="caption" sx={{ color: strengthColor, display: 'block', mt: 0.5 }}>{strengthLabel} — {pwStrength.entropy} bits</Typography>
                      {/* zxcvbn feedback */}
                      {pwStrength.feedback && (
                        <Box sx={{ mt: 1 }}>
                          {pwStrength.feedback.warning && (
                            <Typography variant="caption" sx={{ color: 'warning.main', display: 'block' }}>{pwStrength.feedback.warning}</Typography>
                          )}
                          {pwStrength.feedback.suggestions && pwStrength.feedback.suggestions.map((sug, idx) => (
                            <Typography key={idx} variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>• {sug}</Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="confirmPassword"
                      name="confirmPassword"
                      label="Confirm Password"
                      type="password"
                      value={formik.values.confirmPassword}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.confirmPassword &&
                        Boolean(formik.errors.confirmPassword)
                      }
                      helperText={
                        formik.touched.confirmPassword &&
                        formik.errors.confirmPassword
                      }
                    />
                  </Grid>
                </Grid>
              </fieldset>
            </Grid>
    <Grid item xs={12}>
              <fieldset className="fieldset">
                <legend className="legend">Address Details</legend>
                <Grid container spacing={2}>
                  {/* First Row */}
      <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="doorNo"
                      name="doorNo"
                      label="Door/Flat No."
                      value={formik.values.doorNo}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.doorNo && Boolean(formik.errors.doorNo)
                      }
                      helperText={formik.touched.doorNo && formik.errors.doorNo}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="street"
                      name="street"
                      label="Street"
                      value={formik.values.street}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.street && Boolean(formik.errors.street)
                      }
                      helperText={formik.touched.street && formik.errors.street}
                    />
                  </Grid>
                  {/* Second Row */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="area"
                      name="area"
                      label="Area"
                      value={formik.values.area}
                      onChange={formik.handleChange}
                      error={formik.touched.area && Boolean(formik.errors.area)}
                      helperText={formik.touched.area && formik.errors.area}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="city"
                      name="city"
                      label="City"
                      value={formik.values.city}
                      onChange={formik.handleChange}
                      error={formik.touched.city && Boolean(formik.errors.city)}
                      helperText={formik.touched.city && formik.errors.city}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="state"
                      name="state"
                      label="State"
                      value={formik.values.state}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.state && Boolean(formik.errors.state)
                      }
                      helperText={formik.touched.state && formik.errors.state}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      id="pincode"
                      name="pincode"
                      label="Pincode"
                      value={formik.values.pincode}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.pincode && Boolean(formik.errors.pincode)
                      }
                      helperText={
                        formik.touched.pincode && formik.errors.pincode
                      }
                    />
                  </Grid>
                </Grid>
              </fieldset>
            </Grid>
            <Grid container spacing={2} className="">
              <Grid item xs={12}>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        id="isAgent"
                        name="isAgent"
                        checked={formik.values.isAgent}
                        onChange={formik.handleChange}
                      />
                    }
                    label="Register as a Delivery Agent"
                  />
                  {formik.touched.isAgent && formik.errors.isAgent && (
                    <Typography color="error" variant="caption" display="block">
                      {formik.errors.isAgent}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Grid>
          {/* Feedback */}
          {error && (
            <Alert severity="error" className="error-alert" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" className="success-alert" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}

          {/* Footer actions: Cancel + Register (sticky feel) */}
          <Box className="form-footer" sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="text" onClick={() => navigate('/login')} className="link-button">
              Already have an account? Sign in
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={() => navigate(-1)} disabled={isSubmitting}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || !formik.isValid}
                startIcon={isSubmitting ? <CircularProgress size={18} /> : null}
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Success Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby="success-dialog-title"
        aria-describedby="success-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: '400px',
            overflow: 'hidden'
          }
        }}
        TransitionProps={{
          timeout: 500
        }}
      >
        <DialogTitle 
          id="success-dialog-title" 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            py: 2,
            textAlign: 'center'
          }}
        >
          <Typography variant="h5" component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            🎉 Registration Successful!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2, px: 4, py: 3 }}>
          <DialogContentText 
            id="success-dialog-description"
            sx={{
              textAlign: 'center',
              mb: 2,
              color: 'text.primary'
            }}
          >
            {success || "Your account has been created successfully!"}
          </DialogContentText>
          <DialogContentText
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              fontSize: '0.9rem'
            }}
          >
            Would you like to proceed to login with your new account?
          </DialogContentText>
        </DialogContent>
        <DialogActions 
          sx={{ 
            px: 4, 
            pb: 3,
            display: 'flex',
            justifyContent: 'center',
            gap: 2
          }}
        >
          <Button 
            onClick={() => setOpenDialog(false)} 
            color="primary" 
            variant="outlined"
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2
            }}
          >
            Stay Here
          </Button>
          <Button
            onClick={() => navigate("/login")}
            color="primary"
            variant="contained"
            autoFocus
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2
            }}
          >
            Proceed to Login
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RegistrationForm;
