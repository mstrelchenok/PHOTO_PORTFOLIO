// frontend/src/components/Home.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';

function Home({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="home-container">
      <header className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              PHOTO<br />
              PORTFOLIO
            </h1>
            <div className="hero-nav">
              <Link to="/search" className="nav-item">SEARCH</Link>
              {user ? (
                <>
                  <Link to="/my-portfolio" className="nav-item">MY PORTFOLIO</Link>
                  <button onClick={handleLogout} className="nav-item nav-button">LOGOUT</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-item">LOGIN</Link>
                  <Link to="/register" className="nav-item">REGISTER</Link>
                </>
              )}
            </div>
          </div>
          
          <div className="hero-message">
            <h2 className="message-title">YOU ARE THE CREATOR!</h2>
            <p className="message-subtitle">
              Platform for creating<br />
              your own porfolio<br />
              as a photographer
            </p>
            <p className="message-tagline">
              NEW WAY TO SHOW YOUR<br />
              WORK TO PEOPLE
            </p>
            {user ? (
              <Link to="/my-portfolio" className="cta-button">Go to portfolio</Link>
            ) : (
              <Link to="/register" className="cta-button">Join now</Link>
            )}
          </div>
        </div>
      </header>

      <section className="features-section">
        <div className="feature">
          <h3>Upload Your Work</h3>
          <p>Share your photography portfolio with the world</p>
        </div>
        <div className="feature">
          <h3>Discover Artists</h3>
          <p>Explore portfolios from photographers worldwide</p>
        </div>
        <div className="feature">
          <h3>Get the inspiration</h3>
          <p>Look up for the photos of other people as a source of inspiration</p>
        </div>
      </section>

      <footer className="home-footer">
        <p>by Maryia Stralchonak</p>
      </footer>
    </div>
  );
}

export default Home;