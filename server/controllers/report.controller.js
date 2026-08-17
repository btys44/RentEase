const prisma = require('../utils/prisma');
const { generateReportPdf } = require('../utils/reportPdf');

async function computeReportData(landlordId) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const properties = await prisma.property.findMany({
    where: { landlordId },
    include: { units: { include: { tenants: true } } },
  });

  const revenueByProperty = [];
  const outstanding = [];
  let totalUnits = 0;
  let occupiedUnits = 0;

  for (const property of properties) {
    let revenue = 0;
    for (const unit of property.units) {
      totalUnits += 1;
      if (unit.status === 'OCCUPIED') occupiedUnits += 1;

      const payments = await prisma.rentPayment.findMany({
        where: { unitId: unit.id, month, year },
      });
      const paidThisMonth = payments.reduce((sum, p) => sum + p.amount, 0);
      revenue += paidThisMonth;

      for (const tenant of unit.tenants) {
        const tenantPayment = payments.find((p) => p.tenantId === tenant.id);
        const paidAmount = tenantPayment ? tenantPayment.amount : 0;
        const due = unit.rentAmount - paidAmount;
        if (due > 0) {
          const tenantUser = await prisma.user.findUnique({ where: { id: tenant.userId } });
          outstanding.push({
            tenantName: tenantUser ? tenantUser.name : 'Unknown',
            unitNumber: unit.unitNumber,
            propertyName: property.name,
            amountDue: due,
          });
        }
      }
    }
    revenueByProperty.push({ propertyName: property.name, revenue });
  }

  const occupancy = {
    total: totalUnits,
    occupied: occupiedUnits,
    vacant: totalUnits - occupiedUnits,
    rate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
  };

  return { revenueByProperty, outstanding, occupancy, month, year };
}

exports.summary = async (req, res, next) => {
  try {
    if (req.user.role !== 'LANDLORD') return res.status(403).json({ message: 'Landlord access only.' });
    const data = await computeReportData(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.exportPdf = async (req, res, next) => {
  try {
    if (req.user.role !== 'LANDLORD') return res.status(403).json({ message: 'Landlord access only.' });
    const data = await computeReportData(req.user.id);
    const landlord = await prisma.user.findUnique({ where: { id: req.user.id } });
    const url = await generateReportPdf({ ...data, landlordName: landlord.name });
    res.json({ url });
  } catch (err) {
    next(err);
  }
};
