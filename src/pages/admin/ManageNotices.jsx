import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ManageNotices.css';

const ManageNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    branch: 'All',
    year: 'All',
    category: 'All',
    priority: 'All',
    status: 'All'
  });
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  const branches = ['All', 'CSE', 'CSE-AI', 'CSE-SF', 'ECE', 'EE', 'ME', 'CE'];
  const years = ['All', '1st', '2nd', '3rd', '4th'];
  const categories = ['All', 'General', 'Academic', 'Event', 'Important', 'Other'];
  const priorities = ['All', 'low', 'normal', 'high'];
  const statuses = ['All', 'active', 'expired'];

  useEffect(() => {
    fetchNotices();
  }, [filters]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notices', { params: filters });
      setNotices(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch notices');
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteClick = (notice) => {
    setSelectedNotice(notice);
    setShowDeleteModal(true);
  };

  const handleEditClick = (notice) => {
    setEditFormData({
      ...notice,
      expirationType: notice.expirationDate ? 'date' : 'duration'
    });
    setShowEditModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/notices/${selectedNotice._id}`);
      setNotices(prev => prev.filter(notice => notice._id !== selectedNotice._id));
      setShowDeleteModal(false);
      setSelectedNotice(null);
    } catch (err) {
      setError('Failed to delete notice');
      console.error('Error deleting notice:', err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/notices/${editFormData._id}`, editFormData);
      setNotices(prev => prev.map(notice => 
        notice._id === editFormData._id ? response.data : notice
      ));
      setShowEditModal(false);
      setEditFormData(null);
    } catch (err) {
      setError('Failed to update notice');
      console.error('Error updating notice:', err);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (notice) => {
    const now = new Date();
    const expiryDate = notice.expirationDate 
      ? new Date(notice.expirationDate)
      : new Date(notice.createdAt.getTime() + getDurationInMs(notice.expirationDuration));
    
    return now > expiryDate ? 'expired' : 'active';
  };

  const getDurationInMs = (duration) => {
    const [value, unit] = duration.split(' ');
    const multiplier = {
      'days': 24 * 60 * 60 * 1000,
      'months': 30 * 24 * 60 * 60 * 1000,
      'year': 365 * 24 * 60 * 60 * 1000
    }[unit];
    return parseInt(value) * multiplier;
  };

  if (loading) {
    return (
      <div className="manage-notices-container">
        <div className="loading">Loading notices...</div>
      </div>
    );
  }

  return (
    <div className="manage-notices-container">
      <div className="page-header">
        <h1>Manage Notices</h1>
        <p>View and manage all notices in the system</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="branch">Branch</label>
          <select
            id="branch"
            name="branch"
            value={filters.branch}
            onChange={handleFilterChange}
          >
            {branches.map(branch => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="year">Year</label>
          <select
            id="year"
            name="year"
            value={filters.year}
            onChange={handleFilterChange}
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
          >
            {priorities.map(priority => (
              <option key={priority} value={priority}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="notices-list">
        {notices.length === 0 ? (
          <div className="no-notices">
            No notices found matching the selected filters
          </div>
        ) : (
          notices.map(notice => (
            <div key={notice._id} className="notice-card">
              <div className="notice-header">
                <h3>{notice.title}</h3>
                <div className="notice-meta">
                  <span className={`priority-badge ${notice.priority}`}>
                    {notice.priority.toUpperCase()}
                  </span>
                  <span className={`status-badge ${getStatusBadgeClass(notice)}`}>
                    {getStatusBadgeClass(notice).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="notice-content">
                {notice.content}
              </div>

              <div className="notice-details">
                <div className="detail-item">
                  <span className="label">Category:</span>
                  <span className="value">{notice.category}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Branch:</span>
                  <span className="value">{notice.branch}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Year:</span>
                  <span className="value">{notice.year}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Posted:</span>
                  <span className="value">{formatDate(notice.createdAt)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Expires:</span>
                  <span className="value">
                    {notice.expirationDate 
                      ? formatDate(notice.expirationDate)
                      : notice.expirationDuration}
                  </span>
                </div>
              </div>

              {notice.attachments?.length > 0 && (
                <div className="notice-attachments">
                  <h4>Attachments</h4>
                  <div className="attachments-list">
                    {notice.attachments.map((attachment, index) => (
                      <div key={index} className="attachment-item">
                        <i className="fas fa-file-pdf"></i>
                        <span>{attachment.name}</span>
                        <a 
                          href={attachment.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="view-attachment"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="notice-actions">
                <button
                  onClick={() => handleEditClick(notice)}
                  className="edit-btn"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(notice)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this notice? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="confirm-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editFormData && (
        <div className="modal-overlay">
          <div className="modal-content edit-modal">
            <h3>Edit Notice</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label htmlFor="edit-title">Title</label>
                <input
                  type="text"
                  id="edit-title"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-content">Content</label>
                <textarea
                  id="edit-content"
                  name="content"
                  value={editFormData.content}
                  onChange={handleEditInputChange}
                  required
                  rows={6}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-category">Category</label>
                  <select
                    id="edit-category"
                    name="category"
                    value={editFormData.category}
                    onChange={handleEditInputChange}
                    required
                  >
                    {categories.filter(cat => cat !== 'All').map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-priority">Priority</label>
                  <select
                    id="edit-priority"
                    name="priority"
                    value={editFormData.priority}
                    onChange={handleEditInputChange}
                    required
                  >
                    {priorities.filter(pri => pri !== 'All').map(priority => (
                      <option key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-branch">Branch</label>
                  <select
                    id="edit-branch"
                    name="branch"
                    value={editFormData.branch}
                    onChange={handleEditInputChange}
                    required
                  >
                    {branches.filter(b => b !== 'All').map(branch => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-year">Year</label>
                  <select
                    id="edit-year"
                    name="year"
                    value={editFormData.year}
                    onChange={handleEditInputChange}
                    required
                  >
                    {years.filter(y => y !== 'All').map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-expirationType">Expiration Type</label>
                  <select
                    id="edit-expirationType"
                    name="expirationType"
                    value={editFormData.expirationType}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="duration">Duration</option>
                    <option value="date">Specific Date</option>
                  </select>
                </div>

                {editFormData.expirationType === 'duration' ? (
                  <div className="form-group">
                    <label htmlFor="edit-expirationDuration">Duration</label>
                    <select
                      id="edit-expirationDuration"
                      name="expirationDuration"
                      value={editFormData.expirationDuration}
                      onChange={handleEditInputChange}
                      required
                    >
                      {durations.map(duration => (
                        <option key={duration} value={duration}>
                          {duration}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label htmlFor="edit-expirationDate">Expiration Date</label>
                    <input
                      type="date"
                      id="edit-expirationDate"
                      name="expirationDate"
                      value={editFormData.expirationDate}
                      onChange={handleEditInputChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageNotices; 