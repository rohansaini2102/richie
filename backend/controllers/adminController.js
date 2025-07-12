const Advisor = require('../models/Advisor');
const Client = require('../models/Client');
const { logger, logApi } = require('../utils/logger');

// Get all advisors with client counts
const getAllAdvisors = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  
  try {
    logger.info('Admin request: Get all advisors');
    
    // Get all advisors
    const advisors = await Advisor.find({}).select('-password');
    
    // Get client counts for each advisor
    const advisorsWithCounts = await Promise.all(
      advisors.map(async (advisor) => {
        const clientCount = await Client.countDocuments({ advisor: advisor._id });
        return {
          ...advisor.toObject(),
          clientCount
        };
      })
    );

    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration);
    
    logger.info(`Admin retrieved ${advisorsWithCounts.length} advisors`);
    
    res.json({
      success: true,
      data: advisorsWithCounts
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error(method, url, error);
    
    logger.error(`Admin error getting advisors: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve advisors',
      error: error.message
    });
  }
};

// Get advisor details with all clients
const getAdvisorClients = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const { advisorId } = req.params;
  
  try {
    logger.info(`Admin request: Get advisor clients for ${advisorId}`);
    
    // Verify advisor exists
    const advisor = await Advisor.findById(advisorId).select('-password');
    if (!advisor) {
      return res.status(404).json({
        success: false,
        message: 'Advisor not found'
      });
    }
    
    // Get all clients for this advisor
    const clients = await Client.find({ advisor: advisorId })
      .select('name email phone casData createdAt')
      .sort({ createdAt: -1 });

    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration);
    
    logger.info(`Admin retrieved ${clients.length} clients for advisor ${advisorId}`);
    
    res.json({
      success: true,
      data: clients
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error(method, url, error);
    
    logger.error(`Admin error getting advisor clients: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve advisor clients',
      error: error.message
    });
  }
};

// Get admin dashboard statistics
const getDashboardStats = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  
  try {
    logger.info('Admin request: Get dashboard stats');
    
    // Get total counts
    const totalAdvisors = await Advisor.countDocuments({});
    const totalClients = await Client.countDocuments({});
    
    // Get CAS statistics
    const clientsWithCAS = await Client.countDocuments({
      'casData.casStatus': { $in: ['uploaded', 'parsed'] }
    });
    
    const clientsWithParsedCAS = await Client.countDocuments({
      'casData.casStatus': 'parsed'
    });
    
    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentClients = await Client.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    const recentAdvisors = await Advisor.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const stats = {
      totalAdvisors,
      totalClients,
      clientsWithCAS,
      clientsWithParsedCAS,
      recentClients,
      recentAdvisors,
      casUploadRate: totalClients > 0 ? Math.round((clientsWithCAS / totalClients) * 100) : 0,
      casParseRate: clientsWithCAS > 0 ? Math.round((clientsWithParsedCAS / clientsWithCAS) * 100) : 0
    };

    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration);
    
    logger.info('Admin retrieved dashboard stats');
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error(method, url, error);
    
    logger.error(`Admin error getting dashboard stats: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllAdvisors,
  getAdvisorClients,
  getDashboardStats
}; 