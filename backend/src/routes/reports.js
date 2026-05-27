const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports/doctor-stats
// Highly inefficient nested loop aggregate reporting for admin/receptionists dashboard
// PERFORMANCE BUG: Performs multiple nested DB queries inside a loop for every doctor.
// Runs sequentially, blocking/scaling terrible with doctors count.
router.get('/doctor-stats', authenticate, async (req, res) => {
  try {
    const start = Date.now();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [doctors, appointmentGroups, queueGroups] = await Promise.all([
      prisma.doctor.findMany({ orderBy: { name: 'asc' } }),
      prisma.appointment.groupBy({
        by: ['doctorId', 'status'],
        _count: { _all: true },
      }),
      prisma.queueToken.groupBy({
        by: ['doctorId'],
        where: { createdAt: { gte: today } },
        _count: { _all: true },
      }),
    ]);

    const appointmentCounts = appointmentGroups.reduce((acc, group) => {
      if (!acc[group.doctorId]) {
        acc[group.doctorId] = { total: 0, completed: 0, cancelled: 0 };
      }
      acc[group.doctorId].total += group._count._all;
      if (group.status === 'COMPLETED') acc[group.doctorId].completed = group._count._all;
      if (group.status === 'CANCELLED') acc[group.doctorId].cancelled = group._count._all;
      return acc;
    }, {});

    const queueCounts = queueGroups.reduce((acc, group) => {
      acc[group.doctorId] = group._count._all;
      return acc;
    }, {});

    const reportData = doctors.map((doc) => {
      const counts = appointmentCounts[doc.id] || { total: 0, completed: 0, cancelled: 0 };
      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        department: doc.department,
        totalAppointments: counts.total,
        completedAppointments: counts.completed,
        cancelledAppointments: counts.cancelled,
        todayQueueSize: queueCounts[doc.id] || 0,
        revenue: counts.completed * doc.consultationFee,
      };
    });

    const durationMs = Date.now() - start;

    res.json({
      success: true,
      timeTakenMs: durationMs,
      data: reportData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

module.exports = router;
