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
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    logger.info(`[${requestId}] Admin request: Get advisor clients`, {
      advisorId,
      timestamp: new Date().toISOString(),
      adminUser: req.admin?.id || 'unknown'
    });
    
    // Verify advisor exists
    const advisor = await Advisor.findById(advisorId).select('-password');
    if (!advisor) {
      logger.warn(`[${requestId}] Advisor not found: ${advisorId}`);
      return res.status(404).json({
        success: false,
        message: 'Advisor not found'
      });
    }
    
    logger.info(`[${requestId}] Advisor verified: ${advisor.firstName} ${advisor.lastName}`);
    
    // Get all clients for this advisor
    const clients = await Client.find({ advisor: advisorId })
      .sort({ createdAt: -1 });

    // Log detailed information about retrieved clients
    const clientsSummary = clients.map(client => ({
      id: client._id,
      name: `${client.firstName} ${client.lastName}`,
      email: client.email,
      casStatus: client.casData?.casStatus || 'not_uploaded',
      completionPercentage: client.completionPercentage || 0,
      createdAt: client.createdAt,
      lastUpdated: client.updatedAt
    }));
    
    logger.info(`[${requestId}] Clients data summary`, {
      totalClients: clients.length,
      clientsWithCAS: clients.filter(c => c.casData?.casStatus).length,
      averageCompletion: clients.reduce((sum, c) => sum + (c.completionPercentage || 0), 0) / (clients.length || 1),
      oldestClient: clients.length > 0 ? clients[clients.length - 1].createdAt : null,
      newestClient: clients.length > 0 ? clients[0].createdAt : null
    });
    
    // Log sample fields from first client (if exists) to show data structure
    if (clients.length > 0) {
      const sampleClient = clients[0].toObject();
      logger.info(`[${requestId}] Sample client data structure`, {
        clientId: sampleClient._id,
        availableFields: Object.keys(sampleClient),
        nestedStructures: {
          hasAddress: !!sampleClient.address,
          hasAssets: !!sampleClient.assets,
          hasDebts: !!sampleClient.debtsAndLiabilities,
          hasGoals: !!sampleClient.financialGoals
        }
      });
    }

    const responseSize = JSON.stringify(clients).length;
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration);
    
    logger.info(`[${requestId}] Admin clients response sent`, {
      advisorId,
      clientCount: clients.length,
      responseSize: `${(responseSize / 1024).toFixed(2)} KB`,
      duration: `${duration}ms`
    });
    
    res.json({
      success: true,
      data: clients,
      metadata: {
        requestId,
        count: clients.length,
        fetchDuration: duration
      }
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

// Update client by admin
const updateAdvisorClient = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const { advisorId, clientId } = req.params;
  
  try {
    logger.info(`Admin request: Update client ${clientId} for advisor ${advisorId}`);
    
    // Verify advisor exists
    const advisor = await Advisor.findById(advisorId);
    if (!advisor) {
      return res.status(404).json({
        success: false,
        message: 'Advisor not found'
      });
    }
    
    // Find and update the client
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found for this advisor'
      });
    }

    // Update client with the provided data
    Object.assign(client, req.body);
    client.updatedAt = new Date();
    
    const updatedClient = await client.save();

    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration);
    
    logger.info(`Admin updated client ${clientId} for advisor ${advisorId}`);
    
    res.json({
      success: true,
      data: updatedClient,
      message: 'Client updated successfully'
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error(method, url, error);
    
    logger.error(`Admin error updating client: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update client',
      error: error.message
    });
  }
};

// Get individual advisor client details with comprehensive logging
const getAdvisorClientDetails = async (req, res) => {
  const startTime = Date.now();
  const { method, url } = req;
  const { advisorId, clientId } = req.params;
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  try {
    logger.info(`[${requestId}] Admin request: Get client details`, {
      advisorId,
      clientId,
      timestamp: new Date().toISOString(),
      adminUser: req.admin?.id || 'unknown'
    });
    
    // Verify advisor exists
    const advisor = await Advisor.findById(advisorId).select('-password');
    if (!advisor) {
      logger.warn(`[${requestId}] Advisor not found: ${advisorId}`);
      return res.status(404).json({
        success: false,
        message: 'Advisor not found'
      });
    }
    
    logger.info(`[${requestId}] Advisor found: ${advisor.firstName} ${advisor.lastName}`);
    
    // Get detailed client information
    const client = await Client.findOne({ 
      _id: clientId, 
      advisor: advisorId 
    });
    
    if (!client) {
      logger.warn(`[${requestId}] Client not found`, {
        clientId,
        advisorId
      });
      return res.status(404).json({
        success: false,
        message: 'Client not found for this advisor'
      });
    }
    
    // Log what fields are present in the client data
    const clientFields = Object.keys(client.toObject());
    const populatedFields = clientFields.filter(field => client[field] !== null && client[field] !== undefined);
    
    logger.info(`[${requestId}] Client data retrieved`, {
      clientId: client._id,
      clientName: `${client.firstName} ${client.lastName}`,
      email: client.email,
      totalFields: clientFields.length,
      populatedFields: populatedFields.length,
      missingFields: clientFields.filter(field => !populatedFields.includes(field)),
      casStatus: client.casData?.casStatus || 'not_uploaded',
      completionPercentage: client.completionPercentage,
      lastUpdated: client.updatedAt
    });
    
    // Log nested data availability
    logger.info(`[${requestId}] Client nested data status`, {
      hasAddress: !!client.address,
      hasAssets: !!client.assets,
      hasDebts: !!client.debtsAndLiabilities,
      hasGoals: !!client.financialGoals,
      hasInvestmentProfile: !!client.investmentExperience,
      hasCASData: !!client.casData,
      hasExpenseBreakdown: !!client.expenseBreakdown
    });
    
    // Calculate response size
    const responseData = client.toObject();
    const responseSize = JSON.stringify(responseData).length;
    
    const duration = Date.now() - startTime;
    logApi.response(method, url, 200, duration);
    
    logger.info(`[${requestId}] Admin client details response sent`, {
      clientId,
      responseSize: `${(responseSize / 1024).toFixed(2)} KB`,
      duration: `${duration}ms`,
      fieldsIncluded: Object.keys(responseData).length
    });
    
    res.json({
      success: true,
      data: client,
      metadata: {
        requestId,
        fetchDuration: duration,
        dataSize: responseSize,
        completionStatus: {
          percentage: client.completionPercentage || 0,
          lastUpdated: client.updatedAt
        }
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error(method, url, error);
    
    logger.error(`[${requestId}] Admin error getting client details`, {
      error: error.message,
      stack: error.stack,
      advisorId,
      clientId,
      duration: `${duration}ms`
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve client details',
      error: error.message,
      requestId
    });
  }
};

module.exports = {
  getAllAdvisors,
  getAdvisorClients,
  getAdvisorClientDetails,
  getDashboardStats,
  updateAdvisorClient
}; 