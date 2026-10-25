// =====================================================
// 🚀 StudySync — Complete Backend (FIXED v17 — PeerJS separate)
// =====================================================

import express from "express";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import { body, validationResult } from "express-validator";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

dotenv.config();

// =====================================================
// ⚙️ CONFIG
// =====================================================
const ENV = {
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/studysync",
  MONGO_FALLBACK_URI: process.env.MONGO_FALLBACK_URI || "mongodb://127.0.0.1:27017/studysync",
  JWT_SECRET: process.env.JWT_SECRET || "super_secret_change_this",
  JWT_EXPIRES: process.env.JWT_EXPIRES || "7d",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173,http://localhost:5174",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
};

if (ENV.NODE_ENV === "production" && ENV.JWT_SECRET === "super_secret_change_this") {
  throw new Error("❌ Set a real JWT_SECRET in production!");
}

const allowedOrigins = (ENV.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// =====================================================
// ☁️ CLOUDINARY
// =====================================================
cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "studysync/resources",
        resource_type: "auto",
        allowed_formats: [
          "pdf", "jpg", "jpeg", "png", "doc", "docx", "ppt", "pptx", "txt",
        ],
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

// =====================================================
// 🛠️ UTILS
// =====================================================
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const sendResponse = (res, statusCode, success, message, data = null) =>
  res.status(statusCode).json({ success, message, ...(data && { data }) });

const generateToken = (userId) =>
  jwt.sign({ id: userId }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES });

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const AVATAR_COLORS = [
  "#a78bfa", "#f472b6", "#34d399", "#fbbf24",
  "#22d3ee", "#f87171", "#60a5fa", "#c084fc",
];

// =====================================================
// 📦 MODELS
// =====================================================

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: {
      type: String, required: true, unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    password: { type: String, required: false, minlength: 6, select: false },
    avatar: { type: String, default: "" },
    role: { type: String, enum: ["student", "tutor", "admin"], default: "student" },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
    tutorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "Tutor" },
    isVerified: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (!this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
userSchema.methods.comparePassword = function (entered) {
  if (!this.password) return false;
  return bcrypt.compare(entered, this.password);
};
const User = mongoose.model("User", userSchema);

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "moderator", "member"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const strokeSchema = new mongoose.Schema(
  {
    tool: { type: String, default: "pen" },
    color: { type: String, default: "#22d3ee" },
    lineWidth: { type: Number, default: 3 },
    points: [{ x: Number, y: Number }],
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", maxlength: 500 },
    subject: { type: String, default: "", trim: true },
    coverImage: { type: String, default: "" },
    emoji: { type: String, default: "📚" },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [memberSchema],
    inviteCode: { type: String, unique: true, sparse: true },
    inviteLink: { type: String },
    isPrivate: { type: Boolean, default: true },
    maxMembers: { type: Number, default: 50 },
    resources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }],
    quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],
    goal: { type: String, default: "" },
    whiteboardStrokes: { type: [strokeSchema], default: [] },
    sessionStartedAt: { type: Date, default: null },
    isLocked: { type: Boolean, default: false },
    isRecording: { type: Boolean, default: false },
  },
  { timestamps: true }
);

groupSchema.pre("save", function (next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(8).toString("hex");
    this.inviteLink = `${allowedOrigins[0]}/join/${this.inviteCode}`;
  }
  next();
});
groupSchema.methods.isMember = function (userId) {
  return this.members.some((m) => m.user.toString() === userId.toString());
};
groupSchema.methods.isAdmin = function (userId) {
  return this.admin.toString() === userId.toString();
};
groupSchema.methods.canDraw = function (userId) {
  if (this.admin.toString() === userId.toString()) return true;
  const m = this.members.find((x) => x.user.toString() === userId.toString());
  return m?.role === "moderator";
};
groupSchema.methods.toClient = function () {
  const obj = this.toObject({ virtuals: false });
  const flattenedMembers = (this.members || []).map((m) => {
    const u = m.user || {};
    return {
      _id: u._id || u,
      name: u.name, email: u.email, avatar: u.avatar,
      role: m.role, joinedAt: m.joinedAt,
      user: { _id: u._id || u, name: u.name, email: u.email, avatar: u.avatar },
    };
  });
  return {
    ...obj,
    members: flattenedMembers,
    owner: obj.admin,
    participantsCount: (this.members || []).length,
  };
};
const Group = mongoose.model("Group", groupSchema);

const messageSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    content: { type: String, required: true, trim: true, maxlength: 4000 },
    type: { type: String, enum: ["text", "image", "file", "system", "ai"], default: "text" },
    attachmentUrl: { type: String, default: "" },
    authorName: String,
    authorInitial: String,
    authorColor: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);
const Message = mongoose.model("Message", messageSchema);

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    fileUrl: { type: String, required: true },
    fileKey: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tags: [String],
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const Resource = mongoose.model("Resource", resourceSchema);

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ["mcq", "flashcard"], default: "mcq" },
  options: [String],
  correctAnswer: { type: String, required: true },
  explanation: { type: String, default: "" },
  points: { type: Number, default: 1 },
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    questions: [questionSchema],
    totalPoints: { type: Number, default: 0 },
    timeLimit: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);
quizSchema.pre("save", function (next) {
  this.totalPoints = this.questions.reduce((s, q) => s + (q.points || 1), 0);
  next();
});
const Quiz = mongoose.model("Quiz", quizSchema);

const scoreSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    score: { type: Number, required: true },
    totalPoints: { type: Number, required: true },
    percentage: { type: Number, default: 0 },
    answers: [{
      questionId: mongoose.Schema.Types.ObjectId,
      userAnswer: String,
      isCorrect: Boolean,
    }],
    timeTaken: { type: Number, default: 0 },
  },
  { timestamps: true }
);
scoreSchema.index({ quiz: 1, user: 1 }, { unique: true });
scoreSchema.pre("save", function (next) {
  if (this.totalPoints > 0) this.percentage = (this.score / this.totalPoints) * 100;
  next();
});
const Score = mongoose.model("Score", scoreSchema);

const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      required: true,
    },
    slots: [{ startTime: String, endTime: String }],
  },
  { _id: false }
);

const tutorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    avatar: { type: String, default: "" },
    bio: { type: String, maxlength: 1000, default: "" },
    subjects: { type: [String], default: [] },
    qualifications: [{ degree: String, institution: String, year: Number }],
    experience: { type: Number, default: 0 },
    hourlyRate: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    languages: { type: [String], default: [] },
    availability: { type: [availabilitySchema], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const Tutor = mongoose.model("Tutor", tutorSchema);

const bookingSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: "Tutor", required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, default: 60 },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    meetingLink: { type: String, default: "" },
    sessionGroup: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
    notes: { type: String, default: "" },
    cancelledBy: { type: String, enum: ["student", "tutor", "system", null], default: null },
    cancellationReason: { type: String, default: "" },
  },
  { timestamps: true }
);
const Booking = mongoose.model("Booking", bookingSchema);

