const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding HAQMS demo data...');

  await prisma.queueToken.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 10);

  const [admin, receptionist, doctorUser, secondDoctorUser] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@haqms.com',
        password,
        name: 'System Administrator',
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        email: 'reception1@haqms.com',
        password,
        name: 'Reception Desk One',
        role: 'RECEPTIONIST',
      },
    }),
    prisma.user.create({
      data: {
        email: 'doctor1@haqms.com',
        password,
        name: 'Dr. Gregory House',
        role: 'DOCTOR',
      },
    }),
    prisma.user.create({
      data: {
        email: 'doctor2@haqms.com',
        password,
        name: 'Dr. Meredith Grey',
        role: 'DOCTOR',
      },
    }),
  ]);

  const [house, grey, strange] = await Promise.all([
    prisma.doctor.create({
      data: {
        name: 'Dr. Gregory House',
        specialization: 'Diagnostics',
        department: 'Internal Medicine',
        availableFrom: '09:00',
        availableTo: '17:00',
        consultationFee: 250,
        experience: 18,
        userId: doctorUser.id,
      },
    }),
    prisma.doctor.create({
      data: {
        name: 'Dr. Meredith Grey',
        specialization: 'General Surgery',
        department: 'Surgery',
        availableFrom: '08:00',
        availableTo: '16:00',
        consultationFee: 200,
        experience: 14,
        userId: secondDoctorUser.id,
      },
    }),
    prisma.doctor.create({
      data: {
        name: 'Dr. Stephen Strange',
        specialization: 'Neurosurgery',
        department: 'Surgery',
        availableFrom: '10:00',
        availableTo: '18:00',
        consultationFee: 300,
        experience: 12,
      },
    }),
  ]);

  const [clark, bruce, diana, barry, natasha] = await Promise.all([
    prisma.patient.create({
      data: {
        name: 'Clark Kent',
        email: 'clark.kent@example.com',
        phoneNumber: '555-0101',
        age: 34,
        gender: 'Male',
        medicalHistory: null,
      },
    }),
    prisma.patient.create({
      data: {
        name: 'Bruce Wayne',
        email: 'bruce.wayne@example.com',
        phoneNumber: '555-0102',
        age: 38,
        gender: 'Male',
        medicalHistory: null,
      },
    }),
    prisma.patient.create({
      data: {
        name: 'Diana Prince',
        email: 'diana.prince@example.com',
        phoneNumber: '555-0103',
        age: 32,
        gender: 'Female',
        medicalHistory: 'Mild iron deficiency. No known drug allergies.',
      },
    }),
    prisma.patient.create({
      data: {
        name: 'Barry Allen',
        email: 'barry.allen@example.com',
        phoneNumber: '555-0104',
        age: 29,
        gender: 'Male',
        medicalHistory: 'Elevated resting heart rate; prior sports injury follow-up.',
      },
    }),
    prisma.patient.create({
      data: {
        name: 'Natasha Romanoff',
        email: 'natasha.romanoff@example.com',
        phoneNumber: '555-0105',
        age: 35,
        gender: 'Female',
        medicalHistory: 'Past shoulder trauma. Requires periodic mobility assessment.',
      },
    }),
  ]);

  const now = new Date();
  const slot = (hour, minute = 0) => {
    const date = new Date(now);
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  const [appointmentOne, appointmentTwo, appointmentThree, appointmentFour] = await Promise.all([
    prisma.appointment.create({
      data: {
        patientId: clark.id,
        doctorId: house.id,
        appointmentDate: slot(10, 0),
        reason: 'Unexplained fatigue and dizziness',
        status: 'PENDING',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: bruce.id,
        doctorId: house.id,
        appointmentDate: slot(11, 0),
        reason: 'Follow-up consultation',
        status: 'PENDING',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: diana.id,
        doctorId: grey.id,
        appointmentDate: slot(12, 30),
        reason: 'Surgery review',
        status: 'COMPLETED',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: barry.id,
        doctorId: strange.id,
        appointmentDate: slot(14, 0),
        reason: 'Neurology consultation',
        status: 'CANCELLED',
      },
    }),
  ]);

  await Promise.all([
    prisma.queueToken.create({
      data: {
        tokenNumber: 1,
        patientId: clark.id,
        doctorId: house.id,
        appointmentId: appointmentOne.id,
        status: 'CALLING',
      },
    }),
    prisma.queueToken.create({
      data: {
        tokenNumber: 2,
        patientId: bruce.id,
        doctorId: house.id,
        appointmentId: appointmentTwo.id,
        status: 'WAITING',
      },
    }),
    prisma.queueToken.create({
      data: {
        tokenNumber: 1,
        patientId: natasha.id,
        doctorId: grey.id,
        status: 'WAITING',
      },
    }),
  ]);

  console.log('Seed complete.');
  console.log(`Created users: ${admin.email}, ${receptionist.email}, ${doctorUser.email}`);
  console.log(`Created appointments: ${appointmentOne.id}, ${appointmentTwo.id}, ${appointmentThree.id}, ${appointmentFour.id}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
