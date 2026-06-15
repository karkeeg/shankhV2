import { Router } from "express";
import { login, signup, getMe, logout, updateProfile, changePassword, onboard } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     description: Authenticates a user and returns the user profile plus a 7-day JWT.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email, example: ada@shankh.com }
 *               password: { type: string, format: password, example: hunter2 }
 *     responses:
 *       200:
 *         description: Login succeeded.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401:
 *         description: Invalid email or password.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: Invalid credentials }
 */
router.post("/login", login);

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Create a new account
 *     description: Registers a user and returns the profile plus a 7-day JWT. `role` defaults to `learner`; any value other than `admin` is coerced to `learner`.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: Ada Lovelace }
 *               email:    { type: string, format: email, example: ada@shankh.com }
 *               password: { type: string, format: password, example: hunter2 }
 *               role:     { type: string, enum: [learner, admin], default: learner }
 *     responses:
 *       201:
 *         description: Account created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post("/signup", signup);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the current authenticated user
 *     responses:
 *       200:
 *         description: The authenticated user's profile.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/me", requireAuth, getMe);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out
 *     description: Stateless logout — the client should discard its token. Returns a success flag.
 *     responses:
 *       200:
 *         description: Logout acknowledged.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessFlag' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post("/logout", requireAuth, logout);

/**
 * @openapi
 * /auth/profile:
 *   patch:
 *     tags: [Auth]
 *     summary: Update profile fields
 *     description: Partially updates the current user. Any omitted field is left unchanged.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:      { type: string, example: Ada Lovelace }
 *               phone:     { type: string, example: "+1-555-0100" }
 *               avatarUrl: { type: string, example: https://cdn.shankh.com/a.png }
 *     responses:
 *       200:
 *         description: Updated user profile.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.patch("/profile", requireAuth, updateProfile);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change the current user's password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Password changed.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessFlag' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401:
 *         description: Missing token, or the old password is incorrect.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: Old password is incorrect }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/change-password", requireAuth, changePassword);

/**
 * @openapi
 * /auth/onboard:
 *   post:
 *     tags: [Auth]
 *     summary: Complete onboarding
 *     description: Sets onboarding profile fields and marks the user as onboarded. `username` must be unique (case-insensitive). All fields are optional; omitted fields are left unchanged.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:       { type: string, example: Ada Lovelace }
 *               username:   { type: string, example: ada }
 *               phone:      { type: string, example: "+1-555-0100" }
 *               profession: { type: string, example: Investment Banker }
 *               level:      { type: string, example: beginner }
 *               goal:       { type: string, example: Land a finance role }
 *               firstTopic: { type: string, example: time-value-of-money }
 *     responses:
 *       200:
 *         description: Onboarding complete; returns the updated user.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserResponse' }
 *       400:
 *         description: Username already taken.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: Username is already taken }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
router.post("/onboard", requireAuth, onboard);

export default router;
