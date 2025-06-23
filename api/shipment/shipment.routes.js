import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'

import { getShipments, getShipmentById, addShipment, updateShipment, removeShipment, addShipmentMsg, removeShipmentMsg } from './shipment.controller.js'

const router = express.Router()

// We can add a middleware for the entire router:
// router.use(requireAuth)

router.get('/', log, getShipments)
router.get('/:id', log, getShipmentById)
router.post('/', log, requireAuth, addShipment)
router.put('/:id', requireAuth, updateShipment)
router.delete('/:id', requireAuth, removeShipment)
// router.delete('/:id', requireAuth, requireAdmin, removeShipment)

router.post('/:id/msg', requireAuth, addShipmentMsg)
router.delete('/:id/msg/:msgId', requireAuth, removeShipmentMsg)

export const shipmentRoutes = router