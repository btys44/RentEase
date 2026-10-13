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
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};