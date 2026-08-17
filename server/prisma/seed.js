const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data (order matters due to FKs)
  await prisma.notification.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.rentPayment.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // --- Users ---
  const landlord = await prisma.user.create({
    data: {
      name: 'James Mwangi',
      email: 'landlord@rentease.co.ke',
      phone: '+254712000001',
      password: passwordHash,
      role: 'LANDLORD',
    },
  });

  const caretaker = await prisma.user.create({
    data: {
      name: 'Peter Otieno',
      email: 'caretaker@rentease.co.ke',
      phone: '+254712000002',
      password: passwordHash,
      role: 'CARETAKER',
    },
  });

  const tenantUsers = await Promise.all(
    [
      { name: 'Grace Wanjiru', email: 'tenant1@rentease.co.ke', phone: '+254712000003' },
      { name: 'Samuel Kimani', email: 'tenant2@rentease.co.ke', phone: '+254712000004' },
      { name: 'Faith Achieng', email: 'tenant3@rentease.co.ke', phone: '+254712000005' },
      { name: 'Brian Kiptoo', email: 'tenant4@rentease.co.ke', phone: '+254712000006' },
    ].map((t) =>
      prisma.user.create({
        data: { ...t, password: passwordHash, role: 'TENANT' },
      })
    )
  );

  // --- Properties ---
  const propertyA = await prisma.property.create({
    data: {
      name: 'Greenview Apartments',
      location: 'Kikuyu, Kiambu County',
      landlordId: landlord.id,
      caretakerId: caretaker.id,
    },
  });

  const propertyB = await prisma.property.create({
    data: {
      name: 'Sunrise Court',
      location: 'Ruaka, Kiambu County',
      landlordId: landlord.id,
    },
  });

  // --- Units (3 per property = 6 total) ---
  const unitsA = await Promise.all([
    prisma.unit.create({ data: { unitNumber: 'A1', type: 'Bedsitter', rentAmount: 8000, propertyId: propertyA.id } }),
    prisma.unit.create({ data: { unitNumber: 'A2', type: '1 Bedroom', rentAmount: 12000, propertyId: propertyA.id } }),
    prisma.unit.create({ data: { unitNumber: 'A3', type: '2 Bedroom', rentAmount: 18000, propertyId: propertyA.id } }),
  ]);

  const unitsB = await Promise.all([
    prisma.unit.create({ data: { unitNumber: 'B1', type: 'Bedsitter', rentAmount: 9000, propertyId: propertyB.id } }),
    prisma.unit.create({ data: { unitNumber: 'B2', type: '1 Bedroom', rentAmount: 13000, propertyId: propertyB.id } }),
    prisma.unit.create({ data: { unitNumber: 'B3', type: '2 Bedroom', rentAmount: 20000, propertyId: propertyB.id } }),
  ]);

  // --- Tenants (4 of 6 units occupied) ---
  const now = new Date();
  const tenant1 = await prisma.tenant.create({
    data: {
      userId: tenantUsers[0].id,
      unitId: unitsA[0].id,
      moveInDate: new Date('2025-01-15'),
      depositPaid: 8000,
      leaseEndDate: new Date('2026-01-14'),
    },
  });
  await prisma.unit.update({ where: { id: unitsA[0].id }, data: { status: 'OCCUPIED' } });

  const tenant2 = await prisma.tenant.create({
    data: {
      userId: tenantUsers[1].id,
      unitId: unitsA[1].id,
      moveInDate: new Date('2025-03-01'),
      depositPaid: 12000,
      leaseEndDate: new Date('2026-02-28'),
    },
  });
  await prisma.unit.update({ where: { id: unitsA[1].id }, data: { status: 'OCCUPIED' } });

  const tenant3 = await prisma.tenant.create({
    data: {
      userId: tenantUsers[2].id,
      unitId: unitsB[0].id,
      moveInDate: new Date('2025-02-10'),
      depositPaid: 9000,
      leaseEndDate: new Date('2026-02-09'),
    },
  });
  await prisma.unit.update({ where: { id: unitsB[0].id }, data: { status: 'OCCUPIED' } });

  const tenant4 = await prisma.tenant.create({
    data: {
      userId: tenantUsers[3].id,
      unitId: unitsB[1].id,
      moveInDate: new Date('2025-05-01'),
      depositPaid: 13000,
      leaseEndDate: new Date('2026-04-30'),
    },
  });
  await prisma.unit.update({ where: { id: unitsB[1].id }, data: { status: 'OCCUPIED' } });

  // --- Sample payments ---
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await prisma.rentPayment.create({
    data: { tenantId: tenant1.id, unitId: unitsA[0].id, amount: 8000, mpesaRef: 'QK7X9Y2ABC', month, year, status: 'PAID' },
  });
  await prisma.rentPayment.create({
    data: { tenantId: tenant2.id, unitId: unitsA[1].id, amount: 6000, mpesaRef: 'QK7X9Y2DEF', month, year, status: 'PARTIAL' },
  });
  await prisma.rentPayment.create({
    data: { tenantId: tenant3.id, unitId: unitsB[0].id, amount: 9000, mpesaRef: 'QK7X9Y2GHI', month, year, status: 'PAID' },
  });
  // tenant4 has not paid this month — no payment record (status UNPAID by default in UI)

  // --- Sample maintenance requests ---
  await prisma.maintenanceRequest.create({
    data: {
      tenantId: tenant1.id,
      unitId: unitsA[0].id,
      description: 'Leaking kitchen tap needs replacement.',
      status: 'PENDING',
    },
  });
  await prisma.maintenanceRequest.create({
    data: {
      tenantId: tenant3.id,
      unitId: unitsB[0].id,
      description: 'Bedroom light switch not working.',
      status: 'IN_PROGRESS',
      caretakerId: caretaker.id,
    },
  });
  await prisma.maintenanceRequest.create({
    data: {
      tenantId: tenant2.id,
      unitId: unitsA[1].id,
      description: 'Broken window latch in living room.',
      status: 'RESOLVED',
      caretakerId: caretaker.id,
      resolvedAt: new Date(),
    },
  });

  console.log('Seed complete.');
  console.log('---');
  console.log('Demo login credentials (password for all: password123)');
  console.log('Landlord:  landlord@rentease.co.ke');
  console.log('Caretaker: caretaker@rentease.co.ke');
  console.log('Tenants:   tenant1@rentease.co.ke ... tenant4@rentease.co.ke');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
