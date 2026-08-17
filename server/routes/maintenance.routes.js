const router = require('express').Router();
const maintenanceController = require('../controllers/maintenance.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(requireAuth);

router.get('/', maintenanceController.list);
router.post('/', requireRole('TENANT'), upload.single('photo'), maintenanceController.create);
router.put('/:id/assign', requireRole('LANDLORD'), maintenanceController.assign);
router.put('/:id/status', requireRole('LANDLORD', 'CARETAKER'), maintenanceController.updateStatus);

module.exports = router;
