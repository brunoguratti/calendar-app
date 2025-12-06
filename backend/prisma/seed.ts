import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'john@barber.com',
      password: hashedPassword,
      name: 'John Smith',
      businessName: "John's Barber Shop",
      slug: 'john-barber'
    }
  });

  console.log('✅ Created user:', user.email);

  // Create services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        userId: user.id,
        name: 'Haircut',
        durationMinutes: 30,
        price: 25.00,
        active: true
      }
    }),
    prisma.service.create({
      data: {
        userId: user.id,
        name: 'Haircut + Beard Trim',
        durationMinutes: 45,
        price: 35.00,
        active: true
      }
    }),
    prisma.service.create({
      data: {
        userId: user.id,
        name: 'Deluxe Package',
        durationMinutes: 60,
        price: 50.00,
        active: true
      }
    })
  ]);

  console.log('✅ Created', services.length, 'services');

  // Create availability (Monday to Friday, 9 AM to 6 PM)
  const availability = await Promise.all([
    // Monday
    prisma.availability.create({
      data: {
        userId: user.id,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '18:00',
        active: true
      }
    }),
    // Tuesday
    prisma.availability.create({
      data: {
        userId: user.id,
        dayOfWeek: 2,
        startTime: '09:00',
        endTime: '18:00',
        active: true
      }
    }),
    // Wednesday
    prisma.availability.create({
      data: {
        userId: user.id,
        dayOfWeek: 3,
        startTime: '09:00',
        endTime: '18:00',
        active: true
      }
    }),
    // Thursday
    prisma.availability.create({
      data: {
        userId: user.id,
        dayOfWeek: 4,
        startTime: '09:00',
        endTime: '18:00',
        active: true
      }
    }),
    // Friday
    prisma.availability.create({
      data: {
        userId: user.id,
        dayOfWeek: 5,
        startTime: '09:00',
        endTime: '18:00',
        active: true
      }
    }),
    // Saturday (shorter hours)
    prisma.availability.create({
      data: {
        userId: user.id,
        dayOfWeek: 6,
        startTime: '10:00',
        endTime: '16:00',
        active: true
      }
    })
  ]);

  console.log('✅ Created', availability.length, 'availability slots');

  // Create a sample appointment
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const appointment = await prisma.appointment.create({
    data: {
      userId: user.id,
      serviceId: services[0].id,
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      customerPhone: '555-0123',
      date: tomorrow,
      time: '10:00',
      status: 'pending'
    }
  });

  console.log('✅ Created sample appointment');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test credentials:');
  console.log('   Email: john@barber.com');
  console.log('   Password: password123');
  console.log('   Booking URL: /book/john-barber');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
