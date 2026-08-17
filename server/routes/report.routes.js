const router = require('express').Router();
const reportController = require('../controllers/report.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

router.use(requireAuth, requireRole('LANDLORD'));

router.get('/summary', reportController.summary);
router.get('/export', reportController.exportPdf);

module.exports = router;
