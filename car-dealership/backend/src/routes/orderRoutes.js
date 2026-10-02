const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { createOrder, listOrders, getOrder, updateOrderStatus, cancelOrder } = require('../controllers/orderController');

const router = express.Router();

router.use(authenticate);

router.post('/', createOrder);
router.get('/', listOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', requireAdmin, updateOrderStatus);
router.post('/:id/cancel', cancelOrder);

module.exports = router;
