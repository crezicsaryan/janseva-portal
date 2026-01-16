import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getEligibleScholarships } from './utils/eligibilityChecker';
import './App.css';

const EligibleScholarships = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [eligibleScholarships, setEligibleScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile and eligible scholarships
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is authenticated
        if (!auth.currentUser) {
          setError('Please sign in to view your eligible scholarships');
          setLoading(false);
          return;
        }

        // Fetch user profile from Firestore
        const userDocRef = doc(db, 'users', auth.currentUser.uid, 'profile', 'data');
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          setError('Please complete your profile first');
          setLoading(false);
          return;
        }

        const profileData = userDocSnap.data();
        setUserProfile(profileData);

        // Fetch all scholarships
        const scholarshipsQuery = collection(db, 'scholarships');
        const scholarshipsSnapshot = await getDocs(scholarshipsQuery);
        const allScholarships = scholarshipsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filter eligible scholarships using the eligibility checker
        const eligible = getEligibleScholarships(profileData, allScholarships);
        setEligibleScholarships(eligible);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load your eligible scholarships. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleApplyNow = (scholarship) => {
    if (scholarship.link) {
      window.open(scholarship.link, '_blank');
    } else {
      navigate(`/scholarship/${scholarship.id}`);
    }
  };

  if (loading) {
    return (
      <div className="eligible-scholarships-loading">
        <div className="loading-spinner">
          <div className="loading-content">
            <div className="loading-spinner-icon"></div>
            <p>Finding your eligible scholarships...</p>
            <small>Please wait while we check your profile</small>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="eligible-scholarships-error">
        <div className="error-card">
          <h3>⚠️ {error}</h3>
          {error.includes('complete your profile') && (
            <button onClick={handleEditProfile} className="btn-orange-full">
              Complete Profile
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="eligible-scholarships-container">
      <div className="eligible-scholarships-layout">
        
        {/* LEFT SIDE - PROFILE SUMMARY */}
        {userProfile && (
          <aside className="profile-summary-sidebar">
            <div className="profile-summary-card">
              <h3>Your Profile Summary</h3>
              
              <div className="profile-field">
                <label>Education:</label>
                <span>{userProfile?.educationLevel || userProfile?.class || 'N/A'}</span>
              </div>
              
              <div className="profile-field">
                <label>Category:</label>
                <span>{userProfile?.category || 'N/A'}</span>
              </div>
              
              <div className="profile-field">
                <label>State:</label>
                <span>{userProfile?.state || 'N/A'}</span>
              </div>
              
              <div className="profile-field">
                <label>Annual Income:</label>
                <span>₹{userProfile?.annualIncome ? parseFloat(userProfile.annualIncome).toLocaleString('en-IN') : 'N/A'}</span>
              </div>
              
              <div className="profile-field">
                <label>Gender:</label>
                <span>{userProfile?.gender || 'N/A'}</span>
              </div>
              
              <div className="profile-field">
                <label>Religion:</label>
                <span>{userProfile?.religion || 'N/A'}</span>
              </div>

              <button 
                onClick={handleEditProfile}
                className="edit-profile-btn"
              >
                Edit Profile
              </button>
            </div>
          </aside>
        )}

        {/* RIGHT SIDE - ELIGIBLE SCHOLARSHIPS */}
        <main className="eligible-scholarships-main">
          <header className="eligible-scholarships-header">
            <h1>Scholarships You Are Eligible For</h1>
            <div className="scholarship-count-badge">
              Showing {eligibleScholarships.length} scholarship{eligibleScholarships.length !== 1 ? 's' : ''}
            </div>
          </header>

          {/* SCHOLARSHIP CARDS */}
          {eligibleScholarships.length === 0 ? (
            <div className="no-scholarships-found">
              <div className="empty-state-card">
                <div className="empty-state-icon">🎓</div>
                <h3>No scholarships currently match your profile</h3>
                <p>Please update your details or check again later.</p>
                <button onClick={handleEditProfile} className="btn-orange-full">
                  Edit Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="eligible-scholarships-grid">
              {eligibleScholarships.map(scholarship => (
                <article key={scholarship.id} className="eligible-scholarship-card">
                  
                  {/* Scholarship Logo/Image */}
                  {scholarship.imageUrl && (
                    <div className="scholarship-logo">
                      <img
                        src={scholarship.imageUrl}
                        alt={scholarship.title || 'Scholarship'}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Featured Tag */}
                  {scholarship.isFeatured && (
                    <span className="featured-badge">Featured</span>
                  )}

                  <div className="scholarship-content">
                    <h3 className="scholarship-title">
                      {scholarship.title || scholarship.name || 'Scholarship'}
                    </h3>

                    {/* Award Amount */}
                    {scholarship.award && (
                      <div className="scholarship-award">
                        💰 {scholarship.award}
                      </div>
                    )}

                    {/* Eligibility Highlights */}
                    {scholarship.eligibility && (
                      <div className="eligibility-highlights">
                        <strong>Eligibility:</strong>
                        <p>
                          {typeof scholarship.eligibility === 'string'
                            ? scholarship.eligibility.length > 120
                              ? `${scholarship.eligibility.substring(0, 120)}...`
                              : scholarship.eligibility
                            : Array.isArray(scholarship.eligibility)
                              ? scholarship.eligibility.slice(0, 3).join(', ')
                              : JSON.stringify(scholarship.eligibility)}
                        </p>
                      </div>
                    )}

                    {/* Deadline */}
                    {scholarship.deadline && (
                      <div className="scholarship-deadline">
                        <span className="deadline-label">📅 Deadline:</span>
                        <span className="deadline-date">{formatDate(scholarship.deadline)}</span>
                      </div>
                    )}

                    {/* Apply Button */}
                    <button
                      onClick={() => handleApplyNow(scholarship)}
                      className="apply-now-btn"
                    >
                      Apply Now →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EligibleScholarships;
