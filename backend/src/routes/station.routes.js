const express = require('express');
const router = express.Router();
const stationController = require('../controllers/station.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// Fetch all available SPBKLU Charging Stations (Public or User/Admin)
router.get('/', stationController.getAllStations);

// Fetch station slots & charger details by station ID
router.get('/:id', stationController.getStationDetail);

// Create a new station (Requires Login & Admin Role)
router.post('/', verifyToken, isAdmin, stationController.createStation);

// Update station data/status (Requires Login & Admin Role)
router.put('/:id', verifyToken, isAdmin, stationController.updateStation);

// Delete station if it has no legacy transaction history (Requires Login & Admin Role)
router.delete('/:id', verifyToken, isAdmin, stationController.deleteStation);

module.exports = router;
