const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
// Use configurable salt rounds; increase in production for better security
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const validator = require('validator');
const server = express();

server.use(cors());
server.use(express.json());

//Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/deliveryApp', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Could not connect to MongoDB", err));

// Load models (schemas moved to server/models.js)
const { Customer, Agent, Admin } = require('./models');
const { sendResetEmail, isEnabled: isMailEnabled } = require('./mail');

// Authentication Middleware
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use environment variable

const auth = (roles = []) => {
    return async (req, res, next) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                throw new Error();
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            if (!roles.includes(decoded.role)) {
                throw new Error('Unauthorized role');
            }

            req.user = decoded;
            req.token = token;
            next();
        } catch (error) {
            res.status(401).json({ success: false, message: 'Please authenticate' });
        }
    };
};

//Routes

// Password reset: request token
// Apply rate limiter to password endpoints to limit abuse
const passwordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many password requests. Please try again later.' }
});

server.post('/api/password/forgot', passwordLimiter, async (req, res) => {
    try {
        const { email } = req.body || {};
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const [customerUser, agentUser, adminUser] = await Promise.all([
            Customer.findOne({ email }),
            Agent.findOne({ email }),
            Admin.findOne({ email })
        ]);
        const user = customerUser || agentUser || adminUser;
        if (!user) return res.status(200).json({ success: true, message: 'If that email is registered, a reset token has been sent.' });

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save hashed token and expiry via model helper
        await user.setResetToken(token, expiresAt);

        // Try to send email; if configured do NOT return token in response
        if (isMailEnabled()) {
            try {
                await sendResetEmail(email, token);
                return res.json({ success: true, message: 'If that email is registered, a password reset email has been sent.' });
            } catch (err) {
                console.error('Error sending reset email:', err);
                // fall through to return token for dev visibility
            }
        }

        // Development fallback: log and return token so devs can complete the flow without email
        console.log(`Password reset token for ${email}: ${token}`);
        return res.json({ success: true, message: 'Password reset token generated (dev)', token });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Error processing request', error: error.message });
    }
});

// Password reset: submit new password with token
server.post('/api/password/reset', passwordLimiter, async (req, res) => {
    try {
        const { email, token, password } = req.body || {};
        if (!email || !token || !password) return res.status(400).json({ success: false, message: 'Email, token and new password are required' });

        if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include both letters and numbers.' });
        }

        const [customerUser, agentUser, adminUser] = await Promise.all([
            Customer.findOne({ email }),
            Agent.findOne({ email }),
            Admin.findOne({ email })
        ]);
        const user = customerUser || agentUser || adminUser;
        if (!user) return res.status(400).json({ success: false, message: 'Invalid token or email' });

        const valid = await user.verifyResetToken(token);
        if (!valid) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

        // Update password and clear reset token fields
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return res.json({ success: true, message: 'Password has been reset' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Error resetting password', error: error.message });
    }
});

// Register routes for different roles
server.post('/api/register', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            phone,
            role,
            address
        } = req.body;

        // Basic server-side password strength validation
        // Enforce: min length 8, contains letters and numbers
        if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include both letters and numbers.' });
        }

        // Validate role
        if (!['customer', 'agent'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }

        // Validate required address fields
        if (!address || !address.doorNo || !address.street || !address.area ||
            !address.city || !address.state || !address.pincode) {
            return res.status(400).json({
                success: false,
                message: 'All address fields are required'
            });
        }

        // Check if email already exists in any collection
        const existingUser = await Promise.all([
            Customer.findOne({ email }),
            Agent.findOne({ email })
        ]);

        if (existingUser.some(user => user)) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create new user based on role
        let newUser;
        const baseData = { firstName, lastName, email, password, phone, role };
        switch (role) {
            case 'customer':
                newUser = await Customer.create({
                    ...baseData,
                    address
                });
                break;
            case 'agent':
                newUser = await Agent.create({
                    ...baseData,
                    address
                });
                break;

        }

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return success response (excluding password)
        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: `Registration successful! Welcome ${firstName}!`,
            data: userResponse,
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during registration',
            error: error.message
        });
    }
});

// Login route
// Apply rate limiter to login endpoint to mitigate brute-force attempts
const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Please try again later.' }
});

