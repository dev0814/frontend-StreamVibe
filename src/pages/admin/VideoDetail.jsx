import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import TeacherVideoPlayer from '../teacher/TeacherVideoPlayer';
import '../teacher/VideoDetail.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const AdminVideoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [replyToComment, setReplyToComment] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const videoPlayerRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    newSocket.on('error', (err) => {
      console.warn('Socket general error:', err);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Join video room for real-time comments
  useEffect(() => {
    if (socket && id) {
      socket.emit('joinVideoRoom', id);

      socket.on('commentReceived', (data) => {
        if (!data.comment.parentComment) {
          setVideo(prevVideo => ({
            ...prevVideo,
            comments: [data.comment, ...(prevVideo.comments || [])]
          }));
        }
      });

      socket.on('commentReplyReceived', (data) => {
        setVideo(prevVideo => ({
          ...prevVideo,
          comments: prevVideo.comments.map(comment => {
            if (comment._id === data.parentCommentId) {
              // Initialize replies array if it doesn't exist
              const replies = comment.replies || [];
              // Check if reply already exists to avoid duplicates
              const replyExists = replies.some(reply => reply._id === data.reply._id);
              if (!replyExists) {
                return { ...comment, replies: [...replies, data.reply] };
              }
            }
            return comment;
          })
        }));
      });

      socket.on('commentDeleted', (data) => {
        setVideo(prevVideo => ({
          ...prevVideo,
          comments: prevVideo.comments.filter(comment => comment._id !== data.commentId)
        }));
      });

      socket.on('replyDeleted', (data) => {
        setVideo(prevVideo => ({
          ...prevVideo,
          comments: prevVideo.comments.map(comment => {
            if (comment._id === data.commentId) {
              return {
                ...comment,
                replies: (comment.replies || []).filter(reply => reply._id !== data.replyId)
              };
            }
            return comment;
          })
        }));
      });

      return () => {
        socket.off('commentReceived');
        socket.off('commentReplyReceived');
        socket.off('commentDeleted');
        socket.off('replyDeleted');
        socket.emit('leaveVideoRoom', id);
      };
    }
  }, [socket, id]);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/videos/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch video');
        }
        
        const data = await response.json();
        console.log('Fetched video data:', data);
        setVideo(data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching video:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchVideo();
  }, [id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      setCommentError(null);

      const response = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          content: newComment,
          videoId: id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const data = await response.json();
      
      // Emit new comment to all users viewing this video
      if (socket) {
        socket.emit('newComment', {
          videoId: id,
          comment: data.data
        });
      }

      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
      setCommentError(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyToComment) return;

    try {
      const response = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: replyContent,
          videoId: id,
          parentComment: replyToComment._id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to post reply');
      }

      const data = await response.json();
      
      // Emit new reply to all users viewing this video
      if (socket) {
        socket.emit('commentReplyReceived', {
          videoId: id,
          parentCommentId: replyToComment._id,
          reply: data.data
        });
      }

      // Update local state immediately for better UX
      setVideo(prevVideo => ({
        ...prevVideo,
        comments: prevVideo.comments.map(comment => {
          if (comment._id === replyToComment._id) {
            const replies = comment.replies || [];
            return { ...comment, replies: [...replies, data.data] };
          }
          return comment;
        })
      }));

      setReplyContent('');
      setReplyToComment(null);
    } catch (err) {
      console.error('Error posting reply:', err);
      setCommentError(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      // Emit comment deletion to all users viewing this video
      if (socket) {
        socket.emit('commentDeleted', {
          videoId: id,
          commentId
        });
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setCommentError(err.message);
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;

    try {
      const response = await fetch(`${API_URL}/comments/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete reply');
      }

      // Emit reply deletion to all users viewing this video
      if (socket) {
        socket.emit('replyDeleted', {
          videoId: id,
          commentId,
          replyId
        });
      }
    } catch (err) {
      console.error('Error deleting reply:', err);
      setCommentError(err.message);
    }
  };

  const handleCancelReply = () => {
    setReplyToComment(null);
    setReplyContent('');
  };

  const handleVideoError = (error) => {
    setError('Failed to play video. Please try again later.');
  };

  const handleVideoCanPlay = () => {
    setError(null);
  };

  const handleTimeUpdate = (currentTime) => {
    // You can implement any time-based features here
  };

  if (loading) {
    return <div className="loading">Loading video...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button className="back-btn" onClick={() => navigate('/admin/video-management')}>Back to Videos</button>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="not-found-container">
        <h2>Video Not Found</h2>
        <p>The video you're looking for doesn't exist or has been removed.</p>
        <button className="back-btn" onClick={() => navigate('/admin/video-management')}>Back to Videos</button>
      </div>
    );
  }

  return (
    <div className="video-detail-container">
      <div className="video-nav">
        <button className="back-btn" onClick={() => navigate('/admin/video-management')}>
          &larr; Back to Videos
        </button>
        <div className="video-actions">
          <Link to={`/admin/video-management/edit/${id}`} className="edit-btn">
            Edit Video
          </Link>
        </div>
      </div>

      <div className="video-player-container">
        {video && (
          <TeacherVideoPlayer
            ref={videoPlayerRef}
            videoSource={video.optimizedVideoUrl || video.videoUrl}
            onError={handleVideoError}
            onCanPlay={handleVideoCanPlay}
            onTimeUpdate={handleTimeUpdate}
            error={error}
          />
        )}
      </div>

      <div className="video-info">
        <h1 className="video-title">{video.title}</h1>
        <div className="video-meta">
          <span className="video-date">Uploaded on {formatDate(video.createdAt)}</span>
          <span className="video-views">{video.views || 0} views</span>
          <span className="video-likes">{video.likes || 0} likes</span>
        </div>
        <div className="video-tags">
          {video.category && <span className="tag category-tag">{video.category}</span>}
          {video.branch && <span className="tag branch-tag">{video.branch}</span>}
          {video.year && <span className="tag year-tag">Year {video.year}</span>}
          {video.tags && video.tags.map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
        <div className="video-description">
          <h3>Description</h3>
          <p>{video.description}</p>
        </div>
        <div className="video-statistics">
          <h3>Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{video.views || 0}</span>
              <span className="stat-label">Views</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{video.likes || 0}</span>
              <span className="stat-label">Likes</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{video.comments ? video.comments.length : 0}</span>
              <span className="stat-label">Comments</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : '00:00'}</span>
              <span className="stat-label">Duration</span>
            </div>
          </div>
        </div>

        <div className="video-comments">
          <h3>Comments ({video.comments ? video.comments.length : 0})</h3>
          
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="comment-input"
              rows="3"
            />
            <button 
              type="submit" 
              className="comment-submit"
              disabled={submittingComment || !newComment.trim()}
            >
              {submittingComment ? 'Posting...' : 'Post'}
            </button>
          </form>

          {video.comments && video.comments.length > 0 ? (
            <div className="comments-list">
              {video.comments.map(comment => (
                <div key={comment._id} className="comment">
                  <div className="comment-header">
                    <div className="comment-user">
                      <img 
                        src={comment.author?.profilePicture || '/default-profile.jpg'} 
                        alt={comment.author?.name || 'User'} 
                        className="comment-user-img"
                      />
                      <div className="comment-info">
                        <span className="comment-author">{comment.author?.name}</span>
                        <span className="comment-date">{formatDate(comment.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="comment-content">
                    <p className="comment-text">{comment.content}</p>
                  </div>
                  <div className="comment-actions">
                    <button 
                      onClick={() => setReplyToComment(comment)} 
                      className="reply-button"
                    >
                      Reply
                    </button>
                    <button 
                      onClick={() => handleDeleteComment(comment._id)} 
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="replies-container">
                      {comment.replies.map(reply => (
                        <div key={reply._id} className="reply">
                          <div className="reply-header">
                            <div className="reply-user">
                              <img 
                                src={reply.author?.profilePicture || '/default-profile.jpg'} 
                                alt={reply.author?.name || 'User'} 
                                className="reply-user-img"
                              />
                              <div className="reply-info">
                                <span className="reply-author">{reply.author?.name}</span>
                                <span className="reply-date">{formatDate(reply.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="reply-content">
                            <p className="reply-text">{reply.content}</p>
                          </div>
                          <div className="reply-actions">
                            <button 
                              onClick={() => handleDeleteReply(comment._id, reply._id)} 
                              className="delete-button"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  {replyToComment && replyToComment._id === comment._id && (
                    <div className="reply-form-container">
                      <div className="replying-to">
                        Replying to <span>{comment.author?.name}</span>
                        <button 
                          className="cancel-reply-btn"
                          onClick={handleCancelReply}
                        >
                          Cancel
                        </button>
                      </div>
                      <form onSubmit={handleReplySubmit} className="reply-form">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          className="reply-input"
                          rows="2"
                        />
                        <button 
                          type="submit" 
                          className="reply-submit"
                          disabled={!replyContent.trim()}
                        >
                          Reply
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-comments">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVideoDetail; 