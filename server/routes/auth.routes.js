const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.me);
router.put('/change-password', requireAuth, authController.changePassword);
router.put('/profile', requireAuth, authController.updateProfile);
router.put('/preferences', requireAuth, authController.updatePreferences);

module.exports = router;
