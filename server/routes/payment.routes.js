const router = require('express').Router();
const paymentController = require('../controllers/payment.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/', paymentController.list);
router.post('/', requireRole('LANDLORD', 'CARETAKER'), paymentController.create);
router.post('/stk-push', requireRole('LANDLORD', 'CARETAKER', 'TENANT'), paymentController.initiateStkPush);
router.put('/:id/status', requireRole('LANDLORD'), paymentController.updateStatus);

module.exports = router;
