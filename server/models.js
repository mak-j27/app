const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Use configurable salt rounds; increase in production for better security
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

// Mongoose Schemas and Models moved from server.js

const baseUserSchema = {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, required: true, enum: ['customer', 'agent', 'admin'] },
    createdAt: { type: Date, default: Date.now },
    // Password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
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

// Verify reset token (token is stored hashed)
const verifyResetToken = async function (token) {
    if (!this.resetPasswordToken || !this.resetPasswordExpires) return false;
    if (this.resetPasswordExpires < new Date()) return false;
    return await bcrypt.compare(token, this.resetPasswordToken);
};

const setResetToken = async function (token, expiresAt) {
    // store hashed token
    this.resetPasswordToken = await bcrypt.hash(token, BCRYPT_SALT_ROUNDS);
    this.resetPasswordExpires = expiresAt;
    return this.save();
};

customerSchema.methods.verifyResetToken = verifyResetToken;
agentSchema.methods.verifyResetToken = verifyResetToken;
adminSchema.methods.verifyResetToken = verifyResetToken;

customerSchema.methods.setResetToken = setResetToken;
agentSchema.methods.setResetToken = setResetToken;
adminSchema.methods.setResetToken = setResetToken;

// Models
const Customer = mongoose.model('Customer', customerSchema);
const Agent = mongoose.model('Agent', agentSchema);
const Admin = mongoose.model('Admin', adminSchema);

module.exports = { Customer, Agent, Admin };