server.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check all collections for the email (use Promise.all and pick first non-null)
        const [customerUser, agentUser, adminUser] = await Promise.all([
            Customer.findOne({ email }),
            Agent.findOne({ email }),
            Admin.findOne({ email })
        ]);
        const user = customerUser || agentUser || adminUser;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isValid = await user.verifyPassword(password);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return success response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            success: true,
            data: userResponse,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
});

// Protected route for creating admin users (only accessible by existing admins)
server.post('/api/admin/create', auth(['admin']), async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, department, permissions } = req.body;

        // Check if email already exists
        const existingUser = await Promise.all([
            Customer.findOne({ email }),
            Agent.findOne({ email }),
            Admin.findOne({ email })
        ]);

        if (existingUser.some(user => user)) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create new admin user
        const newAdmin = await Admin.create({
            firstName,
            lastName,
            email,
            password,
            phone,
            role: 'admin',
            department,
            permissions: permissions || ['view']
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: newAdmin._id, email: newAdmin.email, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return success response (excluding password)
        const adminResponse = newAdmin.toObject();
        delete adminResponse.password;

        res.status(201).json({
            success: true,
            data: adminResponse,
            token
        });
    } catch (error) {
        console.error('Admin creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating admin user',
            error: error.message
        });
    }
});

// Admin bootstrap endpoint (temporary)
// Usage: POST /api/admin/bootstrap
// Allowed only when no admin exists OR when ENABLE_ADMIN_BOOTSTRAP=true
server.post('/api/admin/bootstrap', async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, department, permissions } = req.body || {};

        if (!email || !password || !firstName || !lastName || !phone || !department) {
            return res.status(400).json({ success: false, message: 'Missing required fields: firstName,lastName,email,password,phone,department' });
        }

        // Basic server-side password strength validation
        if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include both letters and numbers.' });
        }

        // Check existing email across collections
        const existing = await Promise.all([
            Customer.findOne({ email }),
            Agent.findOne({ email }),
            Admin.findOne({ email })
        ]);
        if (existing.some(u => u)) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const adminCount = await Admin.countDocuments();
        if (adminCount > 0 && process.env.ENABLE_ADMIN_BOOTSTRAP !== 'true') {
            return res.status(403).json({ success: false, message: 'Admin already exists. Bootstrap disabled.' });
        }

        // Create new admin
        const newAdmin = await Admin.create({
            firstName,
            lastName,
            email,
            password,
            phone,
            role: 'admin',
            department,
            permissions: permissions || ['view']
        });

        const token = jwt.sign(
            { id: newAdmin._id, email: newAdmin.email, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const adminResponse = newAdmin.toObject();
        delete adminResponse.password;

        res.status(201).json({ success: true, data: adminResponse, token });
    } catch (error) {
        console.error('Admin bootstrap error:', error);
        res.status(500).json({ success: false, message: 'Error creating admin user', error: error.message });
    }
});

// Admin: list users (customers) with search and pagination
server.get('/api/admin/users', auth(['admin']), async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);

        const filter = {};
        if (q) {
            const regex = new RegExp(q, 'i');
            filter.$or = [
                { firstName: regex },
                { lastName: regex },
                { email: regex },
                { phone: regex }
            ];
        }

        const total = await Customer.countDocuments(filter);
        const items = await Customer.find(filter)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, data: { items, total, page, limit } });
    } catch (error) {
        console.error('Admin users list error:', error);
        res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
    }
});

// Admin: list agents with search and pagination
server.get('/api/admin/agents', auth(['admin']), async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);

        const filter = {};
        if (q) {
            const regex = new RegExp(q, 'i');
            filter.$or = [
                { firstName: regex },
                { lastName: regex },
                { email: regex },
                { phone: regex }
            ];
        }

        const total = await Agent.countDocuments(filter);
        const items = await Agent.find(filter)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, data: { items, total, page, limit } });
    } catch (error) {
        console.error('Admin agents list error:', error);
        res.status(500).json({ success: false, message: 'Error fetching agents', error: error.message });
    }
});

// Debug route removed. Do not add endpoints that expose hashed passwords in production.

const port = 3000;
server.listen(port, () => {
    console.log("Server listening on port 3000");
});
