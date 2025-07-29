import React from 'react';
import { PieChart, Target, Calendar, TrendingUp, Briefcase, Clock } from 'lucide-react';

const PortfolioManagementDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <PieChart className="h-8 w-8 text-[#1e3a5f] mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Portfolio Management</h1>
          </div>
          <p className="text-gray-600">
            Comprehensive portfolio management tools and analytics for your clients
          </p>
        </div>

        {/* Coming Soon Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-6">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Coming Soon</h3>
              <p className="text-gray-600 mb-6">
                Advanced portfolio management features are currently under development. 
                Stay tuned for powerful tools to manage and optimize your clients' investment portfolios.
              </p>
              <div className="space-y-3 text-left">
                <div className="flex items-center text-gray-700">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
                  <span>Real-time portfolio analytics</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Briefcase className="h-5 w-5 text-blue-600 mr-3" />
                  <span>Asset allocation optimization</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Target className="h-5 w-5 text-purple-600 mr-3" />
                  <span>Risk assessment tools</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Calendar className="h-5 w-5 text-orange-600 mr-3" />
                  <span>Performance tracking & reporting</span>
                </div>
              </div>
            </div>
          </div>

          {/* Make a Plan Section */}
          <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d4f73] rounded-lg shadow-sm p-8 text-white">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-white/20 mb-6">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Make a Plan</h3>
              <p className="text-blue-100 mb-6">
                Start creating comprehensive portfolio management strategies for your clients. 
                Build customized investment plans tailored to their financial goals.
              </p>
              <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Create Portfolio Plan
              </button>
              <p className="text-blue-100 text-sm mt-4">
                Available in the next update
              </p>
            </div>
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 ml-3">Performance Analytics</h4>
            </div>
            <p className="text-gray-600">
              Track portfolio performance with advanced analytics and visualization tools.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <PieChart className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 ml-3">Asset Allocation</h4>
            </div>
            <p className="text-gray-600">
              Optimize asset allocation strategies based on risk tolerance and investment goals.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 ml-3">Portfolio Insights</h4>
            </div>
            <p className="text-gray-600">
              Get AI-powered insights and recommendations for portfolio optimization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioManagementDashboard;