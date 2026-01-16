import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import './App.css';

const MyProfile = ({ onBack }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate('/');
        return;
      }

      setUser(currentUser);

      try {
        const profileDoc = await getDoc(doc(db, 'users', currentUser.uid, 'profile', 'data'));
        if (profileDoc.exists()) {
          setProfileData(profileDoc.data());
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner">Loading profile...</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="section-container">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
          <button onClick={onBack} className="btn-edit">← Back</button>
          <h2>My Profile</h2>
        </div>
        
        <div className="empty-state-card">
          <div className="empty-state-icon">👤</div>
          <h3>Profile Not Found</h3>
          <p>Please complete your profile to access all features.</p>
          <button onClick={handleEditProfile} className="btn-orange-full">
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
        <button onClick={onBack} className="btn-edit">← Back</button>
        <h2>My Profile</h2>
        <button onClick={handleEditProfile} className="btn-edit">Edit Profile</button>
      </div>

      <div className="profile-view-container">
        {/* Profile Header */}
        <div className="profile-header-card">
          <div className="profile-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" />
            ) : (
              <div className="avatar-placeholder">
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h3>{user?.displayName || 'User'}</h3>
            <p className="profile-email">{user?.email || 'No email'}</p>
            <p className="profile-updated">
              Last updated: {formatDate(profileData.lastUpdated)}
            </p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="profile-details-grid">
          <div className="profile-section">
            <h4>Personal Information</h4>
            <div className="profile-field-row">
              <label>Age:</label>
              <span>{profileData.age || 'Not specified'}</span>
            </div>
            <div className="profile-field-row">
              <label>Gender:</label>
              <span>{profileData.gender || 'Not specified'}</span>
            </div>
            <div className="profile-field-row">
              <label>State:</label>
              <span>{profileData.state || 'Not specified'}</span>
            </div>
            <div className="profile-field-row">
              <label>Category:</label>
              <span>{profileData.category || 'Not specified'}</span>
            </div>
            <div className="profile-field-row">
              <label>Religion:</label>
              <span>{profileData.religion || 'Not specified'}</span>
            </div>
            <div className="profile-field-row">
              <label>Disability Status:</label>
              <span>{profileData.disabilityStatus || 'Not specified'}</span>
            </div>
          </div>

          <div className="profile-section">
            <h4>Education Information</h4>
            <div className="profile-field-row">
              <label>Role:</label>
              <span>{profileData.role || 'Not specified'}</span>
            </div>
            <div className="profile-field-row">
              <label>Education Level:</label>
              <span>{profileData.educationLevel || 'Not specified'}</span>
            </div>
            <div className="profile-field-row">
              <label>Class:</label>
              <span>{profileData.class || 'Not specified'}</span>
            </div>
            <div className="profile-field-row">
              <label>Course:</label>
              <span>{profileData.course || 'Not specified'}</span>
            </div>
          </div>

          <div className="profile-section">
            <h4>Financial Information</h4>
            <div className="profile-field-row">
              <label>Annual Income:</label>
              <span>
                {profileData.annualIncome 
                  ? `₹${parseFloat(profileData.annualIncome).toLocaleString('en-IN')}`
                  : 'Not specified'
                }
              </span>
            </div>
          </div>

          {profileData.role === 'Farmer' && (
            <div className="profile-section">
              <h4>Farming Information</h4>
              <div className="profile-field-row">
                <label>Land Size:</label>
                <span>
                  {profileData.landSize 
                    ? `${profileData.landSize} acres`
                    : 'Not specified'
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="profile-actions">
          <button onClick={handleEditProfile} className="btn-orange-full">
            Edit Profile
          </button>
          <button 
            onClick={() => navigate('/my-documents')} 
            className="btn-outline-hero"
          >
            My Documents
          </button>
          <button 
            onClick={() => navigate('/eligible-scholarships')} 
            className="btn-outline-hero"
          >
            View Eligible Scholarships
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
