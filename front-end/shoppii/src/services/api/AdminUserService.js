import { api } from '../index';

class AdminUserService {
  /**
   * Get all users with pagination
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Number of users per page (default: 10)
   */
  async getAllUsers(page = 1, limit = 10) {
    try {
      const { data } = await api.get(`/admin/users?page=${page}&limit=${limit}`);
      if (data) return data;
    } catch (error) {
      throw new Error(error.response ? error.response.data.message : error.message);
    }
  }

  /**
   * Get user details by ID
   * @param {string} userId - User ID
   */
  async getUserDetails(userId) {
    try {
      const { data } = await api.get(`/admin/users/${userId}`);
      if (data) return data;
    } catch (error) {
      throw new Error(error.response ? error.response.data.message : error.message);
    }
  }

  /**
   * Update user details
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update (role, action, fullname, email)
   */
  async updateUserByAdmin(userId, userData) {
    try {
      const { data } = await api.put(`/admin/users/${userId}`, userData);
      if (data) return data;
    } catch (error) {
      throw new Error(error.response ? error.response.data.message : error.message);
    }
  }
}

export default new AdminUserService();