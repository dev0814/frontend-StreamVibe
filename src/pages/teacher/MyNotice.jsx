import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MyNotice.css';

const MyNotice = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    category: '',
    priority: '',
    status: 'active' // active, expired, all
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchNotices();
  }, [filter]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notices/my-notices', {
        params: filter,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setNotices(response.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching notices:', err);
      setError(err.response?.data?.error || 'Failed to fetch notices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noticeId) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        await axios.delete(`/api/notices/${noticeId}`);
        setNotices(notices.filter(notice => notice._id !== noticeId));
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete notice');
      }
    }
  };

  const handleEdit = (noticeId) => {
    console.log('Editing notice with ID:', noticeId);
    navigate(`/teacher/edit-notice/${noticeId}`);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusBadge = (notice) => {
    const isExpired = () => {
      if (notice.expiration.type === 'date') {
        return new Date() > new Date(notice.expiration.date);
      } else if (notice.expiration.type === 'duration') {
        if (notice.expiration.duration === 'never') return false;
        
        const durationMap = {
          '3 days': 3,
          '7 days': 7,
          '14 days': 14,
          '30 days': 30,
          '3 months': 90,
          '6 months': 180,
          '1 year': 365
        };
        
        const days = durationMap[notice.expiration.duration];
        const expirationDate = new Date(notice.createdAt);
        expirationDate.setDate(expirationDate.getDate() + days);
        
        return new Date() > expirationDate;
      }
      return false;
    };

    if (isExpired()) {
      return <span className="status-badge expired">Expired</span>;
    }
    return <span className="status-badge active">Active</span>;
  };

  const getPriorityClass = (priority) => {
    return `priority-badge ${priority.toLowerCase()}`;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="my-notice-container">
      <div className="page-header">
        <h1>My Notices</h1>
        <button 
          className="create-button"
          onClick={() => navigate('/teacher/notice')}
        >
          Create New Notice
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filters">
        <select
          name="category"
          value={filter.category}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Categories</option>
          <option value="General">General</option>
          <option value="Academic">Academic</option>
          <option value="Event">Event</option>
          <option value="Important">Important</option>
          <option value="Other">Other</option>
        </select>

        <select
          name="priority"
          value={filter.priority}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>

        <select
          name="status"
          value={filter.status}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="notices-grid">
        {notices.length === 0 ? (
          <div className="no-notices">No notices found</div>
        ) : (
          notices.map(notice => (
            <div key={notice._id} className="notice-card">
              <div className="notice-header">
                <h3>{notice.title}</h3>
                {getStatusBadge(notice)}
              </div>
              
              <div className="notice-meta">
                <span className={getPriorityClass(notice.priority)}>
                  {notice.priority}
                </span>
                <span className="category-badge">{notice.category}</span>
                <span className="branch-badge">{notice.branch}</span>
                <span className="year-badge">{notice.year}</span>
              </div>

              <p className="notice-content">{notice.content}</p>

              <div className="notice-footer">
                <div className="notice-info">
                  <span>Posted: {new Date(notice.createdAt).toLocaleDateString()}</span>
                  {notice.attachments?.length > 0 && (
                    <span className="attachment-count">
                      {notice.attachments.length} attachment(s)
                    </span>
                  )}
                </div>

                <div className="notice-actions">
                  <button
                    className="edit-button"
                    onClick={() => handleEdit(notice._id)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(notice._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyNotice; 