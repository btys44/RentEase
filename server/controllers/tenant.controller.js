const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

// Landlord: list all tenants across their properties
exports.list = async (req, res, next) => {
  try {
    let tenants;
    if (req.user.role === 'LANDLORD') {
      tenants = await prisma.tenant.findMany({
        where: { unit: { property: { landlordId: req.user.id } } },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          unit: { include: { property: true } },
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
    } else if (req.user.role === 'CARETAKER') {
      tenants = await prisma.tenant.findMany({
        where: { unit: { property: { caretakerId: req.user.id } } },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          unit: { include: { property: true } },
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
    } else {
      return res.status(403).json({ message: 'Not permitted.' });
    }
    res.json(tenants);
  } catch (err) {
    next(err);
  }
};

// Landlord: create a tenant. Either link an existing TENANT user account (userId)
// or create a new one inline (name/email/phone/password).
exports.create = async (req, res, next) => {
  try {
    const { userId, name, email, phone, password, unitId, moveInDate, depositPaid, leaseEndDate } = req.body;

    if (!unitId || !moveInDate || depositPaid === undefined) {
      return res.status(400).json({ message: 'unitId, moveInDate and depositPaid are required.' });
    }

    const unit = await prisma.unit.findUnique({ where: { id: Number(unitId) }, include: { property: true } });
    if (!unit) return res.status(404).json({ message: 'Unit not found.' });
    if (unit.property.landlordId !== req.user.id) {
      return res.status(403).json({ message: 'Not your unit.' });
    }
    if (userId) {
      const existingTenant = await prisma.tenant.findUnique({ where: { userId: Number(userId) } });
      if (existingTenant) {
        return res.status(409).json({ message: 'This tenant account is already assigned to a unit.' });
      }
    }

    let tenantUserId = userId ? Number(userId) : null;

    if (!tenantUserId) {
      if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: 'Provide either userId or name/email/phone/password to create a new tenant account.' });
      }
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ message: 'A user with this email already exists. Use "link existing account" instead.' });
      const hashed = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: { name, email, phone, password: hashed, role: 'TENANT' },
      });
      tenantUserId = newUser.id;
    }

    const tenant = await prisma.tenant.create({
      data: {
        userId: tenantUserId,
        unitId: Number(unitId),
        moveInDate: new Date(moveInDate),
        depositPaid: Number(depositPaid),
        leaseEndDate: leaseEndDate ? new Date(leaseEndDate) : null,
      },
      include: { user: true, unit: true },
    });

    await prisma.unit.update({ where: { id: Number(unitId) }, data: { status: 'OCCUPIED' } });

    res.status(201).json(tenant);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const tenant = await prisma.tenant.findUnique({ where: { id }, include: { unit: { include: { property: true } } } });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });
    if (tenant.unit.property.landlordId !== req.user.id) {
      return res.status(403).json({ message: 'Not your tenant.' });
    }

    const { unitId, moveInDate, depositPaid, leaseEndDate } = req.body;
    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        ...(unitId && { unitId: Number(unitId) }),
        ...(moveInDate && { moveInDate: new Date(moveInDate) }),
        ...(depositPaid !== undefined && { depositPaid: Number(depositPaid) }),
        ...(leaseEndDate !== undefined && { leaseEndDate: leaseEndDate ? new Date(leaseEndDate) : null }),
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const tenant = await prisma.tenant.findUnique({ where: { id }, include: { unit: { include: { property: true } } } });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });
    if (tenant.unit.property.landlordId !== req.user.id) {
      return res.status(403).json({ message: 'Not your tenant.' });
    }
    await prisma.tenant.delete({ where: { id } });
    await prisma.unit.update({ where: { id: tenant.unitId }, data: { status: 'VACANT' } });
    res.json({ message: 'Tenant removed.' });
  } catch (err) {
    next(err);
  }
};

// Tenant: get own profile / dashboard info
exports.myProfile = async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        unit: { include: { property: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!tenant) return res.status(404).json({ message: 'No tenant profile found for this account.' });
    res.json(tenant);
  } catch (err) {
    next(err);
  }
};