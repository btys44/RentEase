const router = require('express').Router();
const notificationController = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/', notificationController.list);
router.put('/:id/read', notificationController.markRead);
router.put('/read-all', notificationController.markAllRead);

module.exports = router;
