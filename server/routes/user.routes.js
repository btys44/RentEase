const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

router.get('/', requireAuth, requireRole('LANDLORD'), userController.listByRole);

module.exports = router;
