const prisma = require('../utils/prisma');

// Landlord: list own properties (with units + occupancy info)
exports.list = async (req, res, next) => {
  try {
    const where = req.user.role === 'LANDLORD' ? { landlordId: req.user.id } : {};
    const properties = await prisma.property.findMany({
      where,
      include: {
        caretaker: { select: { id: true, name: true, email: true } },
        units: {
          include: {
            tenants: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                payments: { orderBy: { createdAt: 'desc' }, take: 1 },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(properties);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: Number(req.params.id) },
      include: { units: true, caretaker: true },
    });
    if (!property) return res.status(404).json({ message: 'Property not found.' });
    if (req.user.role === 'LANDLORD' && property.landlordId !== req.user.id) {
      return res.status(403).json({ message: 'Not your property.' });
    }
    res.json(property);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, location, caretakerId } = req.body;
    if (!name || !location) {
      return res.status(400).json({ message: 'Property name and location are required.' });
    }
    const property = await prisma.property.create({
      data: {
        name,
        location,
        landlordId: req.user.id,
        caretakerId: caretakerId ? Number(caretakerId) : null,
      },
    });
    res.status(201).json(property);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Property not found.' });
    if (existing.landlordId !== req.user.id) {
      return res.status(403).json({ message: 'Not your property.' });
    }
    const { name, location, caretakerId } = req.body;
    const property = await prisma.property.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(caretakerId !== undefined && { caretakerId: caretakerId ? Number(caretakerId) : null }),
      },
    });
    res.json(property);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Property not found.' });
    if (existing.landlordId !== req.user.id) {
      return res.status(403).json({ message: 'Not your property.' });
    }
    await prisma.property.delete({ where: { id } });
    res.json({ message: 'Property deleted.' });
  } catch (err) {
    next(err);
  }
};
