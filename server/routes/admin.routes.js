const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

router.use(requireAuth, requireRole('ADMIN'));

router.get('/overview', adminController.overview);
router.get('/users', adminController.listUsers);
router.put('/users/:id/active', adminController.setActive);
router.put('/users/:id/password', adminController.resetPassword);
router.get('/properties', adminController.listProperties);

module.exports = router;