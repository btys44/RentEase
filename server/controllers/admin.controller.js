const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

exports.overview = async (req, res, next) => {
  try {
    const [totalLandlords, totalTenants, totalCaretakers, totalProperties, totalUnits, totalPayments] = await Promise.all([
      prisma.user.count({ where: { role: 'LANDLORD' } }),
      prisma.user.count({ where: { role: 'TENANT' } }),
      prisma.user.count({ where: { role: 'CARETAKER' } }),
      prisma.property.count(),
      prisma.unit.count(),
      prisma.rentPayment.count(),
    ]);

    res.json({ totalLandlords, totalTenants, totalCaretakers, totalProperties, totalUnits, totalPayments });
  } catch (err) {
    next(err);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.setActive = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be true or false.' });
    }
    if (id === req.user.id) {
      return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ message: 'User not found.' });

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ message: 'User not found.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id }, data: { password: hashed } });

    res.json({ message: `Password reset for ${target.name}.` });
  } catch (err) {
    next(err);
  }
};

exports.listProperties = async (req, res, next) => {
  try {
    const properties = await prisma.property.findMany({
      include: {
        landlord: { select: { id: true, name: true, email: true } },
        caretaker: { select: { id: true, name: true, email: true } },
        units: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(properties);
  } catch (err) {
    next(err);
  }
};