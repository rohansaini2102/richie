import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI, apiUtils } from '../services/api';

const AdminDashboard = () => {
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [advisorClients, setAdvisorClients] = useState([]);
  const [showClients, setShowClients] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Check if user is admin
    if (!user || !user.isAdmin) {
      navigate('/admin/login');
      return;
    }
    
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [advisorsResponse, statsResponse] = await Promise.all([
        adminAPI.getAllAdvisors(),
        adminAPI.getDashboardStats()
      ]);
      
      if (advisorsResponse.success) {
        setAdvisors(advisorsResponse.data);
      } else {
        setError('Failed to fetch advisors');
      }
      
      if (statsResponse.success) {
        setDashboardStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvisorClients = async (advisorId) => {
    try {
      setLoading(true);
      const response = await adminAPI.getAdvisorClients(advisorId);
      if (response.success) {
        setAdvisorClients(response.data);
        setShowClients(true);
      } else {
        setError('Failed to fetch advisor clients');
      }
    } catch (error) {
      console.error('Advisor clients fetch error:', error);
      setError('Error loading advisor clients');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvisorClick = (advisor) => {
    setSelectedAdvisor(advisor);
    setSelectedClient(null);
    setShowClientDetails(false);
    fetchAdvisorClients(advisor._id);
  };

  const handleClientClick = async (client) => {
    setSelectedClient(client);
    setShowClientDetails(true);
    // Here you would typically fetch detailed client data
    // For now, we'll use the available client data
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    logout();
    navigate('/admin/login');
  };

  const handleBackToAdvisors = () => {
    setSelectedAdvisor(null);
    setAdvisorClients([]);
    setShowClients(false);
    setSelectedClient(null);
    setShowClientDetails(false);
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
    setShowClientDetails(false);
  };

  const getCASStatusColor = (status) => {
    switch (status) {
      case 'parsed': return 'bg-green-100 text-green-800';
      case 'uploaded': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCASStatusText = (status) => {
    switch (status) {
      case 'parsed': return 'Parsed';
      case 'uploaded': return 'Uploaded';
      case 'processing': return 'Processing';
      case 'error': return 'Error';
      default: return 'Not uploaded';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">System Administrator</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {!showClients ? (
          // Main Dashboard View with Stats and Advisors
          <div>
            {/* Dashboard Stats */}
            {dashboardStats && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">System Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Advisors</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalAdvisors || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Clients</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalClients || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Clients with CAS</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats.clientsWithCAS || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">CAS Completion</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {dashboardStats.totalClients > 0 
                            ? Math.round((dashboardStats.clientsWithCAS / dashboardStats.totalClients) * 100)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advisors List */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">All Advisors</h2>
              <p className="text-gray-600">Total Advisors: {advisors.length}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advisors.map((advisor) => (
                <div
                  key={advisor._id}
                  onClick={() => handleAdvisorClick(advisor)}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-lg font-semibold text-indigo-600">
                              {advisor.name?.charAt(0)?.toUpperCase() || 'A'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {advisor.name || 'Unnamed Advisor'}
                          </h3>
                          <p className="text-sm text-gray-500">{advisor.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600">
                          {advisor.clientCount || 0}
                        </div>
                        <div className="text-xs text-gray-500">Clients</div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Firm:</span>
                          <p className="font-medium text-gray-900">
                            {advisor.firm || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <p className="font-medium text-gray-900">
                            {advisor.phone || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Registration Date:</span>
                        <span className="font-medium text-gray-900">
                          {apiUtils.formatDate(advisor.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200">
                        View Details & Clients
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {advisors.length === 0 && !loading && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No advisors found</h3>
                <p className="mt-1 text-sm text-gray-500">No advisors have been registered yet.</p>
              </div>
            )}
          </div>
        ) : !showClientDetails ? (
          // Advisor Details & Clients View
          <div>
            <div className="mb-6">
              <button
                onClick={handleBackToAdvisors}
                className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Advisors
              </button>

              {/* Advisor Details Card */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-indigo-600">
                        {selectedAdvisor?.name?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div className="ml-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedAdvisor?.name || 'Unnamed Advisor'}
                      </h2>
                      <p className="text-gray-600">{selectedAdvisor?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-indigo-600">
                      {advisorClients.length}
                    </div>
                    <div className="text-sm text-gray-500">Total Clients</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <span className="text-sm text-gray-500">Firm</span>
                    <p className="font-medium text-gray-900">
                      {selectedAdvisor?.firm || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Phone</span>
                    <p className="font-medium text-gray-900">
                      {selectedAdvisor?.phone || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Registration Date</span>
                    <p className="font-medium text-gray-900">
                      {apiUtils.formatDate(selectedAdvisor?.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Status</span>
                    <p className="font-medium text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Clients List */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Client List</h3>
                  <p className="text-sm text-gray-500 mt-1">Click on any client to view detailed information</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CAS Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Portfolio Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {advisorClients.map((client) => (
                        <tr key={client._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    {client.name?.charAt(0)?.toUpperCase() || 'C'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {client.name || 'Unnamed Client'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  PAN: {client.pan || 'Not provided'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{client.email}</div>
                            <div className="text-sm text-gray-500">{client.phone || 'No phone'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCASStatusColor(client.casData?.casStatus)}`}>
                              {getCASStatusText(client.casData?.casStatus)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {client.portfolioValue ? apiUtils.formatCurrency(client.portfolioValue) : 'Not available'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {apiUtils.formatDate(client.updatedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleClientClick(client)}
                              className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {advisorClients.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
                    <p className="mt-1 text-sm text-gray-500">This advisor has no clients yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Client Details View
          <div>
            <div className="mb-6">
              <button
                onClick={handleBackToClients}
                className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Clients
              </button>

              {/* Client Details Card */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-3xl font-bold text-indigo-600">
                        {selectedClient?.name?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                    <div className="ml-6">
                      <h2 className="text-3xl font-bold text-gray-900">
                        {selectedClient?.name || 'Unnamed Client'}
                      </h2>
                      <p className="text-gray-600">{selectedClient?.email}</p>
                      <p className="text-sm text-gray-500">PAN: {selectedClient?.pan || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {apiUtils.formatCurrency(selectedClient?.portfolioValue || 0)}
                    </div>
                    <div className="text-sm text-gray-500">Portfolio Value</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Email:</span>
                        <p className="text-sm font-medium text-gray-900">{selectedClient?.email}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Phone:</span>
                        <p className="text-sm font-medium text-gray-900">{selectedClient?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Address:</span>
                        <p className="text-sm font-medium text-gray-900">{selectedClient?.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">CAS Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Status:</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCASStatusColor(selectedClient?.casData?.casStatus)}`}>
                            {getCASStatusText(selectedClient?.casData?.casStatus)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Upload Date:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedClient?.casData?.uploadDate ? apiUtils.formatDate(selectedClient.casData.uploadDate) : 'Not uploaded'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Parse Date:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedClient?.casData?.parseDate ? apiUtils.formatDate(selectedClient.casData.parseDate) : 'Not parsed'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Portfolio Summary</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Total Value:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {apiUtils.formatCurrency(selectedClient?.portfolioValue || 0)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Accounts:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedClient?.casData?.totalAccounts || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Mutual Funds:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedClient?.casData?.totalMutualFunds || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Client Details */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-sm text-gray-500">Date of Birth:</span>
                      <p className="font-medium text-gray-900">
                        {selectedClient?.dateOfBirth ? apiUtils.formatDate(selectedClient.dateOfBirth) : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Registration Date:</span>
                      <p className="font-medium text-gray-900">
                        {apiUtils.formatDate(selectedClient?.createdAt)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Last Updated:</span>
                      <p className="font-medium text-gray-900">
                        {apiUtils.formatDate(selectedClient?.updatedAt)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Status:</span>
                      <p className="font-medium text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 