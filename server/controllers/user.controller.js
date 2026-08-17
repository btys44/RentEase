const prisma = require('../utils/prisma');

// List users by role (used to populate "assign caretaker" / "link tenant account" dropdowns)
exports.listByRole = async (req, res, next) => {
  try {
    const { role } = req.query;
    const where = role ? { role: role.toUpperCase() } : {};
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, phone: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};
