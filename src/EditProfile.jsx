import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './App.css';

const EditProfile = ({ onBack }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    role: 'Student', 
    age: '', 
    gender: 'Male', 
    state: 'Maharashtra', 
    category: 'General', 
    educationLevel: 'Class 12', 
    class: 'Class 12',
    course: '', 
    religion: 'All',
    annualIncome: '',
    disabilityStatus: 'No',
    landSize: ''
  });

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
          const data = profileDoc.data();
          setFormData(prev => ({
            ...prev,
            ...data
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        alert('Please sign in first');
        setLoading(false);
        return;
      }

      // Save profile to Firestore
      const profileData = {
        ...formData,
        userId: user.uid,
        email: user.email,
        displayName: user.displayName,
        lastUpdated: new Date().toISOString()
      };

      // Save to users/{userId}/profile/data
      await setDoc(doc(db, 'users', user.uid, 'profile', 'data'), profileData);

      alert('Profile updated successfully!');
      navigate('/my-profile');
      
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error updating profile. Please try again.');
    }
    setLoading(false);
  };

  if (fetching) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="form-page-container">
      <div className="mandatory-form-card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <button onClick={() => navigate('/my-profile')} className="btn-edit">← Back to Profile</button>
          <h2>👤 Edit Profile</h2>
        </div>
        
        <form onSubmit={handleSaveProfile}>
          <div className="form-section">
            <label>I am a:</label>
            <div className="role-grid">
              {['Student', 'Farmer', 'Worker', 'General Citizen'].map(r => (
                <div key={r} onClick={() => setFormData({...formData, role: r})} 
                     className={`role-card ${formData.role === r ? 'active' : ''}`}>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="input-group">
            <div><label>Age</label><input name="age" type="number" value={formData.age} onChange={handleInputChange} required /></div>
            <div><label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange}>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <div><label>State</label>
              <select name="state" value={formData.state} onChange={handleInputChange}>
                <option>Maharashtra</option>
                <option>Delhi</option>
                <option>UP</option>
                <option>Karnataka</option>
                <option>Tamil Nadu</option>
                <option>West Bengal</option>
                <option>Gujarat</option>
                <option>All India</option>
              </select>
            </div>
            <div><label>Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange}>
                <option>General</option>
                <option>OBC</option>
                <option>SC</option>
                <option>ST</option>
              </select>
            </div>
          </div>
          
          <div className="input-group">
            <div><label>Religion</label>
              <select name="religion" value={formData.religion} onChange={handleInputChange}>
                <option>All</option>
                <option>Hindu</option>
                <option>Muslim</option>
                <option>Christian</option>
                <option>Sikh</option>
                <option>Buddhist</option>
              </select>
            </div>
            <div><label>Disability Status</label>
              <select name="disabilityStatus" value={formData.disabilityStatus} onChange={handleInputChange}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>
          </div>
          
          {formData.role === 'Student' && (
            <div className="dynamic-box" style={{marginTop: '15px', padding: '10px', background: '#e0f2fe', borderRadius: '5px'}}>
              <label>Education Level</label>
              <select name="educationLevel" value={formData.educationLevel} onChange={handleInputChange} style={{marginTop: '5px', width: '100%'}}>
                <option>Class 12</option>
                <option>Undergraduate</option>
                <option>Postgraduate</option>
              </select>
              
              <label style={{marginTop: '10px', display: 'block'}}>Class</label>
              <select name="class" value={formData.class} onChange={handleInputChange} style={{marginTop: '5px', width: '100%'}}>
                <option>Class 9</option>
                <option>Class 10</option>
                <option>Class 11</option>
                <option>Class 12</option>
                <option>Graduation</option>
                <option>Post Graduation</option>
              </select>
              
              <label style={{marginTop: '10px', display: 'block'}}>Course</label>
              <select name="course" value={formData.course} onChange={handleInputChange} style={{marginTop: '5px', width: '100%'}}>
                <option>Engineering</option>
                <option>Medical</option>
                <option>Arts</option>
                <option>Science</option>
                <option>Commerce</option>
                <option>Law</option>
                <option>MBA</option>
                <option>All</option>
              </select>
            </div>
          )}

          {formData.role === 'Farmer' && (
            <div className="dynamic-box" style={{marginTop: '15px', padding: '10px', background: '#fff7ed', borderRadius: '5px'}}>
              <label>Land Size (Acres)</label>
              <input name="landSize" type="number" value={formData.landSize} onChange={handleInputChange} style={{marginTop: '5px'}}/>
            </div>
          )}

          <div className="form-section" style={{marginTop: '15px'}}>
            <label>Annual Family Income (₹)</label>
            <input name="annualIncome" type="number" value={formData.annualIncome} onChange={handleInputChange} required />
          </div>

          <div className="form-actions" style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
            <button type="submit" className="btn-orange-full" disabled={loading}>
              {loading ? "Saving..." : "Save Profile"}
            </button>
            <button type="button" onClick={() => navigate('/my-profile')} className="btn-outline-hero">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
