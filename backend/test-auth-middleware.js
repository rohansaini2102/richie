// Test script for Enhanced Authentication Middleware
const jwt = require('jsonwebtoken');
const { auth, optionalAuth, requireAdmin, authRateLimit, requirePermission, logAPIUsage } = require('./middleware/auth');
const { logger } = require('./utils/logger');

// Mock request and response objects
const createMockReq = (headers = {}, body = {}, params = {}) => ({
  headers,
  body,
  params,
  method: 'GET',
  path: '/test',
  ip: '127.0.0.1',
  get: (key) => headers[key],
  header: (key) => headers[key]
});

const createMockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    next: jest.fn()
  };
  return res;
};

// Mock Advisor model
const mockAdvisor = {
  _id: 'test-advisor-id',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  firmName: 'Test Firm',
  status: 'active',
  isEmailVerified: true
};

jest.mock('../models/Advisor', () => ({
  findById: jest.fn().mockResolvedValue(mockAdvisor)
}));

describe('Enhanced Authentication Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = jest.fn();
    
    // Set JWT secret for testing
    process.env.JWT_SECRET = 'test-secret-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Main Authentication Middleware (auth)', () => {
    test('should authenticate with valid JWT token', async () => {
      const token = jwt.sign({ id: mockAdvisor._id }, process.env.JWT_SECRET);
      req.headers.Authorization = `Bearer ${token}`;

      await auth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.advisor).toEqual({
        id: mockAdvisor._id,
        firstName: mockAdvisor.firstName,
        lastName: mockAdvisor.lastName,
        email: mockAdvisor.email,
        firmName: mockAdvisor.firmName,
        status: mockAdvisor.status,
        isEmailVerified: mockAdvisor.isEmailVerified
      });
    });

    test('should reject request without authorization header', async () => {
      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No authorization header provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with invalid authorization format', async () => {
      req.headers.Authorization = 'InvalidFormat token123';

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid authorization format.'
      });
    });

    test('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: mockAdvisor._id, exp: Math.floor(Date.now() / 1000) - 3600 },
        process.env.JWT_SECRET
      );
      req.headers.Authorization = `Bearer ${expiredToken}`;

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token has expired'
      });
    });

    test('should reject request with invalid JWT token', async () => {
      req.headers.Authorization = 'Bearer invalid-token';

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Malformed token'
      });
    });

    test('should handle missing JWT secret', async () => {
      delete process.env.JWT_SECRET;
      req.headers.Authorization = 'Bearer valid-token';

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server configuration error.'
      });
    });
  });

  describe('Optional Authentication Middleware (optionalAuth)', () => {
    test('should continue without auth when no header provided', async () => {
      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.advisor).toBeUndefined();
    });

    test('should authenticate when valid header provided', async () => {
      const token = jwt.sign({ id: mockAdvisor._id }, process.env.JWT_SECRET);
      req.headers.Authorization = `Bearer ${token}`;

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.advisor).toBeDefined();
    });

    test('should continue without auth when invalid header provided', async () => {
      req.headers.Authorization = 'Bearer invalid-token';

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.advisor).toBeUndefined();
    });
  });

  describe('Admin Authentication Middleware (requireAdmin)', () => {
    test('should authenticate with valid admin token', () => {
      req.headers['admin-token'] = 'admin-session-token';

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.admin).toEqual({
        id: 'admin',
        username: 'admin',
        role: 'administrator'
      });
    });

    test('should reject request without admin token', () => {
      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin access required'
      });
    });

    test('should reject request with invalid admin token', () => {
      req.headers['admin-token'] = 'invalid-token';

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin access required'
      });
    });
  });

  describe('Rate Limiting Middleware (authRateLimit)', () => {
    test('should allow request within rate limit', () => {
      const rateLimit = authRateLimit(2, 60000); // 2 attempts per minute

      rateLimit(req, res, next);
      expect(next).toHaveBeenCalled();

      // Reset mocks
      next.mockClear();
      rateLimit(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('should block request exceeding rate limit', () => {
      const rateLimit = authRateLimit(2, 60000); // 2 attempts per minute

      // First two requests should pass
      rateLimit(req, res, next);
      next.mockClear();
      rateLimit(req, res, next);
      next.mockClear();

      // Third request should be blocked
      rateLimit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('Too many authentication attempts'),
        retryAfter: expect.any(Number)
      });
    });
  });

  describe('Permission Middleware (requirePermission)', () => {
    test('should allow request with authenticated user', () => {
      req.advisor = { id: 'test-id' };
      const permissionCheck = requirePermission('read:data');

      permissionCheck(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should reject request without authentication', () => {
      const permissionCheck = requirePermission('read:data');

      permissionCheck(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });
  });

  describe('API Usage Logging Middleware (logAPIUsage)', () => {
    test('should log API usage and continue', () => {
      const originalJson = res.json;
      res.json = jest.fn();

      logAPIUsage(req, res, next);

      expect(next).toHaveBeenCalled();

      // Test that response logging works
      res.json({ success: true });
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('Integration Tests', () => {
    test('should work with multiple middleware functions', async () => {
      const token = jwt.sign({ id: mockAdvisor._id }, process.env.JWT_SECRET);
      req.headers.Authorization = `Bearer ${token}`;

      // Test auth + logAPIUsage combination
      await auth(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.advisor).toBeDefined();

      // Reset for next middleware
      next.mockClear();
      logAPIUsage(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('should handle rate limiting with authentication', async () => {
      const rateLimit = authRateLimit(1, 60000);
      const token = jwt.sign({ id: mockAdvisor._id }, process.env.JWT_SECRET);
      req.headers.Authorization = `Bearer ${token}`;

      // First request should pass rate limit
      rateLimit(req, res, next);
      expect(next).toHaveBeenCalled();

      // Reset for auth
      next.mockClear();
      await auth(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.advisor).toBeDefined();
    });
  });
});

// Manual test runner (for non-Jest environments)
if (typeof jest === 'undefined') {
  console.log('Running manual authentication middleware tests...');
  
  const runManualTests = async () => {
    console.log('\n=== Testing Enhanced Authentication Middleware ===\n');

    // Test 1: Valid authentication
    console.log('Test 1: Valid JWT authentication');
    const token = jwt.sign({ id: 'test-advisor-id' }, 'test-secret-key');
    const req1 = createMockReq({ Authorization: `Bearer ${token}` });
    const res1 = createMockRes();
    
    try {
      await auth(req1, res1, () => {
        console.log('✅ Authentication successful');
        console.log('Advisor data:', req1.advisor);
      });
    } catch (error) {
      console.log('❌ Authentication failed:', error.message);
    }

    // Test 2: Invalid token
    console.log('\nTest 2: Invalid JWT token');
    const req2 = createMockReq({ Authorization: 'Bearer invalid-token' });
    const res2 = createMockRes();
    
    try {
      await auth(req2, res2, () => {});
      console.log('❌ Should have failed with invalid token');
    } catch (error) {
      console.log('✅ Correctly rejected invalid token');
    }

    // Test 3: Admin authentication
    console.log('\nTest 3: Admin authentication');
    const req3 = createMockReq({ 'admin-token': 'admin-session-token' });
    const res3 = createMockRes();
    
    requireAdmin(req3, res3, () => {
      console.log('✅ Admin authentication successful');
      console.log('Admin data:', req3.admin);
    });

    // Test 4: Rate limiting
    console.log('\nTest 4: Rate limiting');
    const rateLimit = authRateLimit(2, 60000);
    const req4 = createMockReq();
    const res4 = createMockRes();
    
    rateLimit(req4, res4, () => {
      console.log('✅ First request allowed');
    });
    
    rateLimit(req4, res4, () => {
      console.log('✅ Second request allowed');
    });
    
    rateLimit(req4, res4, () => {
      console.log('❌ Third request should be blocked');
    });

    console.log('\n=== Manual tests completed ===');
  };

  runManualTests().catch(console.error);
} 