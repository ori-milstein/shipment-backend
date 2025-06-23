import { logger } from '../../services/logger.service.js'
import { shipmentService } from './shipment.service.js'

export async function getShipments(req, res) {
	try {
		const filterBy = {
			/* txt: req.query.txt || '',
			minSpeed: +req.query.minSpeed || 0,
			sortField: req.query.sortField || '',
			sortDir: req.query.sortDir || 1,
			pageIdx: req.query.pageIdx, */
			sortField: req.query.sortField || '',
			sortDir: req.query.sortDir || 1,

		}
		const shipments = await shipmentService.query(filterBy)
		res.json(shipments)
	} catch (err) {
		logger.error('Failed to get shipments', err)
		res.status(400).send({ err: 'Failed to get shipments' })
	}
}

export async function getShipmentById(req, res) {
	try {
		const shipmentId = req.params.id
		const shipment = await shipmentService.getById(shipmentId)
		res.json(shipment)
	} catch (err) {
		logger.error('Failed to get shipment', err)
		res.status(400).send({ err: 'Failed to get shipment' })
	}
}

export async function addShipment(req, res) {
	const { loggedinUser, body: shipment } = req

	try {
		shipment.owner = loggedinUser
		const addedShipment = await shipmentService.add(shipment)
		res.json(addedShipment)
	} catch (err) {
		logger.error('Failed to add shipment', err)
		res.status(400).send({ err: 'Failed to add shipment' })
	}
}

export async function updateShipment(req, res) {
	const { loggedinUser, body: shipment } = req
	const { _id: userId, isAdmin } = loggedinUser

	if (!isAdmin && shipment.owner._id !== userId) {
		res.status(403).send('Not your shipment...')
		return
	}

	try {
		const updatedShipment = await shipmentService.update(shipment)
		res.json(updatedShipment)
	} catch (err) {
		logger.error('Failed to update shipment', err)
		res.status(400).send({ err: 'Failed to update shipment' })
	}
}

export async function removeShipment(req, res) {
	try {
		const shipmentId = req.params.id
		const removedId = await shipmentService.remove(shipmentId)

		res.send(removedId)
	} catch (err) {
		logger.error('Failed to remove shipment', err)
		res.status(400).send({ err: 'Failed to remove shipment' })
	}
}

export async function addShipmentMsg(req, res) {
	const { loggedinUser } = req

	try {
		const shipmentId = req.params.id
		const msg = {
			txt: req.body.txt,
			by: loggedinUser,
		}
		const savedMsg = await shipmentService.addShipmentMsg(shipmentId, msg)
		res.json(savedMsg)
	} catch (err) {
		logger.error('Failed to update shipment', err)
		res.status(400).send({ err: 'Failed to update shipment' })
	}
}

export async function removeShipmentMsg(req, res) {
	try {
		const shipmentId = req.params.id
		const { msgId } = req.params

		const removedId = await shipmentService.removeShipmentMsg(shipmentId, msgId)
		res.send(removedId)
	} catch (err) {
		logger.error('Failed to remove shipment msg', err)
		res.status(400).send({ err: 'Failed to remove shipment msg' })
	}
}
