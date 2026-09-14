const router = require('express').Router();
const helpdeskController = require('../controllers/helpdesk.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/ask', requireAuth, helpdeskController.ask);

module.exports = router;