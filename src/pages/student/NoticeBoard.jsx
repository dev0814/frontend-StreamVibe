import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NoticeBoard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    branch: 'All',
    year: 'All',
    category: 'All'
  });
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);

  const branches = ['All', 'CSE', 'CSE-AI', 'CSE-SF', 'ECE', 'EE', 'ME', 'CE'];
  const years = ['All', '1st', '2nd', '3rd', '4th'];
  const categories = ['All', 'General', 'Academic', 'Event', 'Important', 'Other'];

  useEffect(() => {
    fetchNotices();
  }, [filters]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notices', {
        params: {
          branch: filters.branch !== 'All' ? filters.branch : undefined,
          year: filters.year !== 'All' ? filters.year : undefined,
          category: filters.category !== 'All' ? filters.category : undefined
        }
      });
      setNotices(response.data.data);
    } catch (error) {
      console.error('Error fetching notices:', error);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePdfClick = (pdf) => {
    setSelectedPdf(pdf);
    setShowPdfModal(true);
  };

  const closePdfModal = () => {
    setShowPdfModal(false);
    setSelectedPdf(null);
  };

  if (loading) {
    return <div className="loading">Loading notices...</div>;
  }

  return (
    <div className="notice-board-container">
      <div className="notice-sidebar">
        <div className="notice-filters">
          <select 
            name="branch"
            value={filters.branch}
            onChange={handleFilterChange}
            className="filter-select"
          >
            {branches.map(branch => (
              <option key={branch} value={branch}>
                {branch === 'All' ? 'All Branches' : branch}
              </option>
            ))}
          </select>

          <select 
            name="year"
            value={filters.year}
            onChange={handleFilterChange}
            className="filter-select"
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year === 'All' ? 'All Years' : year}
              </option>
            ))}
          </select>

          <select 
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="filter-select"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'All' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
        
        <div className="notices-list">
          {notices.length === 0 ? (
            <div className="no-notices">No notices found</div>
          ) : (
            notices.map(notice => (
              <div 
                key={notice._id}
                className={`notice-item ${selectedNotice?._id === notice._id ? 'active' : ''} ${notice.priority === 'high' ? 'important' : ''}`}
                onClick={() => setSelectedNotice(notice)}
              >
                <h3>{notice.title}</h3>
                <div className="notice-meta">
                  <span className="notice-category">{notice.category}</span>
                  <span className="notice-date">{formatDate(notice.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="notice-content">
        {selectedNotice ? (
          <>
            <div className="notice-header">
              <h1>{selectedNotice.title}</h1>
              <div className="notice-info">
                <span className="notice-author">Posted by: {selectedNotice.teacher.name}</span>
                <span className="notice-date">{formatDate(selectedNotice.createdAt)}</span>
                {selectedNotice.priority === 'high' && (
                  <span className="notice-important-tag">High Priority</span>
                )}
              </div>
            </div>
            
            <div className="notice-body">
              {selectedNotice.content}
            </div>
            
            {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
              <div className="notice-attachments">
                <h3>Attachments</h3>
                <div className="attachments-list">
                  {selectedNotice.attachments.map((attachment, index) => (
                    <div 
                      key={index}
                      className="attachment-item"
                      onClick={() => handlePdfClick(attachment)}
                    >
                      <i className="fas fa-file-pdf"></i>
                      <span>{attachment.originalname}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="no-notice-selected">
            <p>Select a notice to view details</p>
          </div>
        )}
      </div>

      {/* PDF Modal */}
      {showPdfModal && selectedPdf && (
        <div className="pdf-modal-overlay" onClick={closePdfModal}>
          <div className="pdf-modal-content" onClick={e => e.stopPropagation()}>
            <div className="pdf-modal-header">
              <h3>{selectedPdf.originalname}</h3>
              <button onClick={closePdfModal} className="close-modal-btn">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="pdf-modal-body">
              <iframe
                src={selectedPdf.url}
                title="PDF Viewer"
                width="100%"
                height="100%"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;

