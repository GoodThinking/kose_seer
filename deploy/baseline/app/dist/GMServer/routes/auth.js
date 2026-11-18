"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const authController = new AuthController_1.AuthController();
// 公开路由（无需认证）
router.post('/login', authController.login);
// 需要认证的路由
router.post('/logout', auth_1.authMiddleware, authController.logout);
router.get('/current', auth_1.authMiddleware, authController.getCurrentUser);
// 白名单管理（需要白名单权限）
router.get('/whitelist', auth_1.authMiddleware, (0, auth_1.whitelistMiddleware)('*'), authController.getWhitelist);
router.post('/whitelist', auth_1.authMiddleware, (0, auth_1.whitelistMiddleware)('*'), authController.addToWhitelist);
router.delete('/whitelist', auth_1.authMiddleware, (0, auth_1.whitelistMiddleware)('*'), authController.removeFromWhitelist);
exports.default = router;
//# sourceMappingURL=auth.js.map