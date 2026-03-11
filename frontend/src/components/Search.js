import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Search.css';

function Search({ apiUrl, user, onLogout }) {
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  useEffect(() => {
    fetchCategories();
    fetchPhotos();
  }, []);

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

  const fetchPhotos = async (category = '', search = '') => {
    setLoading(true);
    try {
      let url = `${apiUrl}/photos?`;
      if (category) url += `category=${encodeURIComponent(category)}&`;
      if (search) url += `search=${encodeURIComponent(search)}`;

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setPhotos(data.data);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPhotos(selectedCategory, searchTerm);
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    fetchPhotos(category, searchTerm);
  };

  return (
    <div className="search-container">
      <div className="search-top-nav">
        <Link to="/" className="logo">PHOTO<br />
              PORTFOLIO</Link>
        <div className="top-nav-links">
          <Link to="/">HOME</Link>
          <Link to="/search" className="active">SEARCH</Link>
          {user ? (
            <>
              <Link to="/my-portfolio">MY PORTFOLIO</Link>
              <button onClick={handleLogout} className="logout-btn">LOGOUT</button>
            </>
          ) : (
            <>
              <Link to="/login">LOGIN</Link>
              <Link to="/register">REGISTER</Link>
            </>
          )}
        </div>
      </div>

      <div className="search-header">
        <h1>DISCOVER PHOTOGRAPHY</h1>
        <p>Search through thousands of stunning photos</p>
      </div>

      <div className="search-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>

        <select 
          value={selectedCategory} 
          onChange={handleCategoryChange}
          className="category-select"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.category_id} value={cat.category_name}>
              {cat.category_name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading photos...</div>
      ) : (
        <div className="photos-grid">
          {photos.length > 0 ? (
            photos.map(photo => (
              <div key={photo.photo_id} className="photo-card">
                <img 
                  src={`${apiUrl}/image/${photo.photo_id}`}
                  alt={photo.title}
                  className="photo-image"
                />
                <div className="photo-info">
                  <h3>{photo.title}</h3>
                  <p className="photo-author">by {photo.username}</p>
                  {photo.category_name && (
                    <span className="photo-category">{photo.category_name}</span>
                  )}
                  {photo.description && (
                    <p className="photo-description">{photo.description}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No photos found. Try a different search or category.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Search;