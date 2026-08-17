const router = require('express').Router();
const unitController = require('../controllers/unit.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

router.use(requireAuth, requireRole('LANDLORD'));

router.post('/', unitController.create);
router.put('/:id', unitController.update);
router.delete('/:id', unitController.remove);

module.exports = router;
