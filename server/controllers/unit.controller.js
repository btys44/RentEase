const prisma = require('../utils/prisma');

async function assertOwnsProperty(propertyId, landlordId) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw Object.assign(new Error('Property not found.'), { status: 404 });
  if (property.landlordId !== landlordId) {
    throw Object.assign(new Error('Not your property.'), { status: 403 });
  }
  return property;
}

exports.create = async (req, res, next) => {
  try {
    const { unitNumber, type, rentAmount, propertyId } = req.body;
    if (!unitNumber || !type || !rentAmount || !propertyId) {
      return res.status(400).json({ message: 'unitNumber, type, rentAmount and propertyId are required.' });
    }
    await assertOwnsProperty(Number(propertyId), req.user.id);

    const unit = await prisma.unit.create({
      data: {
        unitNumber,
        type,
        rentAmount: Number(rentAmount),
        propertyId: Number(propertyId),
      },
    });
    res.status(201).json(unit);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const unit = await prisma.unit.findUnique({ where: { id }, include: { property: true } });
    if (!unit) return res.status(404).json({ message: 'Unit not found.' });
    if (unit.property.landlordId !== req.user.id) {
      return res.status(403).json({ message: 'Not your unit.' });
    }

    const { unitNumber, type, rentAmount, status } = req.body;
    const updated = await prisma.unit.update({
      where: { id },
      data: {
        ...(unitNumber && { unitNumber }),
        ...(type && { type }),
        ...(rentAmount !== undefined && { rentAmount: Number(rentAmount) }),
        ...(status && { status }),
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
    const unit = await prisma.unit.findUnique({ where: { id }, include: { property: true } });
    if (!unit) return res.status(404).json({ message: 'Unit not found.' });
    if (unit.property.landlordId !== req.user.id) {
      return res.status(403).json({ message: 'Not your unit.' });
    }
    await prisma.unit.delete({ where: { id } });
    res.json({ message: 'Unit deleted.' });
  } catch (err) {
    next(err);
  }
};
