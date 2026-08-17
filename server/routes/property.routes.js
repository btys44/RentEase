const router = require('express').Router();
const propertyController = require('../controllers/property.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/', propertyController.list);
router.get('/:id', propertyController.getOne);
router.post('/', requireRole('LANDLORD'), propertyController.create);
router.put('/:id', requireRole('LANDLORD'), propertyController.update);
router.delete('/:id', requireRole('LANDLORD'), propertyController.remove);

module.exports = router;
