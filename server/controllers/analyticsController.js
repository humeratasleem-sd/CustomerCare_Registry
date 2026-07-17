const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const ComplaintCategory = require('../models/ComplaintCategory');
const Agent = require('../models/Agent');
const { ROLES, COMPLAINT_STATUS } = require('../constants');

// @desc    Get Admin Metrics and Charts data
// @route   GET /api/analytics/admin
// @access  Private (Admin Only)
exports.getAdminAnalytics = async (req, res) => {
  try {
    // 1. Core Card Tally Metrics
    const totalCustomers = await User.countDocuments({ role: ROLES.CUSTOMER });
    const totalAgents = await User.countDocuments({ role: ROLES.AGENT });
    const totalComplaints = await Complaint.countDocuments();
    
    const pendingCount = await Complaint.countDocuments({ status: COMPLAINT_STATUS.PENDING });
    const resolvedCount = await Complaint.countDocuments({ status: COMPLAINT_STATUS.RESOLVED });
    const closedCount = await Complaint.countDocuments({ status: COMPLAINT_STATUS.CLOSED });
    const escalatedCount = await Complaint.countDocuments({ status: COMPLAINT_STATUS.ESCALATED });

    // 2. Average Resolution Time Computation (in hours)
    // Filter tickets that are resolved or closed
    const resolvedTickets = await Complaint.find({
      status: { $in: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED] },
      resolvedAt: { $exists: true }
    });

    let avgResolutionTimeHours = 0;
    if (resolvedTickets.length > 0) {
      const totalDuration = resolvedTickets.reduce((sum, ticket) => {
        const diffMs = ticket.resolvedAt - ticket.createdAt;
        return sum + (diffMs / (1000 * 60 * 60)); // convert MS to hours
      }, 0);
      avgResolutionTimeHours = (totalDuration / resolvedTickets.length).toFixed(1);
    }

    // 3. Category Complaints Distribution
    const categoryDistribution = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'complaintcategories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      {
        $unwind: '$categoryDetails'
      },
      {
        $project: {
          _id: 0,
          categoryName: '$categoryDetails.name',
          count: 1
        }
      }
    ]);

    // 4. Status Distribution
    const statusDistribution = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1
        }
      }
    ]);

    // 5. Priority Distribution
    const priorityDistribution = await Complaint.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          priority: '$_id',
          count: 1
        }
      }
    ]);

    // 6. Monthly Complaints Volume (Past 6 months)
    const activeMonthsAgo = new Date();
    activeMonthsAgo.setMonth(activeMonthsAgo.getMonth() - 6);

    const monthlyDistribution = await Complaint.aggregate([
      {
        $match: { createdAt: { $gte: activeMonthsAgo } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 7. Agent Ratings throughput
    const agentsOverview = await Agent.find({})
      .populate('user', 'name email')
      .select('department performanceRating resolvedCount')
      .limit(10);

    // 8. Customer Growth Trend (User registrations)
    const customerGrowth = await User.aggregate([
      { $match: { role: ROLES.CUSTOMER, createdAt: { $gte: activeMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      cards: {
        totalCustomers,
        totalAgents,
        totalComplaints,
        pendingCount,
        resolvedCount,
        closedCount,
        escalatedCount,
        avgResolutionTimeHours
      },
      charts: {
        categoryDistribution,
        statusDistribution,
        priorityDistribution,
        monthlyDistribution,
        agentsOverview,
        customerGrowth
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Agent Metrics
// @route   GET /api/analytics/agent
// @access  Private (Agent Only)
exports.getAgentAnalytics = async (req, res) => {
  try {
    const agentId = req.user._id;

    const assignedCount = await Complaint.countDocuments({ assignedAgent: agentId });
    const resolvedCount = await Complaint.countDocuments({ assignedAgent: agentId, status: COMPLAINT_STATUS.RESOLVED });
    const closedCount = await Complaint.countDocuments({ assignedAgent: agentId, status: COMPLAINT_STATUS.CLOSED });
    
    const pendingCount = await Complaint.countDocuments({ 
      assignedAgent: agentId, 
      status: { $in: [COMPLAINT_STATUS.ASSIGNED, COMPLAINT_STATUS.IN_PROGRESS] } 
    });
    
    const escalatedCount = await Complaint.countDocuments({ 
      assignedAgent: agentId, 
      status: COMPLAINT_STATUS.ESCALATED 
    });

    // Recent resolved list
    const recentResolutions = await Complaint.find({
      assignedAgent: agentId,
      status: { $in: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED] }
    })
    .populate('customer', 'name email')
    .sort({ resolvedAt: -1 })
    .limit(5);

    // Performance Details profile
    const agentProfile = await Agent.findOne({ user: agentId })
      .select('performanceRating resolvedCount department');

    res.status(200).json({
      success: true,
      metrics: {
        assignedCount,
        resolvedCount: resolvedCount + closedCount,
        pendingCount,
        escalatedCount,
        performanceRating: agentProfile ? agentProfile.performanceRating : 5.0
      },
      recentResolutions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
