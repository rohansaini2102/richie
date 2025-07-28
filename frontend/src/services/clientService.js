import { clientAPI } from './api';

// Client Service for A/B Testing
class ClientService {
  constructor() {
    // We'll use the existing API functions
  }

  // Get all clients - wrapper around the existing API function
  async getAllClients() {
    try {
      const response = await clientAPI.getClients();
      
      // Transform the response to include plan counts (mock for now)
      // In a real implementation, this would come from the backend
      const clients = response?.data?.clients || [];
      const clientsWithPlanInfo = clients.map(client => ({
        ...client,
        planCount: Math.floor(Math.random() * 5) + 1, // Mock plan count
        planTypes: ['goal_based', 'cash_flow'].filter(() => Math.random() > 0.3) // Mock plan types
      }));

      return {
        success: true,
        clients: clientsWithPlanInfo
      };
    } catch (error) {
      console.error('Error fetching clients:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch clients',
        clients: []
      };
    }
  }

  // Get client by ID
  async getClientById(clientId) {
    try {
      // This would use the existing getClientById function when available
      // For now, return a mock implementation
      return {
        success: true,
        client: {
          _id: clientId,
          firstName: 'Mock',
          lastName: 'Client',
          email: 'mock@example.com',
          planCount: 3,
          planTypes: ['goal_based', 'cash_flow']
        }
      };
    } catch (error) {
      console.error('Error fetching client:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch client'
      };
    }
  }

  // Search clients
  async searchClients(searchTerm) {
    try {
      const response = await this.getAllClients();
      
      if (!response.success) {
        return response;
      }

      const filtered = response.clients.filter(client => {
        const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
        const email = client.email?.toLowerCase() || '';
        const phone = client.phoneNumber || '';
        const search = searchTerm.toLowerCase();
        
        return fullName.includes(search) || 
               email.includes(search) || 
               phone.includes(search);
      });

      return {
        success: true,
        clients: filtered
      };
    } catch (error) {
      console.error('Error searching clients:', error);
      return {
        success: false,
        message: error.message || 'Failed to search clients',
        clients: []
      };
    }
  }
}

// Create and export a singleton instance
export const clientService = new ClientService();

// Export the class as well for potential custom instances
export default ClientService;