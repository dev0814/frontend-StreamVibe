import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './PostNotice.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminPostNotice = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    branch: '',
    year: '',
    priority: 'normal',
    expiration: {
      type: '',
      date: '',
      duration: ''
    },
    attachments: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('expiration.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        expiration: {
          ...prev.expiration,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...validFiles]
      }));
      setError('');
    }
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields
    if (!formData.branch || formData.branch === '') {
      setError('Please select a branch');
      return;
    }
    if (!formData.year || formData.year === '') {
      setError('Please select a year');
      return;
    }
    if (!formData.expiration.type) {
      setError('Please specify expiration type');
      return;
    }
    if (formData.expiration.type === 'date' && !formData.expiration.date) {
      setError('Please select an expiration date');
      return;
    }
    if (formData.expiration.type === 'duration' && !formData.expiration.duration) {
      setError('Please select an expiration duration');
      return;
    }
    if (formData.expiration.type === 'duration' && formData.expiration.duration === 'never') {
      // Skip expiration duration validation for "never" option
    } else if (formData.expiration.type === 'duration' && !formData.expiration.duration) {
      setError('Please select an expiration duration');
      return;
    }

    try {
      setLoading(true);
      const formDataToSend = new FormData();
      
      // Append basic fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('branch', formData.branch);
      formDataToSend.append('year', formData.year);
      formDataToSend.append('priority', formData.priority);
      formDataToSend.append('expirationType', formData.expiration.type);
      
      // Append expiration fields based on type
      if (formData.expiration.type === 'date') {
        formDataToSend.append('expirationDate', formData.expiration.date);
      } else {
        formDataToSend.append('expirationDuration', formData.expiration.duration);
      }

      // Append attachments
      formData.attachments.forEach((file, index) => {
        formDataToSend.append(`attachments`, file);
      });

      const response = await axios.post(`${API_URL}/notices`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setSuccess('Notice created successfully!');
      setFormData({
        title: '',
        content: '',
        category: 'General',
        branch: '',
        year: '',
        priority: 'normal',
        expiration: {
          type: '',
          date: '',
          duration: ''
        },
        attachments: []
      });
      
      // Navigate back to notices list after 2 seconds
      setTimeout(() => {
        navigate('/admin/notices');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create notice');
    } finally {
      setLoading(false);
    }
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  return (
    <div className="post-notice-container">
      <div className="page-header">
        <h1>Post New Notice</h1>
        <button 
          className="preview-button"
          onClick={togglePreview}
        >
          {previewMode ? 'Edit Notice' : 'Preview Notice'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {previewMode ? (
        <div className="notice-preview">
          <h2>{formData.title || 'Untitled Notice'}</h2>
          <div className="notice-meta">
            <span className="category">{formData.category}</span>
            <span className="branch">{formData.branch}</span>
            <span className="year">{formData.year}</span>
            <span className={`priority ${formData.priority}`}>
              {formData.priority}
            </span>
          </div>
          <div className="notice-content">
            {formData.content || 'No content provided'}
          </div>
          {formData.expiration.type && (
            <div className="expiration-info">
              <strong>Expiration:</strong>{' '}
              {formData.expiration.type === 'date' 
                ? `Until ${new Date(formData.expiration.date).toLocaleDateString()}`
                : `For ${formData.expiration.duration}`
              }
            </div>
          )}
          {formData.attachments.length > 0 && (
            <div className="attachments">
              <h3>Attachments</h3>
              <ul>
                {formData.attachments.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleSubmit}
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Notice'}
            </button>
          </div>
        </div>
      ) : (
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
              maxLength={100}
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
              maxLength={1000}
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
              <label htmlFor="expiration.type">Expiration Type</label>
              <select
                id="expiration.type"
                name="expiration.type"
                value={formData.expiration.type}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Type</option>
                <option value="date">Specific Date</option>
                <option value="duration">Duration</option>
              </select>
            </div>

            {formData.expiration.type === 'date' && (
              <div className="form-group">
                <label htmlFor="expiration.date">Expiration Date</label>
                <input
                  type="date"
                  id="expiration.date"
                  name="expiration.date"
                  value={formData.expiration.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            )}

            {formData.expiration.type === 'duration' && (
              <div className="form-group">
                <label htmlFor="expiration.duration">Duration</label>
                <select
                  id="expiration.duration"
                  name="expiration.duration"
                  value={formData.expiration.duration}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Duration</option>
                  <option value="never">Never</option>
                  <option value="3 days">3 Days</option>
                  <option value="7 days">7 Days</option>
                  <option value="14 days">14 Days</option>
                  <option value="30 days">30 Days</option>
                  <option value="3 months">3 Months</option>
                  <option value="6 months">6 Months</option>
                  <option value="1 year">1 Year</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="attachments">Attachments (PDF only, max 5MB)</label>
            <input
              type="file"
              id="attachments"
              onChange={handleFileUpload}
              accept=".pdf"
              multiple
            />
            {formData.attachments.length > 0 && (
              <div className="attachments-list">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="attachment-item">
                    <span>{file.name}</span>
                    <button
                      type="button"
                      className="remove-attachment"
                      onClick={() => removeAttachment(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/admin/notices')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Notice'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminPostNotice; 