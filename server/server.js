const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
// Use configurable salt rounds; increase in production for better security
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const server = express();

server.use(cors());
server.use(express.json());

//Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/deliveryApp', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Could not connect to MongoDB", err));

//Mongoose Schemas and Models
const baseUserSchema = {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, required: true, enum: ['customer', 'agent', 'admin'] },
    createdAt: { type: Date, default: Date.now }
};

// Address Schema
const addressSchema = new mongoose.Schema({
    doorNo: { type: String, required: true },
    street: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
});

// Customer Schema
const customerSchema = new mongoose.Schema({
    ...baseUserSchema,
    address: { type: addressSchema, required: true },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }]
});

// Agent Schema
const agentSchema = new mongoose.Schema({
    ...baseUserSchema,
    address: { type: addressSchema, required: true },
    available: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    totalDeliveries: { type: Number, default: 0 },
    currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
});

// Admin Schema (not exposed in public registration)
const adminSchema = new mongoose.Schema({
    ...baseUserSchema,
    department: { type: String, required: true },
    permissions: [{ type: String }]
});

// Hash password middleware for all schemas
const hashPassword = async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
    }
    next();
};

customerSchema.pre('save', hashPassword);
agentSchema.pre('save', hashPassword);
adminSchema.pre('save', hashPassword);

// Password verification method for all schemas
const verifyPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

customerSchema.methods.verifyPassword = verifyPassword;
agentSchema.methods.verifyPassword = verifyPassword;
adminSchema.methods.verifyPassword = verifyPassword;

// Models
const Customer = mongoose.model('Customer', customerSchema);
const Agent = mongoose.model('Agent', agentSchema);
const Admin = mongoose.model('Admin', adminSchema);

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
