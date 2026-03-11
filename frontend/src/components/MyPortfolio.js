// frontend/src/components/MyPortfolio.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './MyPortfolio.css';

function MyPortfolio({ user, apiUrl, onLogout }) {
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category_id: '',
    photo: null
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  useEffect(() => {
    fetchMyPhotos();
    fetchCategories();
  }, []);

  const fetchMyPhotos = async () => {
    try {
      const response = await fetch(`${apiUrl}/photos?user_id=${user.user_id}`);
      const data = await response.json();
      if (data.success) {
        setPhotos(data.data);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${apiUrl}/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (e) => {
    setUploadData({
      ...uploadData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setUploadData({
      ...uploadData,
      photo: e.target.files[0]
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage('');

    if (!uploadData.photo) {
      setMessage('Please select a photo');
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('photo', uploadData.photo);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    formData.append('category_id', uploadData.category_id);
    formData.append('user_id', user.user_id);

    try {
      const response = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Photo uploaded successfully!');
        setUploadData({ title: '', description: '', category_id: '', photo: null });
        setShowUploadForm(false);
        fetchMyPhotos();
      } else {
        setMessage('Upload failed: ' + data.error);
      }
    } catch (error) {
      setMessage('Upload error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="my-portfolio-container">
      <div className="portfolio-top-nav">
        <Link to="/" className="logo">PHOTO<br />
                      PORTFOLIO</Link>
        <div className="top-nav-links">
          <Link to="/">HOME</Link>
          <Link to="/search">SEARCH</Link>
          <Link to="/my-portfolio" className="active">MY PORTFOLIO</Link>
          <button onClick={handleLogout} className="logout-btn">LOGOUT</button>
        </div>
      </div>

      <div className="portfolio-content">
        <div className="portfolio-header">
          <div>
            <h1>My Portfolio</h1>
            <p>Welcome, {user.full_name || user.username}!</p>
          </div>
          <button 
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="upload-toggle-button"
          >
            {showUploadForm ? 'Cancel' : '+ Upload Photo'}
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {showUploadForm && (
          <div className="upload-form-container">
            <h2>Upload New Photo</h2>
            <form onSubmit={handleUpload} className="upload-form">
              <div className="form-group">
                <label>Photo *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={uploadData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter photo title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={uploadData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your photo..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  name="category_id"
                  value={uploadData.category_id}
                  onChange={handleInputChange}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={uploading} className="upload-button">
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
            </form>
          </div>
        )}

        <div className="my-photos-section">
          <h2>My Photos ({photos.length})</h2>
          {photos.length > 0 ? (
            <div className="photos-grid">
              {photos.map(photo => (
                <div key={photo.photo_id} className="photo-card">
                  <img 
                    src={`${apiUrl}/image/${photo.photo_id}`}
                    alt={photo.title}
                    className="photo-image"
                  />
                  <div className="photo-info">
                    <h3>{photo.title}</h3>
                    {photo.category_name && (
                      <span className="photo-category">{photo.category_name}</span>
                    )}
                    {photo.description && (
                      <p className="photo-description">{photo.description}</p>
                    )}
                    <p className="photo-date">
                      Uploaded: {new Date(photo.upload_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-photos">
              <p>You haven't uploaded any photos yet.</p>
              <button onClick={() => setShowUploadForm(true)} className="start-upload-button">
                Upload Your First Photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyPortfolio;