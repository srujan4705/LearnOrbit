import crypto from "crypto";
import fs from "fs";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import {
  createPublicUser,
  requireAdmin,
  requireAuth,
  signToken,
} from "./auth.js";
import { getClient, query, testConnection } from "./db.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const APP_URL = process.env.APP_URL || "http://localhost:5173";
const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || "admin@learnorbit.com"
).toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const ADMIN_NAME = process.env.ADMIN_NAME || "LearnOrbit Admin";

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "LearnOrbit API",
      version: "1.0.0",
      description: "API documentation for LearnOrbit - a learning platform",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./backend/server.js"], // Path to the API docs
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

const ENTITY_CONFIG = {
  users: {
    table: "users",
    columns: ["email", "full_name", "role"],
    selectColumns: [
      "id",
      "email",
      "full_name",
      "role",
      "created_at",
      "updated_at",
    ],
    defaultOrder: "created_at",
    adminListOnly: true,
    adminWriteOnly: true,
  },
  courses: {
    table: "courses",
    columns: [
      "name",
      "description",
      "start_date",
      "end_date",
      "thumbnail_url",
      "status",
    ],
    selectColumns: [
      "id",
      "name",
      "description",
      "start_date",
      "end_date",
      "thumbnail_url",
      "status",
      "created_at",
      "updated_at",
    ],
    defaultOrder: "created_at",
    adminWriteOnly: true,
  },
  "course-topics": {
    table: "course_topics",
    columns: [
      "course_id",
      "week_number",
      "day_number",
      "topic_name",
      "topic_description",
      "resource_url",
      "estimated_hours",
    ],
    selectColumns: [
      "id",
      "course_id",
      "week_number",
      "day_number",
      "topic_name",
      "topic_description",
      "resource_url",
      "estimated_hours",
      "created_at",
      "updated_at",
    ],
    defaultOrder: "created_at",
    adminWriteOnly: true,
  },
  enrollments: {
    table: "enrollments",
    columns: ["user_id", "course_id", "enrolled_date", "status"],
    selectColumns: [
      "id",
      "user_id",
      "course_id",
      "enrolled_date",
      "status",
      "created_at",
      "updated_at",
    ],
    defaultOrder: "created_at",
    scopedToUser: true,
  },
  "user-progress": {
    table: "user_progress",
    columns: [
      "user_id",
      "course_id",
      "topic_id",
      "week_number",
      "day_number",
      "status",
      "hours_studied",
      "difficulty",
      "remarks",
      "submission_date",
    ],
    selectColumns: [
      "id",
      "user_id",
      "course_id",
      "topic_id",
      "week_number",
      "day_number",
      "status",
      "hours_studied",
      "difficulty",
      "remarks",
      "submission_date",
      "created_at",
      "updated_at",
    ],
    defaultOrder: "created_at",
    scopedToUser: true,
  },
};

const COLUMN_ALIASES = {
  created_date: "created_at",
};

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

// Swagger UI endpoint
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Update current user profile (only their own name)
app.put("/api/auth/profile", requireAuth, async (req, res) => {
  try {
    const { full_name } = req.body;
    
    const { rows } = await query(
      `UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, full_name, role, created_at, updated_at`,
      [full_name, req.user.id]
    );
    
    res.json(rows[0]);
  } catch (error) {
    sendError(res, error);
  }
});

function getEntityConfig(entityName) {
  return ENTITY_CONFIG[entityName];
}

function resolveColumn(config, rawColumn) {
  const column = COLUMN_ALIASES[rawColumn] || rawColumn;
  return config.selectColumns.includes(column) ||
    config.columns.includes(column)
    ? column
    : null;
}

function sanitizePayload(config, payload = {}) {
  const sanitized = {};

  for (const column of config.columns) {
    if (payload[column] !== undefined) {
      sanitized[column] = payload[column];
    }
  }

  return sanitized;
}

function buildFilters(config, rawFilters = {}) {
  const filters = [];

  for (const [key, value] of Object.entries(rawFilters)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    const column = resolveColumn(config, key);
    if (column) {
      filters.push([column, value]);
    }
  }

  return filters;
}

