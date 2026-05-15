const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Visitor = require('../models/Visitor');
const Pass = require('../models/Pass');
const CheckLog = require('../models/CheckLog');
const Appointment = require('../models/Appointment');

const { v4: uuidv4 } = require('uuid');

const connectDB = require('../config/db');

async function seed() {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Visitor.deleteMany({}),
    Pass.deleteMany({}),
    CheckLog.deleteMany({}),
    Appointment.deleteMany({}),
  ]);
  console.log('✅ Cleared existing data');

  // ── Users ────────────────────────────────────────────────
  const users = await User.create([
    { name: 'Alex Davis', email: 'admin@visipass.com', password: 'password123', role: 'admin', department: 'Administration', phone: '+1-555-0001' },
    { name: 'Sam Porter', email: 'security@visipass.com', password: 'password123', role: 'security', department: 'Security', phone: '+1-555-0002' },
    { name: 'Emma Walsh', email: 'emma@visipass.com', password: 'password123', role: 'host', department: 'Engineering', phone: '+1-555-0003' },
    { name: 'Robert Kim', email: 'robert@visipass.com', password: 'password123', role: 'host', department: 'Finance', phone: '+1-555-0004' },
    { name: 'Anna Lee', email: 'anna@visipass.com', password: 'password123', role: 'host', department: 'HR', phone: '+1-555-0005' },
    { name: 'Mike Torres', email: 'mike@visipass.com', password: 'password123', role: 'host', department: 'Engineering', phone: '+1-555-0006' },
  ]);
  console.log(`✅ Created ${users.length} users`);

  const [admin, security, emma, robert, anna, mike] = users;

  // ── Visitors ─────────────────────────────────────────────
  const today = new Date();
  const visitors = await Visitor.create([
    { firstName: 'Sarah', lastName: 'Connor', email: 'sarah.c@skynet.com', phone: '+1-555-1001', company: 'Skynet Inc', idType: 'passport', idNumber: 'P123456', host: emma._id, department: 'Engineering', purpose: 'meeting', visitDate: today, status: 'checked_out', registeredBy: security._id },
    { firstName: 'John', lastName: 'Smith', email: 'john.s@global.com', phone: '+1-555-1002', company: 'Global Corp', idType: 'national_id', idNumber: 'N789012', host: anna._id, department: 'HR', purpose: 'interview', visitDate: today, status: 'checked_in', registeredBy: security._id },
    { firstName: 'Maria', lastName: 'Garcia', email: 'maria.g@techp.com', phone: '+1-555-1003', company: 'Tech Partners', idType: 'driver_license', idNumber: 'D345678', host: robert._id, department: 'Finance', purpose: 'meeting', visitDate: today, status: 'checked_in', registeredBy: security._id },
    { firstName: 'David', lastName: 'Lee', email: 'david.l@free.com', phone: '+1-555-1004', company: 'Freelance', idType: 'national_id', idNumber: 'N901234', host: mike._id, department: 'Engineering', purpose: 'delivery', visitDate: today, status: 'checked_out', registeredBy: security._id },
    { firstName: 'Priya', lastName: 'Patel', email: 'priya.p@consult.com', phone: '+1-555-1005', company: 'Consulting LLC', idType: 'passport', idNumber: 'P567890', host: anna._id, department: 'HR', purpose: 'meeting', visitDate: today, status: 'pending', registeredBy: emma._id },
    { firstName: 'Tom', lastName: 'Wilson', email: 'tom.w@startupx.com', phone: '+1-555-1006', company: 'StartupX', idType: 'national_id', idNumber: 'N123789', host: admin._id, department: 'Administration', purpose: 'meeting', visitDate: today, status: 'pending', registeredBy: emma._id, isVIP: true },
    { firstName: 'Jane', lastName: 'Doe', email: 'jane.d@acme.com', phone: '+1-555-1007', company: 'Acme Ltd', idType: 'driver_license', idNumber: 'D456123', host: emma._id, department: 'Engineering', purpose: 'meeting', visitDate: today, status: 'checked_in', registeredBy: security._id, approvedBy: admin._id, approvedAt: new Date() },
  ]);
  console.log(`✅ Created ${visitors.length} visitors`);

  // ── Passes ───────────────────────────────────────────────
  const now = new Date();
  const tonight = new Date(now); tonight.setHours(18, 0, 0, 0);
  const morning = new Date(now); morning.setHours(8, 0, 0, 0);

  const passesData = [
    { visitor: visitors[0]._id, issuedBy: security._id, validFrom: morning, validUntil: tonight, status: 'used', passId: 'VIS-2026-0841', badgeType: 'standard', qrToken: 'qr-token-001', qrCode: '' },
    { visitor: visitors[1]._id, issuedBy: security._id, validFrom: morning, validUntil: tonight, status: 'active', passId: 'VIS-2026-0842', badgeType: 'standard', qrToken: 'qr-token-002', qrCode: '' },
    { visitor: visitors[2]._id, issuedBy: security._id, validFrom: morning, validUntil: tonight, status: 'active', passId: 'VIS-2026-0843', badgeType: 'contractor', qrToken: 'qr-token-003', qrCode: '' },
    { visitor: visitors[3]._id, issuedBy: security._id, validFrom: morning, validUntil: tonight, status: 'used', passId: 'VIS-2026-0844', badgeType: 'delivery', qrToken: 'qr-token-004', qrCode: '' },
    { visitor: visitors[6]._id, issuedBy: security._id, validFrom: morning, validUntil: tonight, status: 'active', passId: 'VIS-2026-0847', badgeType: 'vip', qrToken: 'qr-token-007', qrCode: '' },
  ];

  const passes = await Pass.create(passesData);
  console.log(`✅ Created ${passes.length} passes`);

  // ── Check Logs ───────────────────────────────────────────
  await CheckLog.create([
    { visitor: visitors[0]._id, pass: passes[0]._id, type: 'check_in', processedBy: security._id, timestamp: new Date(now.getTime() - 3*60*60*1000), gate: 'Main Entrance' },
    { visitor: visitors[0]._id, pass: passes[0]._id, type: 'check_out', processedBy: security._id, timestamp: new Date(now.getTime() - 1*60*60*1000), gate: 'Main Entrance' },
    { visitor: visitors[1]._id, pass: passes[1]._id, type: 'check_in', processedBy: security._id, timestamp: new Date(now.getTime() - 2*60*60*1000), gate: 'Main Entrance' },
    { visitor: visitors[2]._id, pass: passes[2]._id, type: 'check_in', processedBy: security._id, timestamp: new Date(now.getTime() - 90*60*1000), gate: 'Side Entrance' },
    { visitor: visitors[3]._id, pass: passes[3]._id, type: 'check_in', processedBy: security._id, timestamp: new Date(now.getTime() - 4*60*60*1000), gate: 'Delivery Bay' },
    { visitor: visitors[3]._id, pass: passes[3]._id, type: 'check_out', processedBy: security._id, timestamp: new Date(now.getTime() - 3.5*60*60*1000), gate: 'Delivery Bay' },
    { visitor: visitors[6]._id, pass: passes[4]._id, type: 'check_in', processedBy: security._id, timestamp: new Date(now.getTime() - 30*60*1000), gate: 'Main Entrance' },
  ]);
  console.log('✅ Created check logs');

  // ── Appointments ─────────────────────────────────────────
  const apptTime1 = new Date(now); apptTime1.setHours(14, 0, 0, 0);
  const apptTime2 = new Date(now); apptTime2.setHours(15, 30, 0, 0);
  const apptTime3 = new Date(now); apptTime3.setHours(16, 0, 0, 0);

  await Appointment.create([
    { visitor: visitors[5]._id, host: admin._id, scheduledAt: apptTime1, meetingRoom: 'Board Room', purpose: 'Startup pitch presentation', status: 'confirmed', createdBy: admin._id, preRegistrationToken: uuidv4() },
    { visitor: visitors[4]._id, host: anna._id, scheduledAt: apptTime2, meetingRoom: 'Conference A', purpose: 'Consulting engagement', status: 'scheduled', createdBy: anna._id, preRegistrationToken: 'demo-pre-register-scheduled' },
    { visitor: visitors[2]._id, host: robert._id, scheduledAt: apptTime3, meetingRoom: 'Conference B', purpose: 'Q1 financial audit review', status: 'confirmed', createdBy: robert._id, preRegistrationToken: uuidv4() },
  ]);
  console.log('✅ Created appointments');

  console.log('\n🎉 Seed complete!\n');
  console.log('── Login credentials ─────────────────────────');
  console.log('Admin:    admin@visipass.com    / password123');
  console.log('Security: security@visipass.com / password123');
  console.log('Host:     emma@visipass.com     / password123');
  console.log('─────────────────────────────────────────────\n');

  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
