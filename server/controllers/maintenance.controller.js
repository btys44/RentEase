const prisma = require('../utils/prisma');

// Tenant: submit a maintenance request (with optional photo upload)
exports.create = async (req, res, next) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ message: 'Description is required.' });

    const tenant = await prisma.tenant.findUnique({ where: { userId: req.user.id } });
    if (!tenant) return res.status(404).json({ message: 'No tenant profile found for this account.' });

    const photoUrl = req.file ? `/uploads/photos/${req.file.filename}` : null;

    const request = await prisma.maintenanceRequest.create({
      data: {
        tenantId: tenant.id,
        unitId: tenant.unitId,
        description,
        photoUrl,
      },
    });
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
};

// List requests: landlord sees all across own properties, caretaker sees assigned properties, tenant sees own
exports.list = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status.toUpperCase().replace('-', '_');

    if (req.user.role === 'LANDLORD') {
      where.unit = { property: { landlordId: req.user.id } };
    } else if (req.user.role === 'CARETAKER') {
      where.unit = { property: { caretakerId: req.user.id } };
    } else if (req.user.role === 'TENANT') {
      const tenant = await prisma.tenant.findUnique({ where: { userId: req.user.id } });
      if (!tenant) return res.json([]);
      where.tenantId = tenant.id;
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        tenant: { include: { user: { select: { name: true, phone: true } } } },
        unit: { include: { property: true } },
        caretaker: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

// Landlord: assign a caretaker to a request
exports.assign = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { caretakerId } = req.body;
    const request = await prisma.maintenanceRequest.findUnique({ where: { id }, include: { unit: { include: { property: true } } } });
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (req.user.role === 'LANDLORD' && request.unit.property.landlordId !== req.user.id) {
      return res.status(403).json({ message: 'Not your property.' });
    }
    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: { caretakerId: Number(caretakerId), status: 'IN_PROGRESS' },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// Landlord/Caretaker: update status
exports.updateStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!['PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const request = await prisma.maintenanceRequest.findUnique({ where: { id }, include: { unit: { include: { property: true } } } });
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    if (req.user.role === 'LANDLORD' && request.unit.property.landlordId !== req.user.id) {
      return res.status(403).json({ message: 'Not your property.' });
    }
    if (req.user.role === 'CARETAKER' && request.unit.property.caretakerId !== req.user.id) {
      return res.status(403).json({ message: 'Not assigned to this property.' });
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: { status, resolvedAt: status === 'RESOLVED' ? new Date() : null },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