function parseOrder(config, orderValue, orderByValue, orderDirValue) {
  let column = config.defaultOrder;
  let direction = "DESC";

  if (typeof orderValue === "string" && orderValue.trim()) {
    const trimmed = orderValue.trim();
    direction = trimmed.startsWith("-") ? "DESC" : "ASC";
    column = trimmed.replace(/^[-+]/, "");
  } else if (typeof orderByValue === "string" && orderByValue.trim()) {
    column = orderByValue.trim();
    direction =
      String(orderDirValue || "ASC").toUpperCase() === "DESC" ? "DESC" : "ASC";
  }

  const resolvedColumn = resolveColumn(config, column) || config.defaultOrder;
  return { column: resolvedColumn, direction };
}

async function findEntityRow(config, id) {
  const { rows } = await query(
    `SELECT ${config.selectColumns.join(", ")} FROM ${config.table} WHERE id = $1 LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

function applyScopedAccess(entityName, req, filters) {
  const config = getEntityConfig(entityName);

  if (!config) {
    return { type: "missing" };
  }

  if (config.adminListOnly && req.user.role !== "admin") {
    return { type: "forbidden" };
  }

  if (config.scopedToUser && req.user.role !== "admin") {
    return {
      type: "ok",
      filters: {
        ...filters,
        user_id: req.user.id,
      },
    };
  }

  return { type: "ok", filters };
}

async function ensureDatabase() {
  const schemaSql = fs.readFileSync(
    new URL("./sql/schema.sql", import.meta.url),
    "utf8",
  );
  await query(schemaSql);
}

async function ensureAdminUser() {
  const existingAdmin = await query(
    "SELECT id FROM users WHERE email = $1 LIMIT 1",
    [ADMIN_EMAIL],
  );

  if (existingAdmin.rows.length > 0) {
    return existingAdmin.rows[0];
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const { rows } = await query(
    `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, 'admin')
      RETURNING id
    `,
    [ADMIN_EMAIL, passwordHash, ADMIN_NAME],
  );

  return rows[0];
}

async function ensureSampleData(adminId) {
  if (
    String(process.env.SEED_SAMPLE_DATA || "true").toLowerCase() === "false"
  ) {
    return;
  }

  const existingCourses = await query("SELECT id FROM courses LIMIT 1");
  if (existingCourses.rows.length > 0) {
    return;
  }

  const { rows: courseRows } = await query(
    `
      INSERT INTO courses (name, description, start_date, end_date, status, thumbnail_url)
      VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '29 days', 'active', $3)
      RETURNING id
    `,
    [
      "Full Stack Web Development",
      "Sample course created automatically so you can test the admin and learner flows.",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    ],
  );

  const courseId = courseRows[0].id;

  await query(
    `
      INSERT INTO course_topics (course_id, week_number, day_number, topic_name, topic_description, resource_url, estimated_hours)
      VALUES
      ($1, 1, 1, 'HTML Basics', 'Intro to semantic HTML and page structure.', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax', 2),
      ($1, 1, 2, 'CSS Basics', 'Core styling concepts, selectors, and layout.', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics', 2),
      ($1, 1, 3, 'JavaScript Basics', 'Variables, functions, and arrays.', 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps', 3)
    `,
    [courseId],
  );

  await query(
    `
      INSERT INTO enrollments (user_id, course_id, enrolled_date, status)
      VALUES ($1, $2, CURRENT_DATE, 'active')
      ON CONFLICT (user_id, course_id) DO NOTHING
    `,
    [adminId, courseId],
  );
}

function sendError(res, error) {
  if (error.code === "23505") {
    return res
      .status(409)
      .json({ message: "A record with the same value already exists" });
  }

  if (error.code === "23503") {
    return res.status(400).json({ message: "Related record does not exist" });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
}

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the server is running and connected to the database
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 */
app.get("/api/health", async (_req, res) => {
  try {
    await testConnection();
    res.json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * @swagger
 * /api/leaderboard:
 *   get:
 *     summary: Get weekly leaderboard
 *     description: Retrieve the weekly leaderboard with ranks, hours studied, and current user's rank
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leaderboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leaderboardData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       userId:
 *                         type: number
 *                       userName:
 *                         type: string
 *                       courseName:
 *                         type: string
 *                       hours:
 *                         type: number
 *                       entries:
 *                         type: number
 *                 currentUserRank:
 *                   type: number
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 */
app.get("/api/leaderboard", requireAuth, async (req, res) => {
  try {
    // Use date-fns logic for week start/end (consistent with frontend)
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Sunday as week start
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get all enrollments (active and maybe others?)
    const { rows: enrollments } = await query(
      `SELECT id, user_id, course_id FROM enrollments`
    );

    // Get all users
    const { rows: users } = await query(
      `SELECT id, email, full_name FROM users`
    );

    // Get all courses
    const { rows: courses } = await query(
      `SELECT id, name FROM courses`
    );

    // Get current week progress (unfiltered)
    const { rows: progress } = await query(
      `SELECT user_id, course_id, hours_studied, submission_date 
       FROM user_progress 
       WHERE submission_date >= $1 AND submission_date <= $2`,
      [weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]]
    );

    // Build maps
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    const courseMap = {};
    courses.forEach(c => { courseMap[c.id] = c; });

    // Build leaderboard data
    const leaderboardData = enrollments.map(enrollment => {
      const user = userMap[enrollment.user_id];
      const course = courseMap[enrollment.course_id];
      
      const userWeekProgress = progress.filter(
        p => p.user_id === enrollment.user_id && p.course_id === enrollment.course_id
      );
      
      const totalHours = userWeekProgress.reduce(
        (sum, p) => sum + Number(p.hours_studied || 0),
        0
      );

      return {
        id: enrollment.id,
        userId: user?.id,
        userName: user?.full_name || user?.email || 'Unknown',
        courseName: course?.name || 'Unknown',
        hours: totalHours,
        entries: userWeekProgress.length,
      };
    })
    .sort((a, b) => b.hours - a.hours); // Sort by hours descending, keep all

    // Find current user's rank
    const currentUserId = req.user?.id;
    const currentUserIndex = leaderboardData.findIndex(item => item.userId === currentUserId);
    const currentUserRank = currentUserIndex !== -1 ? currentUserIndex + 1 : null;

    return res.json({ leaderboardData, currentUserRank });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new learner account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               full_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Invalid input
 */
app.post("/api/auth/register", async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body?.password || "");
  const fullName = String(req.body?.full_name || "").trim() || null;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES ($1, $2, $3, 'learner')
        RETURNING id, email, full_name, role, created_at, updated_at
      `,
      [email, passwordHash, fullName],
    );

    const user = rows[0];
    const accessToken = signToken(user);
    return res.status(201).json({
      access_token: accessToken,
      user,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     description: Authenticate a user and return a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const { rows } = await query(
      "SELECT * FROM users WHERE email = $1 LIMIT 1",
      [email],
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = signToken(user);
    return res.json({
      access_token: accessToken,
      user: createPublicUser(user),
    });
  } catch (error) {
    return sendError(res, error);
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT id, email, full_name, role, created_at, updated_at FROM users WHERE id = $1 LIMIT 1",
      [req.user.id],
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(rows[0]);
  } catch (error) {
    return sendError(res, error);
  }
});

app.post("/api/auth/reset-password-request", async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const { rows } = await query(
      "SELECT id, email FROM users WHERE email = $1 LIMIT 1",
      [email],
    );
    const user = rows[0];

    if (user) {
      const resetToken = crypto.randomBytes(24).toString("hex");
      await query(
        `
          INSERT INTO password_reset_tokens (user_id, token, expires_at)
          VALUES ($1, $2, NOW() + INTERVAL '1 hour')
        `,
        [user.id, resetToken],
      );

      console.log(
        `Password reset link for ${user.email}: ${APP_URL}/reset-password?token=${resetToken}`,
      );
    }

    return res.json({ ok: true });
  } catch (error) {
    return sendError(res, error);
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const resetToken = String(req.body?.resetToken || "").trim();
  const newPassword = String(req.body?.newPassword || "");

  if (!resetToken || !newPassword) {
    return res
      .status(400)
      .json({ message: "Reset token and new password are required" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  const client = await getClient();

  try {
    await client.query("BEGIN");

    const tokenResult = await client.query(
      `
        SELECT id, user_id
        FROM password_reset_tokens
        WHERE token = $1
          AND used_at IS NULL
          AND expires_at > NOW()
        LIMIT 1
      `,
      [resetToken],
    );

    const resetRow = tokenResult.rows[0];
    if (!resetRow) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await client.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [passwordHash, resetRow.user_id],
    );
    await client.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1",
      [resetRow.id],
    );

    await client.query("COMMIT");
    return res.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    return sendError(res, error);
  } finally {
    client.release();
  }
});

app.get("/api/entities/:entity", requireAuth, async (req, res) => {
  const config = getEntityConfig(req.params.entity);
  if (!config) {
    return res.status(404).json({ message: "Unknown entity" });
  }

  const scope = applyScopedAccess(req.params.entity, req, req.query);
  if (scope.type === "forbidden") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const filters = buildFilters(config, scope.filters);
    const { column, direction } = parseOrder(
      config,
      req.query.order,
      req.query.orderBy,
      req.query.orderDir,
    );
    const limit = Math.min(Number(req.query.limit || 1000), 1000);
    const offset = Math.max(Number(req.query.offset || 0), 0);

    const whereParts = [];
    const values = [];
    for (const [columnName, value] of filters) {
      values.push(value);
      whereParts.push(`${columnName} = $${values.length}`);
    }

    values.push(limit);
    values.push(offset);

    const sql = `
      SELECT ${config.selectColumns.join(", ")}
      FROM ${config.table}
      ${whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : ""}
      ORDER BY ${column} ${direction}
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
    `;

    const { rows } = await query(sql, values);
    return res.json(rows);
  } catch (error) {
    return sendError(res, error);
  }
});

app.post("/api/entities/:entity", requireAuth, async (req, res) => {
  const entityName = req.params.entity;
  const config = getEntityConfig(entityName);

  if (!config) {
    return res.status(404).json({ message: "Unknown entity" });
  }

  if (config.adminWriteOnly && req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const payload = sanitizePayload(config, req.body);

  if (config.scopedToUser && req.user.role !== "admin") {
    payload.user_id = req.user.id;
  }

  if (entityName === "users") {
    return res
      .status(403)
      .json({ message: "Use the auth endpoints to create users" });
  }

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ message: "No valid fields were provided" });
  }

  try {
    const columns = Object.keys(payload);
    const values = Object.values(payload);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    const { rows } = await query(
      `
        INSERT INTO ${config.table} (${columns.join(", ")})
        VALUES (${placeholders.join(", ")})
        RETURNING ${config.selectColumns.join(", ")}
      `,
      values,
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    return sendError(res, error);
  }
});

