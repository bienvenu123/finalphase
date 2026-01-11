import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { getDoctors } from '../services/doctorService';
import { getChatConversations, getChatMessages, sendMessage, getOrCreateConversation } from '../services/chatService';
import { getCurrentDoctorId } from '../utils/doctorUtils';
import ErrorDisplay from '../components/ErrorDisplay';
import HospitalLogo from '../components/HospitalLogo';
import './DoctorsChatPage.css';

const DoctorsChatPage = () => {
  const [currentDoctorId, setCurrentDoctorId] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCurrentDoctorAndDoctors();
  }, []);

  useEffect(() => {
    if (currentDoctorId) {
      fetchConversations();
    }
  }, [currentDoctorId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchCurrentDoctorAndDoctors = async () => {
    try {
      setLoading(true);
      const doctorId = await getCurrentDoctorId();
      if (!doctorId) {
        setError('Doctor profile not found. Please contact administrator.');
        setLoading(false);
        return;
      }
      setCurrentDoctorId(doctorId);

      // Fetch all doctors
      const doctorsRes = await getDoctors();
      const allDoctors = doctorsRes.data || [];
      // Filter out current doctor
      setDoctors(allDoctors.filter(d => d._id !== doctorId));
    } catch (err) {
      setError(err.message || 'Failed to load doctor data');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await getChatConversations(currentDoctorId);
      setConversations(response.data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      // If endpoint doesn't exist, create empty conversations list
      setConversations([]);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;
    try {
      const response = await getChatMessages(selectedConversation._id);
      setMessages(response.data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setMessages([]);
    }
  };

  const handleSelectDoctor = async (doctor) => {
    try {
      setError(null);
      let conversation = null;
      
      // Try to get or create conversation from backend
      try {
        const response = await getOrCreateConversation({
          doctor1_id: currentDoctorId,
          doctor2_id: doctor._id
        });
        conversation = response.data || response;
      } catch (backendErr) {
        console.warn('Backend conversation endpoint not available, using local conversation:', backendErr);
        // Create a local conversation object if backend fails
        conversation = {
          doctor1_id: currentDoctorId,
          doctor2_id: doctor._id,
          _id: `local-${currentDoctorId}-${doctor._id}` // Temporary local ID
        };
      }
      
      // Set the selected conversation with doctor info
      setSelectedConversation({
        ...conversation,
        otherDoctor: doctor
      });
      
      // Try to fetch messages if conversation has an ID
      if (conversation._id && !conversation._id.startsWith('local-')) {
        try {
          const messagesRes = await getChatMessages(conversation._id);
          setMessages(messagesRes.data || []);
        } catch (msgErr) {
          console.warn('Could not fetch messages, starting with empty conversation:', msgErr);
          setMessages([]);
        }
      } else {
        // Start with empty messages for new/local conversations
        setMessages([]);
      }
    } catch (err) {
      // Even if there's an error, still open the chat interface
      console.error('Error selecting doctor:', err);
      setSelectedConversation({
        doctor1_id: currentDoctorId,
        doctor2_id: doctor._id,
        _id: `local-${currentDoctorId}-${doctor._id}`,
        otherDoctor: doctor
      });
      setMessages([]);
      setError('Note: Chat is working in local mode. Backend integration pending.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setError(null);

    try {
      const otherDoctorId = selectedConversation.otherDoctor?._id || 
                           selectedConversation.doctor2_id || 
                           selectedConversation.doctor1_id;
      
      // Check if this is a local conversation
      const isLocalConversation = selectedConversation._id?.startsWith('local-');
      
      if (!isLocalConversation) {
        // Try to send via backend
        try {
          await sendMessage({
            sender_id: currentDoctorId,
            receiver_id: otherDoctorId,
            conversation_id: selectedConversation._id,
            message: messageText
          });
          // Refresh messages
          await fetchMessages();
        } catch (backendErr) {
          // If backend fails, add message locally
          console.warn('Backend send failed, adding message locally:', backendErr);
          const localMessage = {
            _id: `msg-${Date.now()}`,
            sender_id: currentDoctorId,
            receiver_id: otherDoctorId,
            message: messageText,
            createdAt: new Date().toISOString(),
            created_at: new Date().toISOString()
          };
          setMessages(prev => [...prev, localMessage]);
          setError('Note: Message saved locally. Backend integration pending.');
        }
      } else {
        // Local conversation - add message to local state
        const localMessage = {
          _id: `msg-${Date.now()}`,
          sender_id: currentDoctorId,
          receiver_id: otherDoctorId,
          message: messageText,
          createdAt: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, localMessage]);
        setError('Note: Message saved locally. Backend integration pending.');
      }
    } catch (err) {
      setError(err.message || 'Failed to send message');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOtherDoctorName = (conversation) => {
    if (conversation.otherDoctor) {
      return `Dr. ${conversation.otherDoctor.first_name} ${conversation.otherDoctor.last_name}`;
    }
    // Fallback if otherDoctor not loaded
    return 'Doctor';
  };

  const filteredDoctors = doctors.filter(doctor => {
    if (!searchQuery) return true;
    const fullName = `${doctor.first_name} ${doctor.last_name}`.toLowerCase();
    const email = (doctor.email || '').toLowerCase();
    const specialization = (doctor.specialization || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query) || specialization.includes(query);
  });

  if (loading) {
    return (
      <div className="doctors-chat-page">
        <div className="loading">Loading chat...</div>
      </div>
    );
  }

  // Check if user is a doctor
  const currentUser = getCurrentUser();
  const isDoctorUser = currentUser?.role?.toLowerCase() === 'doctor';
  
  // Determine dashboard route based on user role
  const getDashboardRoute = () => {
    if (!currentUser) return '/';
    return isDoctorUser ? '/doctor-dashboard' : '/dashboard';
  };

  if (!isDoctorUser) {
    return (
      <div className="doctors-chat-page">
        <div className="chat-header">
          <div className="chat-header-content">
            <div className="chat-header-info">
              <HospitalLogo size="medium" shape="circle" />
              <div>
                <h1>Doctors Chat</h1>
                <p>Communicate with your colleagues</p>
              </div>
            </div>
            <div className="chat-header-actions">
              {currentUser ? (
                <Link to={getDashboardRoute()} className="btn-back-dashboard">
                  <svg className="back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Back to Dashboard</span>
                </Link>
              ) : (
                <Link to="/" className="btn-back-dashboard">
                  <svg className="back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Back to Home</span>
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="chat-container">
          <div className="chat-main">
            <div className="chat-placeholder">
              <div className="placeholder-content">
                <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                </svg>
                <h2>Doctors Only</h2>
                <p>This chat feature is exclusively available for doctors.</p>
                {!currentUser ? (
                  <p>Please <Link to="/login" style={{ color: '#1e3a5f', fontWeight: 600 }}>login</Link> with a doctor account to access the chat.</p>
                ) : (
                  <p>Your current account does not have doctor privileges. Please contact administrator if you believe this is an error.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !currentDoctorId) {
    return (
      <div className="doctors-chat-page">
        <ErrorDisplay error={error} />
      </div>
    );
  }

  return (
    <div className="doctors-chat-page">
      <div className="chat-header">
        <div className="chat-header-content">
          <div className="chat-header-info">
            <HospitalLogo size="medium" shape="circle" />
            <div>
              <h1>Doctors Chat</h1>
              <p>Communicate with your colleagues</p>
            </div>
          </div>
          <div className="chat-header-actions">
            <Link to={getDashboardRoute()} className="btn-back-dashboard">
              <svg className="back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {error && selectedConversation && (
        <div className="chat-error-banner">
          <ErrorDisplay error={error} />
        </div>
      )}

      <div className="chat-container">
        {/* Doctors List Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2>Doctors</h2>
            <div className="search-box">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="doctors-list">
            {filteredDoctors.length === 0 ? (
              <div className="no-doctors">
                <p>No doctors found</p>
              </div>
            ) : (
              filteredDoctors.map(doctor => (
                <div
                  key={doctor._id}
                  className={`doctor-item ${selectedConversation?.otherDoctor?._id === doctor._id ? 'active' : ''}`}
                  onClick={() => handleSelectDoctor(doctor)}
                >
                  <div className="doctor-avatar">
                    {doctor.first_name?.[0]}{doctor.last_name?.[0]}
                  </div>
                  <div className="doctor-info">
                    <div className="doctor-name">
                      Dr. {doctor.first_name} {doctor.last_name}
                    </div>
                    <div className="doctor-specialization">
                      {doctor.specialization || 'General'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-main">
          {selectedConversation ? (
            <>
              <div className="chat-messages-header">
                <div className="chat-messages-header-info">
                  <div className="chat-avatar">
                    {selectedConversation.otherDoctor?.first_name?.[0]}
                    {selectedConversation.otherDoctor?.last_name?.[0]}
                  </div>
                  <div>
                    <h3>{getOtherDoctorName(selectedConversation)}</h3>
                    <p className="chat-status">Online</p>
                  </div>
                </div>
              </div>

              <div className="chat-messages" ref={messagesEndRef}>
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isCurrentUser = message.sender_id === currentDoctorId || 
                                         (typeof message.sender_id === 'object' && message.sender_id._id === currentDoctorId);
                    return (
                      <div
                        key={message._id || message.id}
                        className={`message ${isCurrentUser ? 'message-sent' : 'message-received'}`}
                      >
                        <div className="message-content">
                          <p>{message.message}</p>
                          <span className="message-time">{formatTime(message.createdAt || message.created_at || message.timestamp)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={!newMessage.trim() || sending}
                >
                  {sending ? (
                    <svg className="spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4V2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12H20C20 7.58 16.42 4 12 4Z" fill="currentColor"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
                    </svg>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="chat-placeholder">
              <div className="placeholder-content">
                <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="currentColor"/>
                </svg>
                <h2>Select a doctor to start chatting</h2>
                <p>Choose a doctor from the list to begin a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorsChatPage;

