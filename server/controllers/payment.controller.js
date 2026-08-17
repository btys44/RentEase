const prisma = require('../utils/prisma');
const { generateReceipt } = require('../utils/receipt');
const { stkPush } = require('../utils/mpesa');
const { sendSMS } = require('../utils/sms');

// Landlord / Caretaker: record a rent payment, auto-generate PDF receipt
exports.create = async (req, res, next) => {
  try {
    const { tenantId, amount, mpesaRef, month, year, status } = req.body;
    if (!tenantId || !amount || !month || !year) {
      return res.status(400).json({ message: 'tenantId, amount, month and year are required.' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: Number(tenantId) },
      include: { user: true, unit: { include: { property: true } } },
    });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });

    if (req.user.role === 'LANDLORD' && tenant.unit.property.landlordId !== req.user.id) {
      return res.status(403).json({ message: 'Not your tenant.' });
    }
    if (req.user.role === 'CARETAKER' && tenant.unit.property.caretakerId !== req.user.id) {
      return res.status(403).json({ message: 'Not assigned to this property.' });
    }

    const paymentStatus = status || (Number(amount) >= tenant.unit.rentAmount ? 'PAID' : 'PARTIAL');

    const payment = await prisma.rentPayment.create({
      data: {
        tenantId: tenant.id,
        unitId: tenant.unitId,
        amount: Number(amount),
        mpesaRef: mpesaRef || null,
        month: Number(month),
        year: Number(year),
        status: paymentStatus,
      },
    });

    const landlord = await prisma.user.findUnique({ where: { id: tenant.unit.property.landlordId } });

    const receiptUrl = await generateReceipt({
      payment,
      tenant: tenant.user,
      unit: tenant.unit,
      property: tenant.unit.property,
      landlordName: landlord ? landlord.name : 'Landlord',
    });

    const updatedPayment = await prisma.rentPayment.update({
      where: { id: payment.id },
      data: { receiptUrl },
    });

    // Notify tenant (in-app + mock/real SMS)
    await prisma.notification.create({
      data: {
        userId: tenant.userId,
        message: `Payment of KES ${amount} recorded for ${tenant.unit.unitNumber} (${paymentStatus}). Receipt available in your dashboard.`,
      },
    });
    await sendSMS(
      tenant.user.phone,
      `RentEase: Payment of KES ${amount} received for unit ${tenant.unit.unitNumber}. Status: ${paymentStatus}.`
    );

    res.status(201).json(updatedPayment);
  } catch (err) {
    next(err);
  }
};

// Initiate STK push (mocked unless real Daraja credentials configured)
exports.initiateStkPush = async (req, res, next) => {
  try {
    const { tenantId, amount } = req.body;
    const tenant = await prisma.tenant.findUnique({
      where: { id: Number(tenantId) },
      include: { user: true, unit: true },
    });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });

    const result = await stkPush({
      phone: tenant.user.phone,
      amount,
      accountReference: tenant.unit.unitNumber,
      transactionDesc: 'Rent payment',
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// List payments, filterable by month, year, propertyId, status
exports.list = async (req, res, next) => {
  try {
    const { month, year, propertyId, status } = req.query;
    const where = {};

    if (req.user.role === 'LANDLORD') {
      where.tenant = { unit: { property: { landlordId: req.user.id } } };
    } else if (req.user.role === 'CARETAKER') {
      where.tenant = { unit: { property: { caretakerId: req.user.id } } };
    } else if (req.user.role === 'TENANT') {
      where.tenant = { userId: req.user.id };
    }

    if (month) where.month = Number(month);
    if (year) where.year = Number(year);
    if (status) where.status = status.toUpperCase();
    if (propertyId) {
      where.tenant = { ...where.tenant, unit: { property: { id: Number(propertyId) } } };
    }

    const payments = await prisma.rentPayment.findMany({
      where,
      include: {
        tenant: { include: { user: { select: { name: true, email: true } } } },
        unit: { include: { property: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

// Update payment status (Paid / Partial / Unpaid)
exports.updateStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!['PAID', 'PARTIAL', 'UNPAID'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const payment = await prisma.rentPayment.findUnique({
      where: { id },
      include: { tenant: { include: { unit: { include: { property: true } } } } },
    });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (req.user.role === 'LANDLORD' && payment.tenant.unit.property.landlordId !== req.user.id) {
      return res.status(403).json({ message: 'Not your payment record.' });
    }
    const updated = await prisma.rentPayment.update({ where: { id }, data: { status } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
