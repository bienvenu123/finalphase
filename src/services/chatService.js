// API Base URL - Update this to match your backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Chat Service
 * Handles all API calls related to doctor-to-doctor chat
 */

/**
 * Get all chat conversations for the current doctor
 * @param {string} doctorId - Current doctor ID
 * @returns {Promise} Response data
 */
export const getChatConversations = async (doctorId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/conversations/${doctorId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch chat conversations');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get messages for a specific conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise} Response data
 */
export const getChatMessages = async (conversationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/messages/${conversationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch chat messages');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Send a message
 * @param {Object} messageData - Message data { sender_id, receiver_id, message }
 * @returns {Promise} Response data
 */
export const sendMessage = async (messageData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send message');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create or get a conversation between two doctors
 * @param {Object} conversationData - Conversation data { doctor1_id, doctor2_id }
 * @returns {Promise} Response data
 */
export const getOrCreateConversation = async (conversationData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversationData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create/get conversation');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};


