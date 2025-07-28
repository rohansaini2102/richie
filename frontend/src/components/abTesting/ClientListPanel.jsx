import React, { useState, useEffect } from 'react';
import { Search, User, FileText, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { clientService } from '../../services/clientService';

const ClientListPanel = ({ onClientSelect, loading }) => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchTerm, clients]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      setError(null);
      
      const response = await clientService.getAllClients();
      if (response.success) {
        // Filter clients who have at least 2 plans for comparison
        const clientsWithPlans = response.clients.filter(client => 
          client.planCount && client.planCount >= 2
        );
        setClients(clientsWithPlans);
      } else {
        throw new Error(response.message || 'Failed to load clients');
      }
    } catch (err) {
      setError(`Failed to load clients: ${err.message}`);
      console.error('Error loading clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  const filterClients = () => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const filtered = clients.filter(client => {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      const email = client.email?.toLowerCase() || '';
      const phone = client.phoneNumber || '';
      
      return (
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        phone.includes(searchLower)
      );
    });
    
    setFilteredClients(filtered);
  };

  const handleClientClick = (client) => {
    onClientSelect(client);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlanTypesString = (client) => {
    if (!client.planTypes || client.planTypes.length === 0) {
      return 'No plans';
    }
    return client.planTypes.join(', ');
  };

  if (loadingClients) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Clients...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadClients}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Select Client for A/B Testing
          </div>
          <span className="text-sm font-normal text-gray-500">
            {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} available
          </span>
        </CardTitle>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredClients.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching clients found' : 'No clients available for A/B testing'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'Clients need at least 2 plans to be eligible for comparison'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredClients.map((client) => (
              <div
                key={client._id}
                onClick={() => handleClientClick(client)}
                className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200 bg-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                        {client.firstName} {client.lastName}
                      </h3>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Email:</span>
                        <span className="truncate">{client.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Phone:</span>
                        <span>{client.phoneNumber || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          <span>{client.planCount || 0} plans</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Created {formatDate(client.createdAt)}</span>
                        </div>
                      </div>
                      
                      {client.planTypes && client.planTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {client.planTypes.map((type) => (
                            <span
                              key={type}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                            >
                              {type.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Load More Button (if needed for pagination) */}
        {filteredClients.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Showing {filteredClients.length} clients with 2+ plans
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientListPanel;