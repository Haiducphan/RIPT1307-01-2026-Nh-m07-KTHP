const Device = require('../models/device.model');
const { DEVICE_STATUSES } = require('../models/device.model');
const { borrowRequests } = require('../models/mockData');

const ACTIVE_BORROW_STATUSES = ['approved', 'borrowed', 'overdue'];

function getBorrowedQuantity(deviceId) {
  const id = String(deviceId);
  return borrowRequests
    .filter(
      (request) =>
        String(request.deviceId) === id && ACTIVE_BORROW_STATUSES.includes(request.status)
    )
    .reduce((sum, request) => sum + Number(request.quantity || 0), 0);
}

function computeAvailableQuantity(device) {
  const borrowed = getBorrowedQuantity(device.id);
  return Math.max(0, Number(device.totalQuantity) - borrowed);
}

function formatDevice(device) {
  const plain = device.get ? device.get({ plain: true }) : device;
  return {
    id: String(plain.id),
    name: plain.name,
    category: plain.category,
    totalQuantity: plain.totalQuantity,
    availableQuantity: computeAvailableQuantity(plain),
    status: plain.status,
    description: plain.description || undefined,
    isDeleted: Boolean(plain.isDeleted)
  };
}

function buildListWhere(includeDeleted) {
  if (includeDeleted) {
    return {};
  }
  return { isDeleted: false };
}

async function listDevices({ includeDeleted = false } = {}) {
  const rows = await Device.findAll({
    where: buildListWhere(includeDeleted),
    order: [['name', 'ASC']]
  });
  return rows.map(formatDevice);
}

async function getDeviceById(id, { includeDeleted = false } = {}) {
  const where = { id: Number(id) };
  if (!includeDeleted) {
    where.isDeleted = false;
  }

  const device = await Device.findOne({ where });
  if (!device) {
    return null;
  }
  return formatDevice(device);
}

function validateDevicePayload(payload, { isUpdate = false } = {}) {
  const errors = [];

  if (!isUpdate || payload.name !== undefined) {
    if (!payload.name || !String(payload.name).trim()) {
      errors.push('name is required');
    }
  }

  if (!isUpdate || payload.category !== undefined) {
    if (payload.category !== undefined && payload.category !== null && !String(payload.category).trim()) {
      errors.push('category cannot be empty');
    }
  }

  if (payload.totalQuantity !== undefined) {
    const total = Number(payload.totalQuantity);
    if (!Number.isInteger(total) || total < 0) {
      errors.push('totalQuantity must be a non-negative integer');
    }
  } else if (!isUpdate) {
    errors.push('totalQuantity is required');
  }

  if (payload.status !== undefined && !DEVICE_STATUSES.includes(payload.status)) {
    errors.push(`status must be one of: ${DEVICE_STATUSES.join(', ')}`);
  }

  return errors;
}

async function createDevice(payload) {
  const errors = validateDevicePayload(payload);
  if (errors.length) {
    const error = new Error(errors.join('; '));
    error.status = 400;
    throw error;
  }

  const device = await Device.create({
    name: String(payload.name).trim(),
    category: String(payload.category || '').trim(),
    totalQuantity: Number(payload.totalQuantity),
    status: payload.status || 'available',
    description: payload.description?.trim() || null
  });

  return formatDevice(device);
}

async function updateDevice(id, payload) {
  const device = await Device.findOne({
    where: { id: Number(id), isDeleted: false }
  });

  if (!device) {
    return null;
  }

  const errors = validateDevicePayload(payload, { isUpdate: true });
  if (errors.length) {
    const error = new Error(errors.join('; '));
    error.status = 400;
    throw error;
  }

  if (payload.totalQuantity !== undefined) {
    const nextTotal = Number(payload.totalQuantity);
    const borrowed = getBorrowedQuantity(device.id);
    if (nextTotal < borrowed) {
      const error = new Error(
        `totalQuantity cannot be less than borrowed quantity (${borrowed})`
      );
      error.status = 400;
      throw error;
    }
  }

  const updates = {};
  if (payload.name !== undefined) updates.name = String(payload.name).trim();
  if (payload.category !== undefined) updates.category = String(payload.category).trim();
  if (payload.totalQuantity !== undefined) updates.totalQuantity = Number(payload.totalQuantity);
  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.description !== undefined) {
    updates.description = payload.description?.trim() || null;
  }

  await device.update(updates);
  return formatDevice(device);
}

async function softDeleteDevice(id) {
  const device = await Device.findOne({
    where: { id: Number(id), isDeleted: false }
  });

  if (!device) {
    return null;
  }

  const borrowed = getBorrowedQuantity(device.id);
  if (borrowed > 0) {
    const error = new Error('Cannot delete device with active borrow records');
    error.status = 400;
    throw error;
  }

  await device.update({
    isDeleted: true,
    status: 'unavailable'
  });

  return formatDevice(device);
}

module.exports = {
  listDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  softDeleteDevice,
  computeAvailableQuantity,
  getBorrowedQuantity,
  formatDevice
};
