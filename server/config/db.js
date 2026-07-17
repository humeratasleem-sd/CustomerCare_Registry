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

    // 3. Seed Default Admin if none exists
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@customercare.com';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPassword123!';
      
      const newAdmin = await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: adminPassword, // Will be hashed via pre-save hook
        role: ROLES.ADMIN,
        isVerified: true
      });
      console.log(`Seeded default Admin user: ${adminEmail}`);
    }
  } catch (error) {
    console.error(`Seeding database failed: ${error.message}`);
  }
};

module.exports = connectDB;
