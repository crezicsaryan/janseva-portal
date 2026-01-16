import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const Navbar = ({ user, onNavigate, onSignUp }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsDropdownOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserFirstName = () => {
    if (!user?.displayName) return 'User';
    const names = user.displayName.split(' ');
    return names[0] || 'User';
  };

  const handleMenuClick = (path) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  return (
    <nav className="professional-navbar">
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <div className="logo-circle">ज</div>
          <div className="logo-text">जनसेवा</div>
        </div>

        {/* Navigation Links */}
        <div className="navbar-links">
          <span onClick={() => navigate('/')}>Home</span>
          <span onClick={() => navigate('/scholarships')}>Scholarships</span>
          <span onClick={() => navigate('/schemes')}>Schemes</span>
        </div>

        {/* User Actions */}
        <div className="navbar-actions">
          {user ? (
            <div className="user-menu-container" ref={dropdownRef}>
              <button
                className="user-menu-button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                Hi, {getUserFirstName()}
                <svg
                  className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                  width="12"
                  height="8"
                  viewBox="0 0 12 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1.5L6 6.5L11 1.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={() => handleMenuClick('/my-profile')}
                  >
                    My Profile
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => handleMenuClick('/my-documents')}
                  >
                    My Documents
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="navbar-signup-btn"
              onClick={() => {
                if (onSignUp) {
                  onSignUp();
                } else if (onNavigate) {
                  onNavigate('form');
                }
              }}
            >
              Sign Up
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