const reviewSchema = new mongoose.Schema(
  {
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: "Tutor", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", maxlength: 500 },
  },
  { timestamps: true }
);
reviewSchema.index({ booking: 1 }, { unique: true });
const Review = mongoose.model("Review", reviewSchema);

// =====================================================
// 🛡️ MIDDLEWARES
// =====================================================
const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }
  if (!token) throw new AppError("Not authorized. Please login.", 401);

  const decoded = jwt.verify(token, ENV.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw new AppError("User no longer exists", 401);

  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return next(new AppError(`Role '${req.user.role}' not allowed`, 403));
  next();
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

const requireMember = asyncHandler(async (req, res, next) => {
  const groupId = req.params.id || req.params.groupId;
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  if (!group.isMember(req.user._id)) throw new AppError("Not a member of this group", 403);
  req.group = group;
  next();
});

const requireAdmin = asyncHandler(async (req, res, next) => {
  const groupId = req.params.id || req.params.groupId;
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  if (!group.isAdmin(req.user._id))
    throw new AppError("Only admin can perform this action", 403);
  req.group = group;
  next();
});

const requireDrawPermission = asyncHandler(async (req, res, next) => {
  const groupId = req.params.id || req.params.groupId;
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);
  if (!group.isMember(req.user._id)) throw new AppError("Not a member", 403);
  if (!group.canDraw(req.user._id))
    throw new AppError("Only admin/moderator can edit the whiteboard", 403);
  req.group = group;
  next();
});

// =====================================================
// 🎯 AUTH CONTROLLERS
// =====================================================
const authController = {
  register: asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email) throw new AppError("Name and email are required", 400);

    const existing = await User.findOne({ email });
    if (existing) throw new AppError("Email already registered", 400);

    const finalPassword =
      password && password.trim()
        ? password.trim()
        : crypto.randomBytes(16).toString("hex");

    const finalRole = ["student", "tutor", "admin"].includes(role)
      ? role
      : "student";

    const user = await User.create({
      name, email, password: finalPassword, role: finalRole,
    });

    const token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    user.password = undefined;
    sendResponse(res, 201, true, "Registration successful", { user, token });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new AppError("Invalid credentials", 401);
    const isMatch = await user.comparePassword(password || "");
    if (!isMatch) throw new AppError("Invalid credentials", 401);

    user.lastSeen = Date.now();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    user.password = undefined;
    sendResponse(res, 200, true, "Login successful", { user, token });
  }),

  getMe: asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
      .populate("groups", "name subject coverImage emoji")
      .populate("tutorProfile");
    sendResponse(res, 200, true, "User fetched", { user });
  }),

  logout: asyncHandler(async (req, res) => {
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10000),
      httpOnly: true,
    });
    sendResponse(res, 200, true, "Logged out");
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...(name && { name }), ...(avatar && { avatar }) },
      { new: true, runValidators: true }
    );
    sendResponse(res, 200, true, "Profile updated", { user });
  }),

  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      throw new AppError("Provide current and new password", 400);
    if (newPassword.length < 6) throw new AppError("Min 6 chars required", 400);

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new AppError("Current password incorrect", 401);

    user.password = newPassword;
    await user.save();
    const token = generateToken(user._id);
    sendResponse(res, 200, true, "Password changed", { token });
  }),

  togglePremium: asyncHandler(async (req, res) => {
    const { isPremium } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isPremium: !!isPremium },
      { new: true }
    );
    sendResponse(
      res, 200, true,
      `Premium ${user.isPremium ? "activated ⭐" : "deactivated"}`,
      { user }
    );
  }),
};

// =====================================================
// 🎯 GROUP CONTROLLERS
// =====================================================
const groupController = {
  create: asyncHandler(async (req, res) => {
    const { name, description, subject, isPrivate, maxMembers, emoji, goal } = req.body;
    const group = await Group.create({
      name, description, subject,
      emoji: emoji || "📚",
      isPrivate: isPrivate ?? true,
      maxMembers: maxMembers || 50,
      admin: req.user._id,
      members: [{ user: req.user._id, role: "admin" }],
      goal: goal || "",
      sessionStartedAt: new Date(),
    });
    await User.findByIdAndUpdate(req.user._id, { $push: { groups: group._id } });
    await group.populate([
      { path: "admin", select: "name email avatar" },
      { path: "members.user", select: "name email avatar" },
    ]);
    sendResponse(res, 201, true, "Group created", { group: group.toClient() });
  }),

  getMyGroups: asyncHandler(async (req, res) => {
    const groups = await Group.find({ "members.user": req.user._id })
      .populate("admin", "name email avatar")
      .populate("members.user", "name email avatar")
      .sort({ updatedAt: -1 });

    sendResponse(res, 200, true, "Groups fetched", {
      count: groups.length,
      groups: groups.map((g) => g.toClient()),
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const group = await Group.findById(req.params.id)
      .populate("admin", "name email avatar")
      .populate("members.user", "name email avatar lastSeen")
      .populate({ path: "resources", populate: { path: "uploadedBy", select: "name avatar" } })
      .populate("quizzes", "title totalPoints attempts createdAt");

    if (!group) throw new AppError("Group not found", 404);
    sendResponse(res, 200, true, "Group fetched", { group: group.toClient() });
  }),

  update: asyncHandler(async (req, res) => {
    const { name, description, subject, isPrivate, maxMembers, coverImage, emoji } = req.body;
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(subject && { subject }),
        ...(isPrivate !== undefined && { isPrivate }),
        ...(maxMembers && { maxMembers }),
        ...(coverImage && { coverImage }),
        ...(emoji && { emoji }),
      },
      { new: true, runValidators: true }
    )
      .populate("admin", "name email avatar")
      .populate("members.user", "name email avatar");

    sendResponse(res, 200, true, "Group updated", { group: group.toClient() });
  }),

  delete: asyncHandler(async (req, res) => {
    const group = await Group.findById(req.params.id);
    if (!group) throw new AppError("Group not found", 404);

    const memberIds = group.members.map((m) => m.user);
    await User.updateMany({ _id: { $in: memberIds } }, { $pull: { groups: group._id } });
    await Message.deleteMany({ group: group._id });
    await Resource.deleteMany({ group: group._id });
    await Quiz.deleteMany({ group: group._id });
    await Score.deleteMany({ group: group._id });
    await group.deleteOne();
    sendResponse(res, 200, true, "Group deleted");
  }),

  joinByInvite: asyncHandler(async (req, res) => {
    const { inviteCode } = req.params;
    const group = await Group.findOne({ inviteCode });
    if (!group) throw new AppError("Invalid invite link", 404);
    if (group.isMember(req.user._id)) throw new AppError("Already a member", 400);
    if (group.members.length >= group.maxMembers) throw new AppError("Group is full", 400);

    group.members.push({ user: req.user._id, role: "member" });
    await group.save();
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { groups: group._id } });

    await group.populate([
      { path: "admin", select: "name email avatar" },
      { path: "members.user", select: "name email avatar" },
    ]);
    sendResponse(res, 200, true, "Joined group", { group: group.toClient() });
  }),

  previewByInvite: asyncHandler(async (req, res) => {
    const group = await Group.findOne({ inviteCode: req.params.inviteCode })
      .populate("admin", "name avatar")
      .select("name description subject coverImage emoji members maxMembers admin");
    if (!group) throw new AppError("Invalid invite link", 404);

    sendResponse(res, 200, true, "Preview", {
      group: {
        _id: group._id, name: group.name, description: group.description,
        subject: group.subject, coverImage: group.coverImage, emoji: group.emoji,
        admin: group.admin, memberCount: group.members.length,
        maxMembers: group.maxMembers, isFull: group.members.length >= group.maxMembers,
      },
    });
  }),

  regenerateInvite: asyncHandler(async (req, res) => {
    const group = req.group;
    group.inviteCode = crypto.randomBytes(8).toString("hex");
    group.inviteLink = `${allowedOrigins[0]}/join/${group.inviteCode}`;
    await group.save();
    sendResponse(res, 200, true, "Invite regenerated", {
      inviteCode: group.inviteCode, inviteLink: group.inviteLink,
    });
  }),

  removeMember: asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const group = req.group;
    if (group.admin.toString() === userId) throw new AppError("Cannot remove admin", 400);
    if (!group.isMember(userId)) throw new AppError("Not a member", 404);

    group.members = group.members.filter((m) => m.user.toString() !== userId);
    await group.save();
    await User.findByIdAndUpdate(userId, { $pull: { groups: group._id } });
    sendResponse(res, 200, true, "Member removed");
  }),

  changeRole: asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    const group = req.group;
    if (!["moderator", "member"].includes(role)) throw new AppError("Invalid role", 400);
    if (group.admin.toString() === userId) throw new AppError("Cannot change admin role", 400);

    const member = group.members.find((m) => m.user.toString() === userId);
    if (!member) throw new AppError("Member not found", 404);
    member.role = role;
    await group.save();
    sendResponse(res, 200, true, `Role updated to ${role}`);
  }),

  leave: asyncHandler(async (req, res) => {
    const group = req.group;
    if (group.isAdmin(req.user._id))
      throw new AppError("Admin cannot leave. Transfer or delete.", 400);
    group.members = group.members.filter(
      (m) => m.user.toString() !== req.user._id.toString()
    );
    await group.save();
    await User.findByIdAndUpdate(req.user._id, { $pull: { groups: group._id } });
    sendResponse(res, 200, true, "Left group");
  }),

  transferAdmin: asyncHandler(async (req, res) => {
    const { newAdminId } = req.body;
    const group = req.group;
    if (!newAdminId) throw new AppError("newAdminId required", 400);
    if (!group.isMember(newAdminId)) throw new AppError("Not a member", 400);
    if (group.admin.toString() === newAdminId) throw new AppError("Already admin", 400);

    const old = group.members.find((m) => m.user.toString() === group.admin.toString());
    if (old) old.role = "moderator";
    const newM = group.members.find((m) => m.user.toString() === newAdminId);
    newM.role = "admin";
    group.admin = newAdminId;
    await group.save();
    sendResponse(res, 200, true, "Admin transferred", { newAdminId });
  }),

  startSession: asyncHandler(async (req, res) => {
    const group = req.group;
    if (!group.sessionStartedAt) {
      group.sessionStartedAt = new Date();
      await group.save();
    }
    sendResponse(res, 200, true, "Session started", {
      sessionStartedAt: group.sessionStartedAt,
    });
  }),

  getMessages: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const limit = Math.min(Number(req.query.limit) || 100, 200);

    const messages = await Message.find({ group: id })
      .populate("sender", "name avatar")
      .sort({ createdAt: -1 })
      .limit(limit);

    messages.reverse();

    const shaped = messages.map((m) => ({
      _id: m._id,
      author: m.sender?._id || m.sender || m.type,
      authorName: m.authorName || m.sender?.name || "User",
      authorInitial: m.authorInitial || (m.sender?.name || "U")[0]?.toUpperCase(),
      authorColor: m.authorColor || AVATAR_COLORS[0],
      text: m.content, type: m.type, createdAt: m.createdAt,
    }));
    sendResponse(res, 200, true, "Messages fetched", shaped);
  }),

  postMessage: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { text, color } = req.body;
    if (!text?.trim()) throw new AppError("Empty message", 400);

    const user = req.user;
    const colorIndex = (user.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
    const authorColor = color || AVATAR_COLORS[colorIndex];

    const message = await Message.create({
      group: id, sender: user._id, content: text.trim(), type: "text",
      authorName: user.name,
      authorInitial: (user.name || "U")[0].toUpperCase(),
      authorColor,
    });

    const shaped = {
      _id: message._id, author: user._id, authorName: user.name,
      authorInitial: (user.name || "U")[0].toUpperCase(),
      authorColor, text: message.content, type: "text", createdAt: message.createdAt,
    };
    const io = req.app.get("io");
    io?.to(`group:${id}`).emit("new-message", shaped);
    sendResponse(res, 201, true, "Message sent", shaped);
  }),

  saveWhiteboard: asyncHandler(async (req, res) => {
    const group = req.group;
    if (!group.canDraw(req.user._id))
      throw new AppError("Only admin/moderator can edit the whiteboard", 403);

    const { strokes = [], replace = false } = req.body;
    if (replace) group.whiteboardStrokes = strokes;
    else group.whiteboardStrokes.push(...strokes);
    await group.save();

    const io = req.app.get("io");
    if (replace) io?.to(`group:${group._id}`).emit("whiteboard-update", group.whiteboardStrokes);
    else if (strokes.length) io?.to(`group:${group._id}`).emit("stroke-received", { strokes });
    sendResponse(res, 200, true, "Whiteboard saved", {
      count: group.whiteboardStrokes.length,
    });
  }),

  clearWhiteboard: asyncHandler(async (req, res) => {
    const group = req.group;
    if (!group.canDraw(req.user._id))
      throw new AppError("Only admin/moderator can clear the whiteboard", 403);

    group.whiteboardStrokes = [];
    await group.save();
    const io = req.app.get("io");
    io?.to(`group:${group._id}`).emit("whiteboard-clear");
    sendResponse(res, 200, true, "Whiteboard cleared");
  }),

  updateGoal: asyncHandler(async (req, res) => {
    const group = req.group;
    group.goal = req.body.goal || "";
    await group.save();
    const io = req.app.get("io");
    io?.to(`group:${group._id}`).emit("goal-update", group.goal);
    sendResponse(res, 200, true, "Goal updated", { goal: group.goal });
  }),

  setLock: asyncHandler(async (req, res) => {
    const group = req.group;
    group.isLocked = !!req.body.locked;
    await group.save();
    const io = req.app.get("io");
    io?.to(`group:${group._id}`).emit("lock-update", group.isLocked);
    sendResponse(res, 200, true, "Lock updated", { isLocked: group.isLocked });
  }),
};

// =====================================================
// 🎯 QUIZ CONTROLLERS
// =====================================================
const quizController = {
  create: asyncHandler(async (req, res) => {
    const { title, description, questions, timeLimit, isPublished } = req.body;
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) throw new AppError("Group not found", 404);
    if (!group.isMember(req.user._id)) throw new AppError("Not a member", 403);

    const quiz = await Quiz.create({
      title, description, questions,
      timeLimit: timeLimit || 0,
      isPublished: isPublished || false,
      group: groupId, createdBy: req.user._id,
    });
    group.quizzes.push(quiz._id);
    await group.save();
    sendResponse(res, 201, true, "Quiz created", { quiz });
  }),

  getGroupQuizzes: asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) throw new AppError("Group not found", 404);
    if (!group.isMember(req.user._id)) throw new AppError("Not a member", 403);

    const quizzes = await Quiz.find({ group: groupId })
      .populate("createdBy", "name avatar")
      .sort({ createdAt: -1 })
      .select("-questions.correctAnswer");
    sendResponse(res, 200, true, "Quizzes fetched", { quizzes });
  }),

  getById: asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id).populate("createdBy", "name avatar");
    if (!quiz) throw new AppError("Quiz not found", 404);
    const group = await Group.findById(quiz.group);
    if (!group.isMember(req.user._id)) throw new AppError("Not a member", 403);

    const isCreator = quiz.createdBy._id.toString() === req.user._id.toString();
    if (!isCreator) quiz.questions.forEach((q) => (q.correctAnswer = undefined));
    sendResponse(res, 200, true, "Quiz fetched", { quiz });
  }),

  submit: asyncHandler(async (req, res) => {
    const { answers, timeTaken } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) throw new AppError("Quiz not found", 404);
    const group = await Group.findById(quiz.group);
    if (!group.isMember(req.user._id)) throw new AppError("Not a member", 403);

    const existing = await Score.findOne({ quiz: quiz._id, user: req.user._id });
    if (existing) throw new AppError("Already attempted", 400);

    let score = 0;
    const gradedAnswers = [];

    for (const ans of answers || []) {
      const q = quiz.questions.id(ans.questionId);
      if (!q) continue;
      const isCorrect =
        String(q.correctAnswer).trim().toLowerCase() ===
        String(ans.userAnswer).trim().toLowerCase();
      if (isCorrect) score += q.points || 1;
      gradedAnswers.push({
        questionId: q._id,
        userAnswer: ans.userAnswer,
        isCorrect,
      });
    }

    const record = await Score.create({
      quiz: quiz._id,
      user: req.user._id,
      group: quiz.group,
      score,
      totalPoints: quiz.totalPoints,
      answers: gradedAnswers,
      timeTaken: timeTaken || 0,
    });

    quiz.attempts += 1;
    await quiz.save();

    const io = req.app.get("io");
    io?.to(`group:${quiz.group}`).emit("quiz-submitted", {
      quizId: quiz._id,
      userId: req.user._id,
      userName: req.user.name,
      score,
      totalPoints: quiz.totalPoints,
    });

    sendResponse(res, 201, true, "Quiz submitted", {
      score,
      totalPoints: quiz.totalPoints,
      percentage: record.percentage,
      answers: gradedAnswers,
    });
  }),

  getLeaderboard: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);
    if (!quiz) throw new AppError("Quiz not found", 404);
    const group = await Group.findById(quiz.group);
    if (!group.isMember(req.user._id)) throw new AppError("Not a member", 403);

    const scores = await Score.find({ quiz: id })
      .populate("user", "name avatar")
      .sort({ score: -1, timeTaken: 1 })
      .limit(50);

    const leaderboard = scores.map((s, i) => ({
      rank: i + 1,
      user: s.user,
      score: s.score,
      totalPoints: s.totalPoints,
      percentage: s.percentage,
      timeTaken: s.timeTaken,
      submittedAt: s.createdAt,
    }));

    sendResponse(res, 200, true, "Leaderboard fetched", { leaderboard });
  }),

  getMyAttempts: asyncHandler(async (req, res) => {
    const scores = await Score.find({ user: req.user._id })
      .populate("quiz", "title totalPoints")
      .populate("group", "name emoji")
      .sort({ createdAt: -1 });
    sendResponse(res, 200, true, "Attempts fetched", { attempts: scores });
  }),
};

// =====================================================
// 🎯 RESOURCE CONTROLLERS
// =====================================================
const resourceController = {
  upload: asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { title, description, tags } = req.body;

    if (!req.file) throw new AppError("No file uploaded", 400);
    const group = await Group.findById(groupId);
    if (!group) throw new AppError("Group not found", 404);
    if (!group.isMember(req.user._id)) throw new AppError("Not a member", 403);

    const result = await uploadToCloudinary(req.file.buffer);

    const resource = await Resource.create({
      title: title || req.file.originalname,
      description: description || "",
      fileUrl: result.secure_url,
      fileKey: result.public_id,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      group: groupId,
      uploadedBy: req.user._id,
      tags: tags
        ? (Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim()))
        : [],
    });

    group.resources.push(resource._id);
    await group.save();
    await resource.populate("uploadedBy", "name avatar");

    const io = req.app.get("io");
    io?.to(`group:${groupId}`).emit("resource-added", resource);
    sendResponse(res, 201, true, "Resource uploaded", { resource });
  }),

  getGroupResources: asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) throw new AppError("Group not found", 404);
    if (!group.isMember(req.user._id)) throw new AppError("Not a member", 403);

    const resources = await Resource.find({ group: groupId })
      .populate("uploadedBy", "name avatar")
      .sort({ createdAt: -1 });
    sendResponse(res, 200, true, "Resources fetched", { resources });
  }),

  download: asyncHandler(async (req, res) => {
    const resource = await Resource.findById(req.params.id);
    if (!resource) throw new AppError("Resource not found", 404);
    const group = await Group.findById(resource.group);
    if (!group.isMember(req.user._id)) throw new AppError("Not a member", 403);

    resource.downloads += 1;
    await resource.save();
    sendResponse(res, 200, true, "Download counted", {
      url: resource.fileUrl,
      downloads: resource.downloads,
    });
  }),

  remove: asyncHandler(async (req, res) => {
    const resource = await Resource.findById(req.params.id);
    if (!resource) throw new AppError("Resource not found", 404);
    const group = await Group.findById(resource.group);
    if (!group.isMember(req.user._id)) throw new AppError("Not a member", 403);

    const isUploader = resource.uploadedBy.toString() === req.user._id.toString();
    if (!isUploader && !group.isAdmin(req.user._id))
      throw new AppError("Not authorized to delete", 403);

    try {
      await cloudinary.uploader.destroy(resource.fileKey, { resource_type: "auto" });
    } catch (e) {
      console.warn("Cloudinary destroy failed:", e.message);
    }

    group.resources = group.resources.filter(
      (r) => r.toString() !== resource._id.toString()
    );
    await group.save();
    await resource.deleteOne();
    sendResponse(res, 200, true, "Resource deleted");
  }),
};

