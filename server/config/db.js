const mongoose = require('mongoose');
const { ROLES } = require('../constants');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
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

    // 3. Seed Default Admin (reset if exists)
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@customercare.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
    // Delete any existing admin user with this email
    await User.deleteOne({ email: adminEmail });
    const adminUser = await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: adminPassword, // Will be hashed via pre-save hook
      role: ROLES.ADMIN,
      isVerified: true
    });
    console.log(`Reset default Admin user: ${adminEmail}`);

    // 4. Seed Default Agent (reset if exists)
    const agentEmail = 'agent@customercare.com';
    // Delete any existing agent user and agent profile
    const existingAgentUser = await User.findOne({ email: agentEmail });
    if (existingAgentUser) {
      await Agent.deleteOne({ user: existingAgentUser._id });
      await User.deleteOne({ email: agentEmail });
    }
    const agentUser = await User.create({
      name: 'John Agent',
      email: agentEmail,
      password: 'Agent@123',
      role: ROLES.AGENT,
      isVerified: true
    });
    // Find category to assign
    const techCategory = await ComplaintCategory.findOne({ name: 'Technical Support' });
    await Agent.create({
      user: agentUser._id,
      department: 'Support & Engineering',
      assignedCategories: techCategory ? [techCategory._id] : [],
      availability: true
    });
    console.log(`Reset default Agent user: ${agentEmail}`);

    // 5. Seed Default Customer (reset if exists)
    const customerEmail = 'customer@customercare.com';
    // Delete any existing customer user and customer profile
    const existingCustomerUser = await User.findOne({ email: customerEmail });
    if (existingCustomerUser) {
      await Customer.deleteOne({ user: existingCustomerUser._id });
      await User.deleteOne({ email: customerEmail });
    }
    const customerUser = await User.create({
      name: 'Jane Customer',
      email: customerEmail,
      password: 'Customer@123',
      role: ROLES.CUSTOMER,
      isVerified: true
    });
    await Customer.create({
      user: customerUser._id,
      phone: '123-456-7890',
      address: '123 Main St, Anytown, USA',
      companyName: 'Acme Corp',
      customerTier: 'Gold'
    });
    console.log(`Reset default Customer user: ${customerEmail}`);
  } catch (error) {
    console.error(`Seeding database failed: ${error.message}`);
  }
};

module.exports = connectDB;
