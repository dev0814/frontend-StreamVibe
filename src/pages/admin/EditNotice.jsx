import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PostNotice.css';

const AdminEditNotice = () => {
  const { noticeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    branch: '',
    year: '',
    priority: 'normal',
    attachments: []
  });

  useEffect(() => {
    fetchNotice();
  }, [noticeId]);

  const fetchNotice = async () => {
    try {
      const response = await axios.get(`/api/notices/${noticeId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('API Response:', response);
      
      const notice = response.data.data || response.data;
      console.log('Notice data:', notice);
      
      if (!notice) {
        throw new Error('No notice data received');
      }

      const formData = {
        title: notice.title || '',
        content: notice.content || '',
        category: notice.category || 'General',
        branch: notice.branch || '',
        year: notice.year || '',
        priority: notice.priority || 'normal',
        attachments: notice.attachments || []
      };

      console.log('Setting form data:', formData);
      setFormData(formData);
      setError('');
    } catch (err) {
      console.error('Error fetching notice:', err);
      setError(err.response?.data?.error || 'Failed to fetch notice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.branch || formData.branch === '') {
        throw new Error('Please select a branch');
      }
      if (!formData.year || formData.year === '') {
        throw new Error('Please select a year');
      }

      const submitData = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        branch: formData.branch,
        year: formData.year,
        priority: formData.priority,
        attachments: formData.attachments
      };

      console.log('Submitting data:', submitData);

      const response = await axios.put(`/api/notices/${noticeId}`, submitData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Update response:', response.data);
      setSuccess('Notice updated successfully');
      setTimeout(() => {
        navigate('/admin/notices');
      }, 2000);
    } catch (err) {
      console.error('Error updating notice:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update notice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="post-notice-container">
      <div className="page-header">
        <h1>Edit Notice</h1>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="notice-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            required
            rows={6}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="General">General</option>
              <option value="Academic">Academic</option>
              <option value="Event">Event</option>
              <option value="Important">Important</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              required
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="branch">Branch</label>
            <select
              id="branch"
              name="branch"
              value={formData.branch}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Branch</option>
              <option value="CSE">CSE</option>
              <option value="CSE-AI">CSE-AI</option>
              <option value="CSE-SF">CSE-SF</option>
              <option value="ECE">ECE</option>
              <option value="EE">EE</option>
              <option value="ME">ME</option>
              <option value="CE">CE</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="year">Year</label>
            <select
              id="year"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Year</option>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/admin/notices')}
            className="cancel-button"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Notice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminEditNotice; 