// =====================================================
// 🎯 TUTOR CONTROLLERS
// =====================================================
const tutorController = {
  register: asyncHandler(async (req, res) => {
    const existing = await Tutor.findOne({ user: req.user._id });
    if (existing) throw new AppError("Tutor profile already exists", 400);

    const {
      bio = "",
      subjects = [],
      experience = 0,
      hourlyRate,
      currency = "USD",
      languages = [],
      availability = [],
      qualifications = [],
      avatar = "",
    } = req.body;

    if (hourlyRate === undefined || hourlyRate === null || hourlyRate === "") {
      throw new AppError("Hourly rate is required", 400);
    }
    const rateNum = Number(hourlyRate);
    if (Number.isNaN(rateNum) || rateNum < 0) {
      throw new AppError("Hourly rate must be a valid number ≥ 0", 400);
    }

    const subjectsArr = Array.isArray(subjects)
      ? subjects
      : String(subjects).split(",").map((s) => s.trim()).filter(Boolean);
    if (subjectsArr.length === 0) {
      throw new AppError("At least one subject is required", 400);
    }

    const languagesArr = Array.isArray(languages)
      ? languages
      : String(languages).split(",").map((s) => s.trim()).filter(Boolean);

    const availabilityArr = Array.isArray(availability)
      ? availability
          .filter((a) => a?.day && Array.isArray(a.slots))
          .map((a) => ({
            day: a.day,
            slots: a.slots
              .filter((s) => s?.startTime && s?.endTime)
              .map((s) => ({ startTime: s.startTime, endTime: s.endTime })),
          }))
      : [];

    const tutor = await Tutor.create({
      user: req.user._id,
      avatar,
      bio,
      subjects: subjectsArr,
      experience: Number(experience) || 0,
      hourlyRate: rateNum,
      currency,
      languages: languagesArr,
      availability: availabilityArr,
      qualifications,
    });

    await User.findByIdAndUpdate(req.user._id, {
      role: "tutor",
      tutorProfile: tutor._id,
    });

    await tutor.populate("user", "name avatar email");
    sendResponse(res, 201, true, "Tutor profile created", { tutor });
  }),

  getMyProfile: asyncHandler(async (req, res) => {
    const tutor = await Tutor.findOne({ user: req.user._id }).populate(
      "user",
      "name avatar email"
    );
    if (!tutor) throw new AppError("Tutor profile not found", 404);
    sendResponse(res, 200, true, "Profile fetched", { tutor });
  }),

  update: asyncHandler(async (req, res) => {
    const tutor = await Tutor.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate("user", "name avatar email");
    if (!tutor) throw new AppError("Tutor profile not found", 404);
    sendResponse(res, 200, true, "Profile updated", { tutor });
  }),

  uploadAvatar: asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError("No file uploaded", 400);

    const tutor = await Tutor.findOne({ user: req.user._id });
    if (!tutor) throw new AppError("Tutor profile not found", 404);

    const result = await uploadToCloudinary(req.file.buffer);
    const avatarUrl = result.secure_url;

    tutor.avatar = avatarUrl;
    await tutor.save();

    await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl });

    await tutor.populate("user", "name avatar email");
    sendResponse(res, 200, true, "Avatar updated", { tutor });
  }),

  list: asyncHandler(async (req, res) => {
    const { subject, minRate, maxRate, minRating, search, page = 1, limit = 12 } = req.query;
    const filter = { isActive: true };

    if (subject) filter.subjects = { $in: [new RegExp(subject, "i")] };
    if (minRate || maxRate) {
      filter.hourlyRate = {};
      if (minRate) filter.hourlyRate.$gte = Number(minRate);
      if (maxRate) filter.hourlyRate.$lte = Number(maxRate);
    }
    if (minRating) filter.rating = { $gte: Number(minRating) };

    if (search) {
      const users = await User.find({
        name: new RegExp(search, "i"),
        role: "tutor",
      }).select("_id");
      filter.user = { $in: users.map((u) => u._id) };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [tutors, total] = await Promise.all([
      Tutor.find(filter)
        .populate("user", "name avatar email")
        .sort({ rating: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Tutor.countDocuments(filter),
    ]);

    sendResponse(res, 200, true, "Tutors fetched", {
      tutors,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid tutor id", 400);
    }
    const tutor = await Tutor.findById(id).populate("user", "name avatar email");
    if (!tutor) throw new AppError("Tutor not found", 404);
    sendResponse(res, 200, true, "Tutor fetched", { tutor });
  }),
};

// =====================================================
// 🎯 BOOKING CONTROLLERS
// =====================================================
const bookingController = {
  create: asyncHandler(async (req, res) => {
    const { tutorId, date, startTime, endTime, duration, notes } = req.body;
    if (!tutorId || !date || !startTime) {
      throw new AppError("tutorId, date and startTime are required", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
      throw new AppError("Invalid tutor id", 400);
    }

    const tutor = await Tutor.findById(tutorId);
    if (!tutor || !tutor.isActive) throw new AppError("Tutor not available", 404);
    if (tutor.user.toString() === req.user._id.toString())
      throw new AppError("Cannot book yourself", 400);

    const hours = (duration || 60) / 60;
    const amount = tutor.hourlyRate * hours;

    const conflict = await Booking.findOne({
      tutor: tutorId,
      date: new Date(date),
      startTime,
      status: { $in: ["pending", "confirmed"] },
    });
    if (conflict) throw new AppError("Time slot already booked", 409);

    const booking = await Booking.create({
      student: req.user._id,
      tutor: tutorId,
      date: new Date(date),
      startTime,
      endTime,
      duration: duration || 60,
      amount,
      currency: tutor.currency,
      notes: notes || "",
    });

    const io = req.app.get("io");
    io?.to(`user:${tutor.user}`).emit("booking-created", booking);
    sendResponse(res, 201, true, "Booking created", { booking });
  }),

  getTutorBookings: asyncHandler(async (req, res) => {
    const { tutorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
      throw new AppError("Invalid tutor id", 400);
    }
    const bookings = await Booking.find({
      tutor: tutorId,
      status: { $in: ["pending", "confirmed"] },
    }).select("date startTime endTime status");
    sendResponse(res, 200, true, "Tutor bookings fetched", { bookings });
  }),

  getMyBookings: asyncHandler(async (req, res) => {
    const { role = "student" } = req.query;
    let filter;
    if (role === "tutor") {
      const tutor = await Tutor.findOne({ user: req.user._id });
      if (!tutor) throw new AppError("Tutor profile not found", 404);
      filter = { tutor: tutor._id };
    } else {
      filter = { student: req.user._id };
    }

    const bookings = await Booking.find(filter)
      .populate("student", "name avatar email")
      .populate({ path: "tutor", populate: { path: "user", select: "name avatar email" } })
      .populate("sessionGroup", "name emoji members")
      .sort({ date: -1, startTime: -1 });

    sendResponse(res, 200, true, "Bookings fetched", { bookings });
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!["confirmed", "completed", "cancelled"].includes(status))
      throw new AppError("Invalid status", 400);

    const booking = await Booking.findById(req.params.id)
      .populate("student", "name email avatar")
      .populate({ path: "tutor", populate: { path: "user", select: "name email avatar" } });

    if (!booking) throw new AppError("Booking not found", 404);

    const tutor = await Tutor.findById(booking.tutor._id || booking.tutor);
    const isTutor = tutor.user.toString() === req.user._id.toString();
    const isStudent = booking.student._id.toString() === req.user._id.toString();
    if (!isTutor && !isStudent) throw new AppError("Not authorized", 403);

    // ✅ Tutor admin hoga session group mein
    if ((status === "confirmed" || status === "completed") && !booking.sessionGroup) {
      try {
        const studentName = booking.student?.name || "Student";
        const tutorName = booking.tutor?.user?.name || "Tutor";
        const dateStr = new Date(booking.date).toLocaleDateString();

        const group = await Group.create({
          name: `Session: ${studentName} & ${tutorName}`,
          description: `Tutoring session on ${dateStr} at ${booking.startTime}`,
          subject: "Tutoring Session",
          emoji: "🎓",
          isPrivate: true,
          maxMembers: 2,
          admin: tutor.user,
          members: [
            { user: tutor.user, role: "admin" },
            { user: booking.student._id, role: "member" },
          ],
          sessionStartedAt: new Date(),
          goal: `Session on ${dateStr}`,
        });

        await User.updateMany(
          { _id: { $in: [booking.student._id, tutor.user] } },
          { $addToSet: { groups: group._id } }
        );

        booking.sessionGroup = group._id;
        booking.meetingLink = `${allowedOrigins[0]}/groups/${group._id}/room`;
      } catch (err) {
        console.error("❌ Failed to create session group:", err.message);
      }
    }

    booking.status = status;
    if (status === "cancelled") {
      booking.cancelledBy = isTutor ? "tutor" : "student";
      booking.cancellationReason = req.body.reason || "";
    }
    if (status === "completed" && isTutor) {
      tutor.totalSessions += 1;
      await tutor.save();
    }
    await booking.save();

    const io = req.app.get("io");
    io?.to(`user:${booking.student._id}`).emit("booking-updated", booking);
    io?.to(`user:${tutor.user}`).emit("booking-updated", booking);
    sendResponse(res, 200, true, `Booking ${status}`, { booking });
  }),

  setMeetingLink: asyncHandler(async (req, res) => {
    const { meetingLink } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new AppError("Booking not found", 404);

    const tutor = await Tutor.findById(booking.tutor);
    if (tutor.user.toString() !== req.user._id.toString())
      throw new AppError("Only tutor can set meeting link", 403);

    booking.meetingLink = meetingLink;
    await booking.save();
    sendResponse(res, 200, true, "Meeting link set", { booking });
  }),
};

// =====================================================
// 🎯 REVIEW CONTROLLERS
// =====================================================
const reviewController = {
  create: asyncHandler(async (req, res) => {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      throw new AppError("bookingId and rating are required", 400);
    }
    const ratingNum = Number(rating);
    if (Number.isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new AppError("Booking not found", 404);
    if (booking.student.toString() !== req.user._id.toString()) {
      throw new AppError("Only the student can review this booking", 403);
    }
    if (booking.status !== "completed") {
      throw new AppError("You can only review completed sessions", 400);
    }

    const existing = await Review.findOne({ booking: bookingId });
    if (existing) throw new AppError("You already reviewed this session", 400);

    const review = await Review.create({
      tutor: booking.tutor,
      student: req.user._id,
      booking: bookingId,
      rating: ratingNum,
      comment: comment || "",
    });

    const stats = await Review.aggregate([
      { $match: { tutor: booking.tutor } },
      {
        $group: {
          _id: "$tutor",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Tutor.findByIdAndUpdate(booking.tutor, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        totalReviews: stats[0].count,
      });
    }

    await review.populate("student", "name avatar");
    sendResponse(res, 201, true, "Review submitted", { review });
  }),

  getTutorReviews: asyncHandler(async (req, res) => {
    const { tutorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
      throw new AppError("Invalid tutor id", 400);
    }
    const reviews = await Review.find({ tutor: tutorId })
      .populate("student", "name avatar")
      .sort({ createdAt: -1 })
      .limit(50);
    sendResponse(res, 200, true, "Reviews fetched", { reviews });
  }),
};

// =====================================================
// 🎯 ADMIN CONTROLLERS
// =====================================================
const adminController = {
  listPendingTutors: asyncHandler(async (req, res) => {
    const tutors = await Tutor.find({ isVerified: false })
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 });
    sendResponse(res, 200, true, "Pending tutors fetched", { tutors });
  }),

  verifyTutor: asyncHandler(async (req, res) => {
    const { tutorId } = req.params;
    const { isVerified } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
      throw new AppError("Invalid tutor id", 400);
    }

    const tutor = await Tutor.findByIdAndUpdate(
      tutorId,
      { isVerified: !!isVerified },
      { new: true }
    ).populate("user", "name email avatar");

    if (!tutor) throw new AppError("Tutor not found", 404);
    sendResponse(
      res, 200, true,
      `Tutor ${tutor.isVerified ? "verified ✅" : "unverified"}`,
      { tutor }
    );
  }),

  listAllTutors: asyncHandler(async (req, res) => {
    const tutors = await Tutor.find()
      .populate("user", "name email avatar role")
      .sort({ createdAt: -1 });
    sendResponse(res, 200, true, "All tutors fetched", { tutors });
  }),
};

// =====================================================
// 🌐 EXPRESS APP + HTTP SERVER
// =====================================================
const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ CORS blocked:", origin);
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (ENV.NODE_ENV === "development") app.use(morgan("dev"));

app.get("/api/health", (req, res) =>
  sendResponse(res, 200, true, "StudySync API running", {
    env: ENV.NODE_ENV,
    time: new Date().toISOString(),
    allowedOrigins,
  })
);

// =====================================================
// 🔌 SOCKET.IO
// =====================================================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  maxHttpBufferSize: 1e7,
});

