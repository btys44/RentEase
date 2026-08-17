const router = require('express').Router();
const tenantController = require('../controllers/tenant.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/me', requireRole('TENANT'), tenantController.myProfile);
router.get('/', requireRole('LANDLORD', 'CARETAKER'), tenantController.list);
router.post('/', requireRole('LANDLORD'), tenantController.create);
router.put('/:id', requireRole('LANDLORD'), tenantController.update);
router.delete('/:id', requireRole('LANDLORD'), tenantController.remove);

module.exports = router;
