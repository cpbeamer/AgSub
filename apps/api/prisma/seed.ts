import { PrismaClient, UserRole, ApplicationStatus, PaymentStatus, ComplianceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.complianceLog.deleteMany();
  await prisma.programEnrollment.deleteMany();
  await prisma.application.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.program.deleteMany();
  await prisma.farm.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create organizations
  const farmOrg = await prisma.organization.create({
    data: {
      name: 'Johnson Family Farm',
      type: 'FARM',
      address: '1234 Rural Route, Springfield, IL 62701',
      phone: '(555) 123-4567',
    },
  });

  const consultantOrg = await prisma.organization.create({
    data: {
      name: 'AgConsult Partners',
      type: 'CONSULTANT',
      address: '500 Main St, Chicago, IL 60601',
      phone: '(555) 987-6543',
    },
  });

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const farmer = await prisma.user.create({
    data: {
      email: 'farmer@example.com',
      password: hashedPassword,
      name: 'John Johnson',
      role: UserRole.FARMER,
      orgId: farmOrg.id,
    },
  });

  const consultant = await prisma.user.create({
    data: {
      email: 'consultant@example.com',
      password: hashedPassword,
      name: 'Sarah Smith',
      role: UserRole.CONSULTANT,
      orgId: consultantOrg.id,
    },
  });

  const auditor = await prisma.user.create({
    data: {
      email: 'auditor@example.com',
      password: hashedPassword,
      name: 'Mike Miller',
      role: UserRole.AUDITOR,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });

  // Create farm
  const farm = await prisma.farm.create({
    data: {
      name: 'Johnson North Field',
      ownerId: farmer.id,
      orgId: farmOrg.id,
      acres: 400,
      location: {
        type: 'Polygon',
        coordinates: [[
          [-89.6501, 39.7817],
          [-89.6401, 39.7817],
          [-89.6401, 39.7717],
          [-89.6501, 39.7717],
          [-89.6501, 39.7817],
        ]],
      },
      address: '1234 Rural Route, Springfield, IL 62701',
      crops: ['corn', 'soybeans', 'wheat'],
      livestock: ['cattle', 'hogs'],
      practices: ['conservation tillage', 'cover crops', 'nutrient management'],
    },
  });

  // Create programs
  const eqip = await prisma.program.create({
    data: {
      programId: 'EQIP-2025',
      name: 'Environmental Quality Incentives Program',
      description: 'Financial and technical assistance for agricultural producers to address natural resource concerns',
      eligibilityRules: {
        minAcres: 50,
        maxAcres: 1000,
        requiredCrops: ['corn', 'soybeans'],
        requiredPractices: ['conservation tillage'],
        otherRequirements: ['Active farming operation', 'Conservation plan required'],
      },
      paymentRates: {
        perAcre: 50,
        basePay: 1000,
        practices: {
          'cover crops': 45,
          'conservation tillage': 35,
          'nutrient management': 25,
        },
        maxPayment: 50000,
      },
      formsRequired: ['CCC-1200', 'NRCS-CPA-1202'],
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      budget: 1000000,
      isActive: true,
    },
  });

  const csp = await prisma.program.create({
    data: {
      programId: 'CSP-2025',
      name: 'Conservation Stewardship Program',
      description: 'Helps agricultural producers maintain and improve their existing conservation systems',
      eligibilityRules: {
        minAcres: 100,
        requiredPractices: ['cover crops', 'conservation tillage'],
        otherRequirements: ['Existing conservation activity'],
      },
      paymentRates: {
        perAcre: 35,
        basePay: 2000,
        practices: {
          'advanced nutrient management': 40,
          'precision agriculture': 30,
        },
        maxPayment: 40000,
      },
      formsRequired: ['CCC-1200', 'NRCS-CPA-1239'],
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      budget: 800000,
      isActive: true,
    },
  });

  const crp = await prisma.program.create({
    data: {
      programId: 'CRP-2025',
      name: 'Conservation Reserve Program',
      description: 'Land conservation program for environmentally sensitive agricultural land',
      eligibilityRules: {
        minAcres: 10,
        maxAcres: 500,
        otherRequirements: ['Highly erodible land', 'Wetlands', 'Buffer strips'],
      },
      paymentRates: {
        perAcre: 85,
        basePay: 0,
        maxPayment: 50000,
      },
      formsRequired: ['CCC-1200', 'FSA-848'],
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-12-31'),
      budget: 500000,
      isActive: true,
    },
  });

  // Create notice
  await prisma.notice.create({
    data: {
      programId: eqip.id,
      title: 'EQIP 2025 Program Announcement',
      content: 'The USDA Natural Resources Conservation Service announces the opening of the Environmental Quality Incentives Program for 2025...',
      publishDate: new Date('2024-12-15'),
      parsedData: {
        programId: 'EQIP-2025',
        name: 'Environmental Quality Incentives Program',
        applicationDeadline: '2025-03-15',
      },
    },
  });

  // Create applications
  const application1 = await prisma.application.create({
    data: {
      farmId: farm.id,
      programId: eqip.id,
      status: ApplicationStatus.SUBMITTED,
      formData: {
        farmName: farm.name,
        acres: farm.acres,
        crops: farm.crops,
        practices: farm.practices,
      },
      submittedAt: new Date('2025-01-10'),
    },
  });

  const application2 = await prisma.application.create({
    data: {
      farmId: farm.id,
      programId: csp.id,
      status: ApplicationStatus.APPROVED,
      formData: {
        farmName: farm.name,
        acres: farm.acres,
        crops: farm.crops,
        practices: farm.practices,
      },
      submittedAt: new Date('2024-12-20'),
      reviewedAt: new Date('2025-01-05'),
      reviewNotes: 'Application approved. All requirements met.',
    },
  });

  // Create program enrollment
  await prisma.programEnrollment.create({
    data: {
      farmId: farm.id,
      programId: csp.id,
      enrollmentDate: new Date('2025-01-05'),
      expiryDate: new Date('2025-12-31'),
      isActive: true,
      contractNumber: 'CSP-IL-2025-001',
    },
  });

  // Create compliance logs
  await prisma.complianceLog.create({
    data: {
      farmId: farm.id,
      practice: 'Cover Crop Planting',
      date: new Date('2025-01-14'),
      description: 'Planted winter rye cover crop on 50 acres',
      acreageReported: 50,
      acreageActual: 45,
      status: ComplianceStatus.VARIANCE_DETECTED,
      variance: -10,
      satelliteData: {
        imageUrl: 'https://satellite.example.com/image1.jpg',
        captureDate: '2025-01-13',
        confidence: 0.87,
      },
    },
  });

  await prisma.complianceLog.create({
    data: {
      farmId: farm.id,
      practice: 'Conservation Tillage',
      date: new Date('2025-01-10'),
      description: 'Implemented no-till practices on corn fields',
      acreageReported: 200,
      acreageActual: 200,
      status: ComplianceStatus.COMPLIANT,
      variance: 0,
    },
  });

  // Create payments
  await prisma.payment.create({
    data: {
      farmId: farm.id,
      programId: csp.id,
      amount: 2500,
      status: PaymentStatus.COMPLETED,
      dueDate: new Date('2025-01-15'),
      processedDate: new Date('2025-01-10'),
      transactionId: 'TXN-2025-001',
      paymentMethod: 'ACH',
      notes: 'Q4 2024 CSP payment',
    },
  });

  await prisma.payment.create({
    data: {
      farmId: farm.id,
      programId: eqip.id,
      amount: 5000,
      status: PaymentStatus.SCHEDULED,
      dueDate: new Date('2025-03-15'),
      notes: 'Initial EQIP payment pending approval',
    },
  });

  await prisma.payment.create({
    data: {
      farmId: farm.id,
      programId: csp.id,
      amount: 7500,
      status: PaymentStatus.PENDING,
      dueDate: new Date('2025-04-15'),
      notes: 'Q1 2025 CSP payment',
    },
  });

  // Create audit logs
  await prisma.auditLog.create({
    data: {
      userId: farmer.id,
      entityType: 'application',
      entityId: application1.id,
      action: 'submit',
      newData: { status: 'SUBMITTED' },
      metadata: { programName: 'EQIP 2025' },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: consultant.id,
      entityType: 'application',
      entityId: application2.id,
      action: 'approve',
      oldData: { status: 'SUBMITTED' },
      newData: { status: 'APPROVED' },
      metadata: { programName: 'CSP 2025' },
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📧 Test accounts:');
  console.log('  Farmer: farmer@example.com / password123');
  console.log('  Consultant: consultant@example.com / password123');
  console.log('  Auditor: auditor@example.com / password123');
  console.log('  Admin: admin@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });