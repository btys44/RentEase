const prisma = require('../utils/prisma');

exports.list = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== req.user.id) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    const updated = await prisma.notification.update({ where: { id }, data: { read: true } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id, read: false }, data: { read: true } });
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};
