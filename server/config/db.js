const mongoose = require('mongoose');
const { ROLES } = require('../constants');

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI. Set it in the environment for production deployment.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      autoIndex: true,
      maxPoolSize: 10
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed default admin, categories, and settings
    await seedDatabase();
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    const User = require('../models/User');
    const ComplaintCategory = require('../models/ComplaintCategory');
    const SystemSettings = require('../models/SystemSettings');
    const Agent = require('../models/Agent');
    const Customer = require('../models/Customer');

    // 1. Seed System Settings if none exists
    const settingsCount = await SystemSettings.countDocuments();
    if (settingsCount === 0) {
      await SystemSettings.create({});
      console.log('Seeded default SystemSettings.');
    }

    // 2. Seed Default Categories if none exists
    const categoriesCount = await ComplaintCategory.countDocuments();
    if (categoriesCount === 0) {
      const defaultCategories = [
        { name: 'Billing', description: 'Issues related to invoices, payments, charges, subscriptions, and refunds', slaHours: 24 },
        { name: 'Technical Support', description: 'Issues with software glitches, hardware failures, connectivity, or technical errors', slaHours: 24 },
        { name: 'Product Defect', description: 'Reports of damaged items, malfunctioning parts, or quality control gaps', slaHours: 48 },
        { name: 'General Inquiry', description: 'General questions, terms clarification, and guidance requests', slaHours: 72 }
      ];
      await ComplaintCategory.insertMany(defaultCategories);
      console.log('Seeded default Complaint Categories.');
    }

    // 3. Seed Default Admin (create if missing, update if present)
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@customercare.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      adminUser = await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: adminPassword,
        role: ROLES.ADMIN,
        isVerified: true
      });
    } else {
      adminUser.name = 'System Admin';
      adminUser.role = ROLES.ADMIN;
      adminUser.isVerified = true;
      adminUser.password = adminPassword;
      await adminUser.save();
    }
    console.log(`Ensured default Admin user: ${adminEmail}`);

    // 4. Seed Default Agent (create if missing, update if present)
    const agentEmail = 'agent@customercare.com';
    let agentUser = await User.findOne({ email: agentEmail });

    if (!agentUser) {
      agentUser = await User.create({
        name: 'John Agent',
        email: agentEmail,
        password: 'Agent@123',
        role: ROLES.AGENT,
        isVerified: true
      });
    } else {
      agentUser.name = 'John Agent';
      agentUser.role = ROLES.AGENT;
      agentUser.isVerified = true;
      agentUser.password = 'Agent@123';
      await agentUser.save();
    }

    const techCategory = await ComplaintCategory.findOne({ name: 'Technical Support' });
    const existingAgentProfile = await Agent.findOne({ user: agentUser._id });
    if (!existingAgentProfile) {
      await Agent.create({
        user: agentUser._id,
        department: 'Support & Engineering',
        assignedCategories: techCategory ? [techCategory._id] : [],
        availability: true
      });
    }
    console.log(`Ensured default Agent user: ${agentEmail}`);

    // 5. Seed Default Customer (create if missing, update if present)
    const customerEmail = 'customer@customercare.com';
    let customerUser = await User.findOne({ email: customerEmail });

    if (!customerUser) {
      customerUser = await User.create({
        name: 'Jane Customer',
        email: customerEmail,
        password: 'Customer@123',
        role: ROLES.CUSTOMER,
        isVerified: true
      });
    } else {
      customerUser.name = 'Jane Customer';
      customerUser.role = ROLES.CUSTOMER;
      customerUser.isVerified = true;
      customerUser.password = 'Customer@123';
      await customerUser.save();
    }

    const existingCustomerProfile = await Customer.findOne({ user: customerUser._id });
    if (!existingCustomerProfile) {
      await Customer.create({
        user: customerUser._id,
        phone: '123-456-7890',
        address: '123 Main St, Anytown, USA',
        companyName: 'Acme Corp',
        customerTier: 'Gold'
      });
    }
    console.log(`Ensured default Customer user: ${customerEmail}`);
  } catch (error) {
    console.error(`Seeding database failed: ${error.message}`);
  }
};

module.exports = connectDB;
