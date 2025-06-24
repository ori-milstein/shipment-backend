import { ObjectId } from 'mongodb'

import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'

const PAGE_SIZE = 3

export const shipmentService = {
	remove,
	query,
	getById,
	add,
	update,
	addShipmentMsg,
	removeShipmentMsg,
}

async function query(filterBy = {}) {
	try {
		const criteria = _buildCriteria(filterBy)
		const sort = _buildSort(filterBy)

		const collection = await dbService.getCollection('shipment')
		var shipmentCursor = await collection.find(criteria, { sort })

		if (filterBy.pageIdx !== undefined) {
			shipmentCursor.skip(filterBy.pageIdx * PAGE_SIZE).limit(PAGE_SIZE)
		}

		const shipments = shipmentCursor.toArray()
		return shipments
	} catch (err) {
		logger.error('cannot find shipments', err)
		throw err
	}
}

async function getById(shipmentId) {
	try {
		const criteria = { _id: ObjectId.createFromHexString(shipmentId) }

		const collection = await dbService.getCollection('shipment')
		const shipment = await collection.findOne(criteria)

		shipment.createdAt = shipment._id.getTimestamp()
		return shipment
	} catch (err) {
		logger.error(`while finding shipment ${shipmentId}`, err)
		throw err
	}
}

async function remove(shipmentId) {
	const { loggedinUser } = asyncLocalStorage.getStore()
	const { _id: ownerId, isAdmin } = loggedinUser

	try {
		const criteria = {
			_id: ObjectId.createFromHexString(shipmentId),
		}
		if (!isAdmin) criteria['owner._id'] = ownerId

		const collection = await dbService.getCollection('shipment')
		const res = await collection.deleteOne(criteria)

		if (res.deletedCount === 0) throw ('Not your shipment')
		return shipmentId
	} catch (err) {
		logger.error(`cannot remove shipment ${shipmentId}`, err)
		throw err
	}
}

async function add(shipment) {
	try {
		const collection = await dbService.getCollection('shipment')
		await collection.insertOne(shipment)

		return shipment
	} catch (err) {
		logger.error('cannot insert shipment', err)
		throw err
	}
}

async function update(shipment) {
	const shipmentToSave = { vendor: shipment.vendor, speed: shipment.speed }

	try {
		const criteria = { _id: ObjectId.createFromHexString(shipment._id) }

		const collection = await dbService.getCollection('shipment')
		await collection.updateOne(criteria, { $set: shipmentToSave })

		return shipment
	} catch (err) {
		logger.error(`cannot update shipment ${shipment._id}`, err)
		throw err
	}
}

async function addShipmentMsg(shipmentId, msg) {
	try {
		const criteria = { _id: ObjectId.createFromHexString(shipmentId) }
		msg.id = makeId()

		const collection = await dbService.getCollection('shipment')
		await collection.updateOne(criteria, { $push: { msgs: msg } })

		return msg
	} catch (err) {
		logger.error(`cannot add shipment msg ${shipmentId}`, err)
		throw err
	}
}

async function removeShipmentMsg(shipmentId, msgId) {
	try {
		const criteria = { _id: ObjectId.createFromHexString(shipmentId) }

		const collection = await dbService.getCollection('shipment')
		await collection.updateOne(criteria, { $pull: { msgs: { id: msgId } } })

		return msgId
	} catch (err) {
		logger.error(`cannot add shipment msg ${shipmentId}`, err)
		throw err
	}
}

function _buildCriteria(filterBy) {
	const criteria = {
		/* vendor: { $regex: filterBy.txt, $options: 'i' },
		speed: { $gte: filterBy.minSpeed }, */
	}

	return criteria
}

function _buildSort(filterBy) {
	if (!filterBy.sortField) return {}
	return { [filterBy.sortField]: filterBy.sortDir }
}


function isShipmentAtRisk(shipmentData) {
	const currentTime = new Date().getTime()

	const transportHasntBegun = !shipmentData.shipment_on_its_way
	const timeForTransportToBegin = calculateTimeForTransportToBegin(shipmentData)
	const transportShouldBegin = currentTime >= timeForTransportToBegin

	const orderNotReady = !shipmentData.order_ready_to_ship
	const timeForOrderToBeReady = calculateTimeForOrderToBeReady(shipmentData)
	const orderShouldBeReady = currentTime >= timeForOrderToBeReady

	if (transportHasntBegun && transportShouldBegin) {
		return true
	} else if (orderNotReady && orderShouldBeReady) {
		return true
	} else {
		return false
	}

}

function calculateTimeForOrderToBeReady(shipmentData) {
	const timeForTransportToBegin = calculateTimeForTransportToBegin(shipmentData)
	const timeForOrderToBeReady = timeForTransportToBegin - timeFromReadyToTransport(shipmentData)

	return timeForOrderToBeReady
}

function timeFromReadyToTransport(shipmentData) {
	switch (shipmentData.company) {
		case "Acme Corp":
			return 12 * 60 * 60 * 1000 // 12 hours in milliseconds
			break;
		case "Beta Industries":
			return 8 * 60 * 60 * 1000 // 8 hours in milliseconds
			break;
		case "Gamma Supplies":
			return 6 * 60 * 60 * 1000 // 6 hours in milliseconds
			break;
		default: 18 * 60 * 60 * 1000
			break;
	}
}

function calculateTimeForTransportToBegin(shipmentData) {
	const originalEtaTimestamp = new Date(shipmentData.original_eta).getTime()
	const estTravelTimeInMillisecs = shipmentData.estimated_travel_time_in_hours * 60 * 60 * 1000

	return originalEtaTimestamp - estTravelTimeInMillisecs
}