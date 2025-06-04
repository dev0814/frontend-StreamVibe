import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './UploadVideo.css';
import api from '../../utils/api';

const EditVideo = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const thumbnailInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    topic: '',
    branch: '',
    year: '',
    tags: [],
    visibility: 'public',
    thumbnailFile: null
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [currentThumbnail, setCurrentThumbnail] = useState('');
  
  const branches = [
    { value: 'CSE', label: 'Computer Science Engineering (CSE)' },
    { value: 'CSE-AI', label: 'Computer Science Engineering-Artificial Intelligence (CSE-AI)' },
    { value: 'CSE-SF', label: 'Computer Science Engineering-Self Financed (CSE-SF)' },
    { value: 'ECE', label: 'Electronics & Communication (ECE)' },
    { value: 'EE', label: 'Electrical Engineering (EE)' },
    { value: 'ME', label: 'Mechanical Engineering (ME)' },
    { value: 'CHE', label: 'Chemical Engineering (CHE)' },
    { value: 'CE', label: 'Civil Engineering (CE)' }
  ];

  const subjects = [
    'Data Structures and Algorithms',
    'Database Management Systems',
    'Operating Systems',
    'Computer Networks',
    'Software Engineering',
    'Web Development',
    'Mobile App Development',
    'Cloud Computing',
    'Artificial Intelligence',
    'Machine Learning',
    'Deep Learning',
    'Computer Vision',
    'Natural Language Processing',
    'Cybersecurity',
    'Blockchain Technology',
    'Internet of Things',
    'Big Data Analytics',
    'DevOps',
    'System Design',
    'Programming Languages'
  ];

  const years = ['1st', '2nd', '3rd', '4th'];

  // Fetch video data
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`videos/${id}`);
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch video data');
        }
        
        const videoData = response.data;
        if (!videoData) {
          throw new Error('No video data received');
        }
        
        setFormData({
          title: videoData.title || '',
          description: videoData.description || '',
          subject: videoData.subject || '',
          topic: videoData.topic || '',
          branch: videoData.branch || '',
          year: videoData.year || '',
          tags: videoData.tags || [],
          visibility: videoData.visibility || 'public',
          thumbnailFile: null
        });
        setCurrentThumbnail(videoData.thumbnailUrl || '');
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching video:', error);
        setErrors({ fetch: error.message || 'Failed to load video data. Please try again.' });
        setIsLoading(false);
      }
    };

    fetchVideo();
  }, [id]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData({
          ...formData,
          tags: [...formData.tags, newTag]
        });
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };
  
  const handleFileChange = (e) => {
    const { files } = e.target;
    if (files.length === 0) return;
    
    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, thumbnailFile: 'Please upload a valid image file' });
      return;
    }
    
    setFormData({ ...formData, thumbnailFile: file });
    
    if (errors.thumbnailFile) {
      setErrors({ ...errors, thumbnailFile: null });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }
    
    if (!formData.topic.trim()) {
      newErrors.topic = 'Topic is required';
    }
    
    if (!formData.branch) {
      newErrors.branch = 'Please select a branch';
    }

    if (!formData.year) {
      newErrors.year = 'Please select a year';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      let thumbnailUrl = currentThumbnail;
      
      // Upload new thumbnail if provided
      if (formData.thumbnailFile) {
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('thumbnail', formData.thumbnailFile);
        
        try {
          const thumbnailResponse = await api.post('videos/thumbnail', thumbnailFormData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (thumbnailResponse.data.success && thumbnailResponse.data.data.thumbnailUrl) {
            thumbnailUrl = thumbnailResponse.data.data.thumbnailUrl;
          }
        } catch (thumbnailError) {
          console.error('Thumbnail upload failed:', thumbnailError);
          // Continue with existing thumbnail if upload fails
        }
      }
      
      // Update video data
      const videoData = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        topic: formData.topic,
        tags: formData.tags,
        thumbnailUrl: thumbnailUrl,
        branch: formData.branch,
        year: formData.year,
        visibility: formData.visibility
      };
      
      await api.put(`videos/${id}`, videoData);
      
      // Show success message and navigate back
      navigate(`/teacher/videos/${id}`, { 
        state: { 
          successMessage: `"${formData.title}" has been successfully updated.`
        }
      });
    } catch (error) {
      console.error('Update error:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSaving(false);
    }
  };
  
  const triggerFileInput = (inputRef) => {
    inputRef.current.click();
  };

  if (isLoading) {
    return (
      <div className="upload-video-container">
        <div className="loading">Loading video data...</div>
      </div>
    );
  }

  return (
    <div className="upload-video-container">
      <div className="upload-header">
        <h1>Edit Video</h1>
        <p>Update your video information</p>
      </div>
      
      <form className="upload-form" onSubmit={handleSubmit}>
        <div className="form-columns">
          <div className="form-left">
            <div className="form-group">
              <label>
                Video Title <span className="required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={errors.title ? 'error' : ''}
                placeholder="Enter a descriptive title"
              />
              {errors.title && <div className="error-message">{errors.title}</div>}
              <div className="form-hint">A clear title helps students find your video</div>
            </div>
            
            <div className="form-group">
              <label>
                Description <span className="required">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={errors.description ? 'error' : ''}
                rows="5"
                placeholder="Describe what students will learn from this video"
              ></textarea>
              {errors.description && <div className="error-message">{errors.description}</div>}
            </div>
            
            <div className="form-group">
              <label>
                Subject <span className="required">*</span>
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className={errors.subject ? 'error' : ''}
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              {errors.subject && <div className="error-message">{errors.subject}</div>}
            </div>

            <div className="form-group">
              <label>
                Topic <span className="required">*</span>
              </label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                className={errors.topic ? 'error' : ''}
                placeholder="Enter the specific topic of the video"
              />
              {errors.topic && <div className="error-message">{errors.topic}</div>}
            </div>

            <div className="form-group">
              <label>
                Branch <span className="required">*</span>
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                className={errors.branch ? 'error' : ''}
              >
                <option value="">Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select>
              {errors.branch && <div className="error-message">{errors.branch}</div>}
            </div>

            <div className="form-group">
              <label>
                Year <span className="required">*</span>
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className={errors.year ? 'error' : ''}
              >
                <option value="">Select a year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year} Year
                  </option>
                ))}
              </select>
              {errors.year && <div className="error-message">{errors.year}</div>}
            </div>
            
            <div className="form-group">
              <label>Tags</label>
              <div className="tags-input-container">
                <div className="tags-list">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                      <button
                        type="button"
                        className="remove-tag"
                        onClick={() => removeTag(tag)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Type and press Enter to add tags"
                  className="tag-input"
                />
              </div>
              <div className="form-hint">Add relevant tags to help students find your video</div>
            </div>
          </div>
          
          <div className="form-right">
            <div className="form-group">
              <label>Video Visibility</label>
              <div className="radio-group">
                <div className="radio-option">
                  <input
                    type="radio"
                    id="public"
                    name="visibility"
                    value="public"
                    checked={formData.visibility === 'public'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="public">
                    <strong>Public</strong>
                    <span>Anyone can view this video</span>
                  </label>
                </div>
                
                <div className="radio-option">
                  <input
                    type="radio"
                    id="unlisted"
                    name="visibility"
                    value="unlisted"
                    checked={formData.visibility === 'unlisted'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="unlisted">
                    <strong>Unlisted</strong>
                    <span>Only people with the link can view</span>
                  </label>
                </div>
                
                <div className="radio-option">
                  <input
                    type="radio"
                    id="private"
                    name="visibility"
                    value="private"
                    checked={formData.visibility === 'private'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="private">
                    <strong>Private</strong>
                    <span>Only you can view this video</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label>Thumbnail Image</label>
              <div className="thumbnail-section">
                <div className="thumbnail-preview">
                  {formData.thumbnailFile ? (
                    <img
                      src={URL.createObjectURL(formData.thumbnailFile)}
                      alt="Thumbnail preview"
                    />
                  ) : currentThumbnail ? (
                    <img
                      src={currentThumbnail}
                      alt="Current thumbnail"
                    />
                  ) : (
                    <div className="thumbnail-placeholder">No image selected</div>
                  )}
                </div>
                
                <div className="thumbnail-upload">
                  <div className="upload-btn-wrapper">
                    <button
                      type="button"
                      className="upload-btn-secondary"
                      onClick={() => triggerFileInput(thumbnailInputRef)}
                    >
                      {formData.thumbnailFile ? 'Change Thumbnail' : 'Upload Thumbnail'}
                    </button>
                    <input
                      type="file"
                      ref={thumbnailInputRef}
                      className="file-input"
                      name="thumbnailFile"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="form-hint">Recommended size: 1280×720 (16:9)</div>
                  {errors.thumbnailFile && <div className="error-message">{errors.thumbnailFile}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => navigate(`/teacher/videos/${id}`)}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        
        {errors.submit && (
          <div className="error-message submit-error">
            Error: {errors.submit}
          </div>
        )}
      </form>
    </div>
  );
};

export default EditVideo; 