app.put("/api/entities/:entity/:id", requireAuth, async (req, res) => {
  const entityName = req.params.entity;
  const config = getEntityConfig(entityName);

  if (!config) {
    return res.status(404).json({ message: "Unknown entity" });
  }

  if (config.adminWriteOnly && req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const existing = await findEntityRow(config, req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (
      config.scopedToUser &&
      req.user.role !== "admin" &&
      existing.user_id !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const payload = sanitizePayload(config, req.body);
    if (config.scopedToUser && req.user.role !== "admin") {
      delete payload.user_id;
    }

    const columns = Object.keys(payload);

    if (columns.length === 0) {
      return res.status(400).json({ message: "No valid fields were provided" });
    }

    const assignments = columns.map(
      (column, index) => `${column} = $${index + 1}`,
    );
    const values = columns.map((column) => payload[column]);
    values.push(req.params.id);

    const { rows } = await query(
      `
        UPDATE ${config.table}
        SET ${assignments.join(", ")}, updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING ${config.selectColumns.join(", ")}
      `,
      values,
    );

    return res.json(rows[0]);
  } catch (error) {
    console.error("PATCH ERROR");
    console.error(error);
    return sendError(res, error);
  }
});

app.delete("/api/entities/:entity/:id", requireAuth, async (req, res) => {
  const entityName = req.params.entity;
  const config = getEntityConfig(entityName);

  if (!config) {
    return res.status(404).json({ message: "Unknown entity" });
  }

  if (config.adminWriteOnly && req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const existing = await findEntityRow(config, req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (
      config.scopedToUser &&
      req.user.role !== "admin" &&
      existing.user_id !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await query(`DELETE FROM ${config.table} WHERE id = $1`, [req.params.id]);
    return res.json({ ok: true });
  } catch (error) {
    return sendError(res, error);
  }
});

app.use((err, _req, res, _next) => {
  sendError(res, err);
});

async function start() {
  await ensureDatabase();
  const admin = await ensureAdminUser();
  await ensureSampleData(admin.id);

  app.listen(PORT, () => {
    console.log(`LearnOrbit backend running on http://localhost:${PORT}`);
    console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server");
  console.error(error);
  process.exit(1);
});