io.use(async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers?.cookie) {
      const match = socket.handshake.headers.cookie.match(/token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) return next(new Error("Authentication required"));

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decoded.id).select("name avatar isPremium");
    if (!user) return next(new Error("User not found"));

    socket.user = {
      _id: user._id.toString(),
      name: user.name,
      avatar: user.avatar,
      isPremium: user.isPremium,
    };
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

const onlineUsers = new Map();
const groupPeers = new Map();

const buildPresence = async (userIds) => {
  if (!userIds.length) return [];
  const docs = await User.find({ _id: { $in: userIds } }, "name avatar");
  return docs.map((u) => ({
    _id: u._id.toString(),
    name: u.name,
    avatar: u.avatar,
  }));
};

const canDrawInGroup = async (groupId, userId) => {
  if (!groupId) return false;
  const group = await Group.findById(groupId).select("admin members");
  if (!group) return false;
  return group.canDraw(userId);
};

io.on("connection", (socket) => {
  const { _id: userId, name } = socket.user;
  socket.join(`user:${userId}`);
  console.log(`🔌 ${name} connected (${socket.id})`);

  socket.on("join-group", async ({ groupId }, cb) => {
    try {
      const group = await Group.findById(groupId);
      if (!group || !group.isMember(userId))
        return cb?.({ success: false, message: "Not a member" });

      socket.join(`group:${groupId}`);
      if (!onlineUsers.has(groupId)) onlineUsers.set(groupId, new Map());
      const map = onlineUsers.get(groupId);
      if (!map.has(userId)) map.set(userId, new Set());
      map.get(userId).add(socket.id);

      const presenceUsers = await buildPresence(Array.from(map.keys()));
      io.to(`group:${groupId}`).emit("presence-update", {
        users: presenceUsers,
      });

      const peers = groupPeers.get(groupId);
      if (peers) {
        socket.emit("peers-list", {
          peers: Array.from(peers.entries()).map(([peerId, info]) => ({
            peerId,
            ...info,
          })),
        });
      }

      socket.emit("whiteboard-sync", group.whiteboardStrokes || []);
      socket.emit("goal-sync", group.goal || "");
      socket.emit("lock-sync", group.isLocked || false);
      socket.emit("whiteboard-permission", {
        canDraw: group.canDraw(userId),
        isAdmin: group.isAdmin(userId),
      });

      cb?.({ success: true });
    } catch (err) {
      cb?.({ success: false, message: err.message });
    }
  });

  socket.on("leave-group", async ({ groupId }) => {
    socket.leave(`group:${groupId}`);
    const map = onlineUsers.get(groupId);
    if (map?.has(userId)) {
      map.get(userId).delete(socket.id);
      if (map.get(userId).size === 0) map.delete(userId);
      const presenceUsers = await buildPresence(Array.from(map.keys()));
      io.to(`group:${groupId}`).emit("presence-update", {
        users: presenceUsers,
      });
    }
  });

  socket.on("typing", ({ groupId, isTyping }) => {
    socket.to(`group:${groupId}`).emit("typing", { userId, name, isTyping });
  });

  socket.on("send-message", async ({ groupId, text }) => {
    try {
      if (!text?.trim()) return;
      const group = await Group.findById(groupId);
      if (!group || !group.isMember(userId)) return;

      const colorIndex = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
      const message = await Message.create({
        group: groupId,
        sender: userId,
        content: text.trim(),
        type: "text",
        authorName: name,
        authorInitial: (name || "U")[0].toUpperCase(),
        authorColor: AVATAR_COLORS[colorIndex],
      });

      io.to(`group:${groupId}`).emit("new-message", {
        _id: message._id,
        author: userId,
        authorName: name,
        authorInitial: (name || "U")[0].toUpperCase(),
        authorColor: AVATAR_COLORS[colorIndex],
        text: message.content,
        type: "text",
        createdAt: message.createdAt,
      });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("whiteboard-draw", async ({ groupId, stroke }) => {
    try {
      const ok = await canDrawInGroup(groupId, userId);
      if (!ok) {
        return socket.emit("whiteboard-denied", {
          reason: "Only admin/moderator can draw",
        });
      }
      socket.to(`group:${groupId}`).emit("stroke-received", { strokes: [stroke] });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("whiteboard-draw-point", async ({ groupId, strokeId, point }) => {
    try {
      const ok = await canDrawInGroup(groupId, userId);
      if (!ok) return;
      socket.to(`group:${groupId}`).emit("stroke-point-received", { strokeId, point });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("whiteboard-clear", async ({ groupId }) => {
    try {
      const ok = await canDrawInGroup(groupId, userId);
      if (!ok) {
        return socket.emit("whiteboard-denied", {
          reason: "Only admin/moderator can clear",
        });
      }
      socket.to(`group:${groupId}`).emit("whiteboard-clear");
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("cursor-move", ({ groupId, x, y }) => {
    socket.to(`group:${groupId}`).emit("cursor-update", { userId, name, x, y });
  });

  // ✅ VIDEO CALL — group-wide broadcast
  socket.on("video-started", async ({ groupId }) => {
    try {
      const group = await Group.findById(groupId);
      if (!group || !group.isMember(userId)) return;
      socket.to(`group:${groupId}`).emit("video-started", {
        startedBy: userId,
        name,
      });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("video-ended", async ({ groupId }) => {
    try {
      const group = await Group.findById(groupId);
      if (!group || !group.isMember(userId)) return;
      socket.to(`group:${groupId}`).emit("video-ended", {
        endedBy: userId,
        name,
      });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("peer-ready", ({ groupId, peerId, name: peerName }) => {
    if (!peerId) return;
    if (!groupPeers.has(groupId)) groupPeers.set(groupId, new Map());
    groupPeers.get(groupId).set(peerId, { name: peerName || name, userId });

    socket.to(`group:${groupId}`).emit("peer-ready", {
      peerId,
      name: peerName || name,
      userId,
    });
  });

  socket.on("peer-left", ({ groupId }) => {
    const peers = groupPeers.get(groupId);
    if (peers) {
      for (const [peerId, info] of peers.entries()) {
        if (info.userId === userId) peers.delete(peerId);
      }
      if (peers.size === 0) groupPeers.delete(groupId);
    }
    socket.to(`group:${groupId}`).emit("peer-left", { userId });
  });

  socket.on("webrtc-offer", ({ to, offer }) => {
    io.to(`user:${to}`).emit("webrtc-offer", { from: userId, name, offer });
  });
  socket.on("webrtc-answer", ({ to, answer }) => {
    io.to(`user:${to}`).emit("webrtc-answer", { from: userId, answer });
  });
  socket.on("webrtc-ice", ({ to, candidate }) => {
    io.to(`user:${to}`).emit("webrtc-ice", { from: userId, candidate });
  });

  socket.on("disconnect", async () => {
    for (const [groupId, map] of onlineUsers.entries()) {
      if (map.has(userId) && map.get(userId).has(socket.id)) {
        map.get(userId).delete(socket.id);
        if (map.get(userId).size === 0) map.delete(userId);
        const presenceUsers = await buildPresence(Array.from(map.keys()));
        io.to(`group:${groupId}`).emit("presence-update", {
          users: presenceUsers,
        });
      }
    }

    for (const [groupId, peers] of groupPeers.entries()) {
      for (const [peerId, info] of peers.entries()) {
        if (info.userId === userId) peers.delete(peerId);
      }
      if (peers.size === 0) groupPeers.delete(groupId);
      io.to(`group:${groupId}`).emit("peer-left", { userId });
    }

    console.log(`🔌 ${name} disconnected (${socket.id})`);
  });
});

app.set("io", io);

// =====================================================
// 🛣️ ROUTES
// =====================================================
const router = express.Router();

// -------- Auth --------
router.post(
  "/auth/register",
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name 2-50 chars"),
  body("email").isEmail().withMessage("Valid email required"),
  validate,
  authController.register
);
router.post(
  "/auth/login",
  body("email").isEmail().withMessage("Valid email required"),
  validate,
  authController.login
);
router.get("/auth/me", protect, authController.getMe);
router.post("/auth/logout", protect, authController.logout);
router.patch("/auth/profile", protect, authController.updateProfile);
router.patch("/auth/password", protect, authController.changePassword);
router.patch("/auth/premium", protect, authController.togglePremium);

// -------- Groups --------
router.post(
  "/groups",
  protect,
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Group name 2-100 chars"),
  validate,
  groupController.create
);
router.get("/groups", protect, groupController.getMyGroups);
router.get("/groups/:id", protect, groupController.getById);
router.patch("/groups/:id", protect, requireAdmin, groupController.update);
router.delete("/groups/:id", protect, requireAdmin, groupController.delete);
router.post("/groups/join/:inviteCode", protect, groupController.joinByInvite);
router.get("/groups/preview/:inviteCode", groupController.previewByInvite);
router.post("/groups/:id/regenerate-invite", protect, requireAdmin, groupController.regenerateInvite);
router.delete("/groups/:id/members/:userId", protect, requireAdmin, groupController.removeMember);
router.patch("/groups/:id/members/:userId/role", protect, requireAdmin, groupController.changeRole);
router.post("/groups/:id/leave", protect, requireMember, groupController.leave);
router.post("/groups/:id/transfer-admin", protect, requireAdmin, groupController.transferAdmin);
router.post("/groups/:id/session/start", protect, requireMember, groupController.startSession);
router.get("/groups/:id/messages", protect, requireMember, groupController.getMessages);
router.post("/groups/:id/messages", protect, requireMember, groupController.postMessage);
router.post("/groups/:id/whiteboard/save", protect, requireDrawPermission, groupController.saveWhiteboard);
router.post("/groups/:id/whiteboard/clear", protect, requireDrawPermission, groupController.clearWhiteboard);
router.patch("/groups/:id/goal", protect, requireMember, groupController.updateGoal);
router.patch("/groups/:id/lock", protect, requireMember, groupController.setLock);

// -------- Quizzes --------
router.post("/groups/:groupId/quizzes", protect, quizController.create);
router.get("/groups/:groupId/quizzes", protect, quizController.getGroupQuizzes);
router.get("/quizzes/:id", protect, quizController.getById);
router.post("/quizzes/:id/submit", protect, quizController.submit);
router.get("/quizzes/:id/leaderboard", protect, quizController.getLeaderboard);
router.get("/quizzes/me/attempts", protect, quizController.getMyAttempts);

// -------- Resources --------
router.post("/groups/:groupId/resources", protect, upload.single("file"), resourceController.upload);
router.get("/groups/:groupId/resources", protect, resourceController.getGroupResources);
router.get("/resources/:id/download", protect, resourceController.download);
router.delete("/resources/:id", protect, resourceController.remove);

// -------- Tutors --------
router.post("/tutors", protect, tutorController.register);
router.get("/tutors/me", protect, tutorController.getMyProfile);
router.patch("/tutors/me", protect, tutorController.update);
router.post("/tutors/me/avatar", protect, upload.single("avatar"), tutorController.uploadAvatar);
router.get("/tutors", tutorController.list);
router.get("/tutors/:id", tutorController.getById);
router.get("/tutors/:tutorId/bookings", bookingController.getTutorBookings);

// -------- Bookings --------
router.post("/bookings", protect, bookingController.create);
router.get("/bookings/me", protect, bookingController.getMyBookings);
router.patch("/bookings/:id/status", protect, bookingController.updateStatus);
router.patch("/bookings/:id/meeting-link", protect, bookingController.setMeetingLink);

// -------- Reviews --------
router.post("/reviews", protect, reviewController.create);
router.get("/tutors/:tutorId/reviews", reviewController.getTutorReviews);

// -------- Admin (tutor verification) --------
router.get("/admin/tutors", protect, authorize("admin"), adminController.listAllTutors);
router.get("/admin/tutors/pending", protect, authorize("admin"), adminController.listPendingTutors);
router.patch("/admin/tutors/:tutorId/verify", protect, authorize("admin"), adminController.verifyTutor);

app.use("/api", router);

// =====================================================
// 🚨 404 + ERROR HANDLER
// =====================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  }
  if (err.code === 11000) {
    statusCode = 400;
    message = `Duplicate value for: ${Object.keys(err.keyPattern).join(", ")}`;
  }
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }
  if (err.name === "MulterError") {
    statusCode = 400;
    message = `Upload error: ${err.message}`;
  }
  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON in request body";
  }
  if (message.startsWith("CORS blocked")) {
    statusCode = 403;
  }

  if (ENV.NODE_ENV === "development") console.error("❌", err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(ENV.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// =====================================================
// 🚀 BOOT
// =====================================================
const connectWithUri = async (uri, label) => {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 8000,
    maxPoolSize: 10,
  });
  console.log(`✅ MongoDB connected (${label})`);
};

const connectDB = async () => {
  mongoose.set("strictQuery", false);

  try {
    await connectWithUri(ENV.MONGO_URI, "primary");
    return;
  } catch (err) {
    console.warn(`⚠️  Primary MongoDB failed: ${err.message}`);
    if (ENV.MONGO_URI === ENV.MONGO_FALLBACK_URI) throw err;
  }

  try {
    await connectWithUri(ENV.MONGO_FALLBACK_URI, "local fallback");
    console.warn("⚠️  Using LOCAL MongoDB fallback.");
  } catch (err) {
    console.error("❌ Both MongoDB connections failed:", err.message);
    process.exit(1);
  }
};

const start = async () => {
  await connectDB();
  server.listen(ENV.PORT, () => {
    console.log(`🚀 StudySync API:  http://localhost:${ENV.PORT}`);
    console.log(`🔌 Socket.IO:      ws://localhost:${ENV.PORT}`);
    console.log(`🌐 Allowed origins: ${allowedOrigins.join(", ")}`);
  });
};

start();

// =====================================================
// 🛑 GRACEFUL SHUTDOWN
// =====================================================
let shuttingDown = false;
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} received — shutting down...`);
  try { io.close(); } catch {}
  server.close(() => console.log("HTTP server closed"));
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    }
  } catch {}
  process.exit(0);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err?.message || err);
  if (err?.name === "MongoServerSelectionError" || err?.name === "MongoNetworkError") {
    console.warn("⚠️  MongoDB transient error — server continues running");
    return;
  }
  shutdown("unhandledRejection");
});