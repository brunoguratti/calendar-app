import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed with multi-professional system...');

  // Clear existing data (in correct order due to foreign keys)
  await prisma.appointment.deleteMany();
  await prisma.serviceRoom.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.service.deleteMany();
  await prisma.room.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create business owner/admin
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'admin@easyschedule.com',
      password: hashedPassword,
      name: 'Sarah Williams',
      businessName: 'Elite Salon & Spa',
      slug: 'elite-salon',
      autoApproveBookings: false,
      cancellationHours: 24,
      subscriptionStatus: 'active',
    },
  });

  console.log('✅ Created business owner:', user.email);

  // Create professionals
  const professionals = await Promise.all([
    prisma.professional.create({
      data: {
        userId: user.id,
        name: 'Emily Johnson',
        email: 'emily@elitesalon.com',
        phone: '555-0101',
        bio: 'Senior hairstylist with 10+ years of experience specializing in modern cuts and color.',
        specialties: 'Hair coloring, Highlights, Modern cuts',
        active: true,
      },
    }),
    prisma.professional.create({
      data: {
        userId: user.id,
        name: 'Michael Chen',
        email: 'michael@elitesalon.com',
        phone: '555-0102',
        bio: 'Expert barber and grooming specialist. Specializes in classic and modern mens cuts.',
        specialties: 'Mens cuts, Beard grooming, Hot towel shaves',
        active: true,
      },
    }),
    prisma.professional.create({
      data: {
        userId: user.id,
        name: 'Jessica Martinez',
        email: 'jessica@elitesalon.com',
        phone: '555-0103',
        bio: 'Licensed massage therapist and spa specialist with certification in Swedish and deep tissue.',
        specialties: 'Massage therapy, Spa treatments, Aromatherapy',
        active: true,
      },
    }),
  ]);

  console.log('✅ Created', professionals.length, 'professionals');

  // Create rooms
  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        userId: user.id,
        name: 'Styling Station 1',
        description: 'Modern styling station with premium equipment',
        capacity: 1,
        active: true,
      },
    }),
    prisma.room.create({
      data: {
        userId: user.id,
        name: 'Styling Station 2',
        description: 'Comfortable styling station near window',
        capacity: 1,
        active: true,
      },
    }),
    prisma.room.create({
      data: {
        userId: user.id,
        name: 'Barber Chair',
        description: 'Classic barber chair with all grooming tools',
        capacity: 1,
        active: true,
      },
    }),
    prisma.room.create({
      data: {
        userId: user.id,
        name: 'Massage Room',
        description: 'Quiet, relaxing room for massage and spa treatments',
        capacity: 1,
        active: true,
      },
    }),
  ]);

  console.log('✅ Created', rooms.length, 'rooms');

  // Create services for Emily (Hair Stylist)
  const emilyServices = await Promise.all([
    prisma.service.create({
      data: {
        professionalId: professionals[0].id,
        name: 'Haircut & Style',
        description: 'Professional haircut with styling',
        durationMinutes: 45,
        price: 65.0,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        professionalId: professionals[0].id,
        name: 'Color & Highlights',
        description: 'Full color or partial highlights',
        durationMinutes: 120,
        price: 150.0,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        professionalId: professionals[0].id,
        name: 'Blowout',
        description: 'Professional wash and blowout',
        durationMinutes: 30,
        price: 45.0,
        active: true,
      },
    }),
  ]);

  // Create services for Michael (Barber)
  const michaelServices = await Promise.all([
    prisma.service.create({
      data: {
        professionalId: professionals[1].id,
        name: 'Mens Haircut',
        description: 'Classic or modern mens haircut',
        durationMinutes: 30,
        price: 35.0,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        professionalId: professionals[1].id,
        name: 'Haircut & Beard Trim',
        description: 'Complete grooming service',
        durationMinutes: 45,
        price: 50.0,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        professionalId: professionals[1].id,
        name: 'Hot Towel Shave',
        description: 'Traditional hot towel straight razor shave',
        durationMinutes: 30,
        price: 40.0,
        active: true,
      },
    }),
  ]);

  // Create services for Jessica (Massage Therapist)
  const jessicaServices = await Promise.all([
    prisma.service.create({
      data: {
        professionalId: professionals[2].id,
        name: 'Swedish Massage',
        description: '60-minute relaxation massage',
        durationMinutes: 60,
        price: 90.0,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        professionalId: professionals[2].id,
        name: 'Deep Tissue Massage',
        description: '60-minute therapeutic massage',
        durationMinutes: 60,
        price: 105.0,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        professionalId: professionals[2].id,
        name: 'Aromatherapy Session',
        description: '90-minute massage with essential oils',
        durationMinutes: 90,
        price: 135.0,
        active: true,
      },
    }),
  ]);

  console.log('✅ Created', emilyServices.length + michaelServices.length + jessicaServices.length, 'services');

  // Assign services to rooms
  // Emily's services → Styling Stations
  await Promise.all([
    ...emilyServices.map((service) =>
      prisma.serviceRoom.create({
        data: {
          serviceId: service.id,
          roomId: rooms[0].id, // Styling Station 1
        },
      })
    ),
    ...emilyServices.map((service) =>
      prisma.serviceRoom.create({
        data: {
          serviceId: service.id,
          roomId: rooms[1].id, // Styling Station 2
        },
      })
    ),
  ]);

  // Michael's services → Barber Chair
  await Promise.all(
    michaelServices.map((service) =>
      prisma.serviceRoom.create({
        data: {
          serviceId: service.id,
          roomId: rooms[2].id, // Barber Chair
        },
      })
    )
  );

  // Jessica's services → Massage Room
  await Promise.all(
    jessicaServices.map((service) =>
      prisma.serviceRoom.create({
        data: {
          serviceId: service.id,
          roomId: rooms[3].id, // Massage Room
        },
      })
    )
  );

  console.log('✅ Assigned services to rooms');

  // Create availability schedules for professionals
  // Emily - Monday to Saturday
  const emilyAvailability = await Promise.all([
    ...Array.from({ length: 6 }, (_, i) =>
      prisma.availability.create({
        data: {
          professionalId: professionals[0].id,
          dayOfWeek: i + 1, // Monday (1) to Saturday (6)
          startTime: i === 5 ? '10:00' : '09:00', // Saturday starts at 10
          endTime: i === 5 ? '16:00' : '18:00', // Saturday ends at 4
          active: true,
        },
      })
    ),
  ]);

  // Michael - Tuesday to Saturday
  const michaelAvailability = await Promise.all([
    ...Array.from({ length: 5 }, (_, i) =>
      prisma.availability.create({
        data: {
          professionalId: professionals[1].id,
          dayOfWeek: i + 2, // Tuesday (2) to Saturday (6)
          startTime: i === 4 ? '10:00' : '09:00', // Saturday starts at 10
          endTime: i === 4 ? '17:00' : '19:00', // Saturday ends at 5
          active: true,
        },
      })
    ),
  ]);

  // Jessica - Monday, Wednesday, Friday, Saturday
  const jessicaAvailability = await Promise.all([
    prisma.availability.create({
      data: {
        professionalId: professionals[2].id,
        dayOfWeek: 1, // Monday
        startTime: '10:00',
        endTime: '18:00',
        active: true,
      },
    }),
    prisma.availability.create({
      data: {
        professionalId: professionals[2].id,
        dayOfWeek: 3, // Wednesday
        startTime: '10:00',
        endTime: '18:00',
        active: true,
      },
    }),
    prisma.availability.create({
      data: {
        professionalId: professionals[2].id,
        dayOfWeek: 5, // Friday
        startTime: '10:00',
        endTime: '18:00',
        active: true,
      },
    }),
    prisma.availability.create({
      data: {
        professionalId: professionals[2].id,
        dayOfWeek: 6, // Saturday
        startTime: '09:00',
        endTime: '15:00',
        active: true,
      },
    }),
  ]);

  console.log('✅ Created availability schedules');

  // Create sample appointments
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const appointments = await Promise.all([
    // Emily's appointment
    prisma.appointment.create({
      data: {
        professionalId: professionals[0].id,
        serviceId: emilyServices[0].id,
        roomId: rooms[0].id,
        customerName: 'Amanda Peterson',
        customerEmail: 'amanda@example.com',
        customerPhone: '555-1001',
        date: tomorrow,
        time: '10:00',
        status: 'pending',
        paymentStatus: 'unpaid',
      },
    }),
    // Michael's appointment
    prisma.appointment.create({
      data: {
        professionalId: professionals[1].id,
        serviceId: michaelServices[1].id,
        roomId: rooms[2].id,
        customerName: 'David Thompson',
        customerEmail: 'david@example.com',
        customerPhone: '555-1002',
        date: tomorrow,
        time: '14:30',
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentAmount: 50.0,
      },
    }),
    // Jessica's appointment
    prisma.appointment.create({
      data: {
        professionalId: professionals[2].id,
        serviceId: jessicaServices[0].id,
        roomId: rooms[3].id,
        customerName: 'Rachel Green',
        customerEmail: 'rachel@example.com',
        customerPhone: '555-1003',
        date: dayAfterTomorrow,
        time: '11:00',
        status: 'pending',
        paymentStatus: 'unpaid',
      },
    }),
  ]);

  console.log('✅ Created', appointments.length, 'sample appointments');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('   👤 Admin Email: admin@easyschedule.com');
  console.log('   🔑 Password: password123');
  console.log('   🔗 Booking URL: /book/elite-salon');
  console.log('\n👥 Professionals:');
  console.log('   1️⃣  Emily Johnson - Hair Stylist (3 services)');
  console.log('   2️⃣  Michael Chen - Barber (3 services)');
  console.log('   3️⃣  Jessica Martinez - Massage Therapist (3 services)');
  console.log('\n🏠 Rooms:');
  console.log('   • Styling Station 1 & 2 (for Emily)');
  console.log('   • Barber Chair (for Michael)');
  console.log('   • Massage Room (for Jessica)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
