const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  listVehicles,
  searchVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  purchaseVehicle,
  restockVehicle,
} = require('../controllers/vehicleController');

const router = express.Router();

// All vehicle routes require a logged-in user.
router.use(authenticate);

// IMPORTANT: /search must be declared before the /:id route, otherwise
// Express would treat "search" as an :id value.
router.get('/search', searchVehicles);

router.get('/', listVehicles);
router.get('/:id', getVehicle);
router.post('/', requireAdmin, createVehicle);
router.put('/:id', requireAdmin, updateVehicle);
router.delete('/:id', requireAdmin, deleteVehicle);

router.post('/:id/purchase', purchaseVehicle);
router.post('/:id/restock', requireAdmin, restockVehicle);

module.exports = router;
