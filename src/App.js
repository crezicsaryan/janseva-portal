import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom'; 
import { signInWithGoogle, auth, db } from './firebase'; 
import { signOut } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore'; 
import gsap from 'gsap';
import AdminPanel from './AdminPanel';
import MyDocuments from './MyDocuments'; 
import NavCategoriesBar from './NavCategoriesBar';
import PublicSchemesPage from './PublicSchemesPage';
import SchemeDetailPage from './SchemeDetailPage';
import ScholarshipsPage from './ScholarshipsPage';
import ScholarshipDetailPage from './ScholarshipDetailPage';
import EligibleScholarships from './EligibleScholarships';
import MyProfile from './MyProfile';
import EditProfile from './EditProfile';
import Navbar from './components/Navbar';
import './App.css';

// --- COMPONENT 1: USER PORTAL ---
const UserPortal = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [view, setView] = useState('preloader'); 
  const [loading, setLoading] = useState(false);
  
  // 1. ADDED: State to store schemes fetched from DB
  const [dbSchemes, setDbSchemes] = useState([]);

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
    disabilityStatus: 'No'
  });

  const [results, setResults] = useState({ eligible: [], ineligible: [] });

  const preloaderRef = useRef(null);
  const textRef = useRef(null);
  const signInInProgressRef = useRef(false);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(textRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" })
      .to(textRef.current, { color: "#FF9933", duration: 0.5 }) 
      .to(textRef.current, { color: "#0056b3", duration: 0.5 }) 
      .to(preloaderRef.current, { y: "-100%", duration: 0.8, delay: 0.5, ease: "power2.inOut", onComplete: () => setView('landing') });
  }, []);

  useEffect(() => { 
    const unsubscribe = auth.onAuthStateChanged((u) => { 
      setUser(u || null); // Set user or null based on auth state (handles logout)
      
      // If user logged in
      if (u) {
        signInInProgressRef.current = false; // Reset sign-in flag
        setLoading(false);
        // If we're on landing page, navigate to form
        setView(prevView => prevView === 'landing' ? 'form' : prevView);
      } else {
        // If user logged out, navigate to landing page (unless in preloader)
        signInInProgressRef.current = false; // Reset sign-in flag
        setView(prevView => prevView !== 'preloader' ? 'landing' : prevView);
        setLoading(false);
      }
    });
    
    return () => {
      unsubscribe(); // Cleanup subscription on unmount
    };
  }, []); // Empty dependency array - only run once on mount

  // 2. ADDED: Fetch Schemes on Load
  useEffect(() => {
    const fetchAllSchemes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "schemes"));
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDbSchemes(list);
      } catch (err) { console.error("Error fetching schemes:", err); }
    };
    fetchAllSchemes();
  }, []);

  // 3. ADDED: Scroll Handler for Quick Links
  const scrollToSection = (id) => {
    setView('landing');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleStart = async () => {
    // If user already logged in, just navigate to form
    if (user) { 
      setView('form'); 
      return; 
    }
    
    // Prevent multiple simultaneous sign-in attempts
    if (signInInProgressRef.current || loading) {
      console.log('Sign in already in progress...');
      return;
    }
    
    signInInProgressRef.current = true;
    setLoading(true); 
    
    try {
      // Call Google sign in
      await signInWithGoogle();
      // Success - auth state listener will handle navigation and loading state
      // Don't set loading to false here, let auth state change handle it
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      signInInProgressRef.current = false;
      
      // Handle specific error cases
      if (error.code === 'auth/popup-blocked') {
        alert("⚠️ Popup blocked! Please allow popups for this site.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup - silently fail, don't show error
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Multiple popup requests - silently fail
      } else if (error.code === 'auth/network-request-failed') {
        alert("Network error. Please check your internet connection.");
      } else {
        // Other errors - show message only if not a silent error
        if (error.code && !error.code.includes('cancelled') && !error.code.includes('closed')) {
          alert("Login failed. Please try again.");
        }
      }
    }
  };

  const handleUserLogout = () => {
    signOut(auth).then(() => { setUser(null); setView('landing'); });
  };

  const checkUserProfile = async (user) => {
    if (!user) return false;
    try {
      const profileDoc = await getDoc(doc(db, 'users', user.uid, 'profile', 'data'));
      return profileDoc.exists();
    } catch (error) {
      console.error('Error checking user profile:', error);
      return false;
    }
  };

  const handlePrimaryCTA = async () => {
    if (!user) {
      // User not signed in - start the sign in process
      await handleStart();
    } else {
      // User signed in - check if profile is completed
      const hasProfile = await checkUserProfile(user);
      if (hasProfile) {
        navigate('/eligible-scholarships');
      } else {
        navigate('/edit-profile');
      }
    }
  };

  const saveProfileAndCheckEligibility = async (e) => {
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

      // Navigate to eligible scholarships page
      navigate('/eligible-scholarships');
      
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error saving profile. Please try again.');
    }
    setLoading(false);
  };

  const handleInputChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  return (
    <div className="app-container">
      {/* 0. PRELOADER */}
      {view === 'preloader' && (
        <div className="preloader" ref={preloaderRef}>
          <h1 ref={textRef} className="hindi-title">जनसेवा</h1>
          <div className="spinner"></div>
        </div>
      )}

      {/* NAVBAR - Professional */}
      {view !== 'preloader' && <Navbar user={user} onNavigate={setView} onSignUp={handleStart} />}

      {/* 1. LANDING PAGE */}
      {view === 'landing' && (
        <div className="landing">
          {/* PROFESSIONAL HERO SECTION */}
          <header className="professional-hero">
            <div className="professional-hero-content">
              <span className="badge-pill">● All Government Schemes in One Place</span>
              <h1>जनसेवा</h1>
              <h2>सरकारी योजना और छात्रवृत्ति खोजें</h2>
              <p>Discover government schemes and scholarships tailored to your eligibility.</p>
              <button 
                onClick={handlePrimaryCTA}
                className="primary-cta-button"
                disabled={loading}
              >
                {loading ? "Please Wait..." : "Check Your Eligibility"}
              </button>
            </div>
          </header>

          {/* SECTION 1: SCHOLARSHIPS (BLUE) - DYNAMIC */}
          <section id="scholarship-section" className="section-container" style={{ display: 'block', backgroundColor: '#E0F2FE', padding: '60px 20px' }}>
            <div className="section-header">
              <span className="sub-header" style={{ color: '#0056b3' }}>STUDENTS ONLY</span>
              <h3 style={{ color: '#003366' }}>🎓 All Scholarships</h3>
              <p style={{ color: '#555' }}>Financial support exclusively for students.</p>
            </div>
            <div className="cards-grid">
              {/* Filter for Students and Map */}
              {dbSchemes.filter(s => s.targetRole === 'Student' && s.status === 'Active').length > 0 ? (
                dbSchemes.filter(s => s.targetRole === 'Student' && s.status === 'Active').map(s => (
                  <div key={s.id} className="category-card" style={{ borderTop: '5px solid #0056b3' }}>
                    <div className="icon-box blue">🎓</div>
                    <h4>{s.name}</h4>
                    <p style={{fontSize: '0.9rem'}}>{s.description.substring(0, 60)}...</p>
                    <p style={{fontWeight:'bold', color: '#0056b3'}}>{s.benefitAmount}</p>
                    <a href={s.link} target="_blank" rel="noreferrer">Apply Now →</a>
                  </div>
                ))
              ) : (
                <p>No scholarships active at the moment.</p>
              )}
            </div>
          </section>

          <div style={{ height: '5px', background: 'linear-gradient(to right, #0056b3, #F97316)' }}></div>

          {/* SECTION 2: SCHEMES (ORANGE) - DYNAMIC */}
          <section id="scheme-section" className="section-container" style={{ display: 'block', backgroundColor: '#FFF7ED', padding: '60px 20px' }}>
            <div className="section-header">
              <span className="sub-header" style={{ color: '#F97316' }}>CITIZENS & FARMERS</span>
              <h3 style={{ color: '#9A3412' }}>🏛️ All Government Schemes</h3>
              <p style={{ color: '#555' }}>Welfare schemes for Farmers, Women & Seniors.</p>
            </div>
            <div className="cards-grid">
              {/* Filter for NON-Students and Map */}
              {dbSchemes.filter(s => s.targetRole !== 'Student' && s.status === 'Active').length > 0 ? (
                dbSchemes.filter(s => s.targetRole !== 'Student' && s.status === 'Active').map(s => (
                  <div key={s.id} className="category-card" style={{ borderTop: '5px solid #F97316' }}>
                    <div className="icon-box orange">🏛️</div>
                    <h4>{s.name}</h4>
                    <p style={{fontSize: '0.9rem'}}>{s.description.substring(0, 60)}...</p>
                    <p style={{fontWeight:'bold', color: '#F97316'}}>{s.benefitAmount}</p>
                    <a href={s.link} target="_blank" rel="noreferrer">Apply Now →</a>
                  </div>
                ))
              ) : (
                <p>No schemes active at the moment.</p>
              )}
            </div>
          </section>

          <section className="cta-banner">
            <h3>Find Your Eligible Schemes</h3>
            <p>Millions have already joined JanSeva. Create your account today.</p>
            <div className="hero-btns">
              <button className="btn-white-hero" onClick={handleStart} disabled={loading}>
                 {loading ? "Loading..." : "Free Registration →"}
              </button>
            </div>
          </section>

          <footer className="footer">
            <div className="footer-content">
              <div className="footer-brand">
                <div className="logo-section white">
                  <div className="logo-circle">ज</div>
                  <div className="logo-text">जनसेवा</div>
                </div>
                <p>India's most trusted government scheme search platform.</p>
                <div className="social-icons">
                  <span>f</span><span>X</span><span>in</span>
                </div>
              </div>
              <div className="footer-links">
                <h4>Quick Links</h4>
                <p onClick={() => setView('landing')} style={{cursor:'pointer'}}>Home</p>
                {/* UPDATED: Navigation Links in Footer */}
                <Link to="/scholarships" style={{color:'#94A3B8', textDecoration:'none', cursor:'pointer'}}>Scholarships</Link>
                <p onClick={() => scrollToSection('scheme-section')} style={{cursor:'pointer'}}>Schemes</p>
              </div>
              <div className="footer-contact">
                <h4>Contact Us</h4>
                <p>📍 New Delhi, India</p>
                <p>📞 1800-XXX-XXXX</p>
              </div>
            </div>
            <div className="footer-bottom">
              <p>© 2024 जनसेवा. All Rights Reserved.</p>
            </div>
          </footer>
        </div>
      )}

      {/* 2. FORM PAGE */}
      {view === 'form' && (
        <div className="form-page-container">
          <div className="mandatory-form-card">
            <h2>👤 Complete Your Profile</h2>
            <form onSubmit={saveProfileAndCheckEligibility}>
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
              <div className="input-group"><div><label>Age</label><input name="age" type="number" onChange={handleInputChange} required /></div><div><label>Gender</label><select name="gender" onChange={handleInputChange}><option>Male</option><option>Female</option></select></div></div>
              <div className="input-group"><div><label>State</label><select name="state" onChange={handleInputChange}><option>Maharashtra</option><option>Delhi</option><option>UP</option><option>Karnataka</option><option>Tamil Nadu</option><option>West Bengal</option><option>Gujarat</option><option>All India</option></select></div><div><label>Category</label><select name="category" onChange={handleInputChange}><option>General</option><option>OBC</option><option>SC</option><option>ST</option></select></div></div>
              
              <div className="input-group"><div><label>Religion</label><select name="religion" onChange={handleInputChange}><option>All</option><option>Hindu</option><option>Muslim</option><option>Christian</option><option>Sikh</option><option>Buddhist</option></select></div><div><label>Disability Status</label><select name="disabilityStatus" onChange={handleInputChange}><option>No</option><option>Yes</option></select></div></div>
              
              {formData.role === 'Student' && (
                <div className="dynamic-box" style={{marginTop: '15px', padding: '10px', background: '#e0f2fe', borderRadius: '5px'}}>
                  <label>Education Level</label>
                  <select name="educationLevel" onChange={handleInputChange} style={{marginTop: '5px', width: '100%'}}>
                    <option>Class 12</option><option>Undergraduate</option><option>Postgraduate</option>
                  </select>
                  <label style={{marginTop: '10px', display: 'block'}}>Class</label>
                  <select name="class" onChange={handleInputChange} style={{marginTop: '5px', width: '100%'}}>
                    <option>Class 9</option><option>Class 10</option><option>Class 11</option><option>Class 12</option><option>Graduation</option><option>Post Graduation</option>
                  </select>
                  <label style={{marginTop: '10px', display: 'block'}}>Course</label>
                  <select name="course" onChange={handleInputChange} style={{marginTop: '5px', width: '100%'}}>
                    <option>Engineering</option><option>Medical</option><option>Arts</option><option>Science</option><option>Commerce</option><option>Law</option><option>MBA</option><option>All</option>
                  </select>
                </div>
              )}
              {formData.role === 'Farmer' && (
                <div className="dynamic-box" style={{marginTop: '15px', padding: '10px', background: '#fff7ed', borderRadius: '5px'}}>
                  <label>Land Size (Acres)</label>
                  <input name="landSize" type="number" onChange={handleInputChange} style={{marginTop: '5px'}}/>
                </div>
              )}

              <div className="form-section" style={{marginTop: '15px'}}>
                <label>Annual Family Income (₹)</label>
                <input name="annualIncome" type="number" onChange={handleInputChange} required />
              </div>
              <button type="submit" className="btn-orange-full" disabled={loading}>{loading ? "Saving Profile..." : "Check My Eligibility"}</button>
            </form>
          </div>
        </div>
      )}

      {/* 3. RESULTS */}
      {view === 'results' && (
        <div className="results-page">
          <button onClick={() => setView('form')} className="btn-edit">Edit Profile</button>
          
          <h3 className="result-heading">✅ Eligible ({results.eligible.length})</h3>
          <div className="cards-grid">
            {results.eligible.map(s => (
              <div key={s._id} className="scheme-result-card success-border">
                <h4>{s.name}</h4>
                <p className="benefit-text">💰 {s.benefitAmount}</p>
                <p style={{fontSize: '0.9rem', color: '#555', margin: '10px 0'}}>{s.description}</p> 
                
                {s.documents && s.documents.length > 0 && (
                  <div style={{fontSize: '0.85rem', background: '#f8f9fa', padding: '8px', borderRadius: '5px', marginBottom: '10px'}}>
                    <strong>📄 Required:</strong> {s.documents.join(', ')}
                  </div>
                )}

                <a href={s.link} target="_blank" rel="noreferrer" className="btn-apply">Apply</a>
              </div>
            ))}
          </div>
          
          <h3 className="result-heading">❌ Not Eligible ({results.ineligible.length})</h3>
          <div className="cards-grid">
            {results.ineligible.map(s => (
              <div key={s._id} className="scheme-result-card error-border">
                <h4>{s.name}</h4>
                <p className="reason-text error">{s.reasons[0]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. DOCUMENTS */}
      {view === 'documents' && <MyDocuments onBack={() => setView('landing')} />}
    </div>
  );
};

// --- COMPONENT 2: ADMIN WRAPPER ---
const AdminWrapper = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [creds, setCreds] = useState({ username: '', password: '' });

  const handleLogin = () => {
    if (creds.username === 'admin' && creds.password === 'janseva123') { setIsLoggedIn(true); } 
    else { alert("Invalid Credentials"); }
  };

  if (isLoggedIn) return <AdminPanel />;

  return (
    <div className="form-page-container">
      <div className="mandatory-form-card" style={{ maxWidth: '400px' }}>
        <h2>🛡️ Admin Login</h2>
        <div className="form-section"><label>Username</label><input onChange={(e) => setCreds({...creds, username: e.target.value})} /></div>
        <div className="form-section"><label>Password</label><input type="password" onChange={(e) => setCreds({...creds, password: e.target.value})} /></div>
        <button className="btn-orange-full" onClick={handleLogin} style={{ backgroundColor: '#1E293B' }}>Login</button>
        <Link to="/" style={{display: 'block', textAlign:'center', marginTop:'15px', color:'#555'}}>← Back to Home</Link>
      </div>
    </div>
  );
};

// --- COMPONENT 3: MAIN APP ROUTER ---
function App() {
  const navigate = useNavigate();
  
  return (
    <>
      <Routes>
        <Route path="/" element={<UserPortal />} />
        <Route path="/admin" element={<AdminWrapper />} />
        {/* PUBLIC BROWSING (NO LOGIN REQUIRED) */}
        <Route path="/schemes" element={<PublicSchemesPage />} />
        {/* SEO-friendly category route that reuses the same public listing */}
        <Route path="/category/:slug" element={<PublicSchemesPage />} />
        <Route path="/scheme/:schemeId" element={<SchemeDetailPage />} />
        {/* Scholarships routes */}
        <Route path="/scholarships" element={<ScholarshipsPage />} />
        <Route path="/scholarship/:id" element={<ScholarshipDetailPage />} />
        {/* Eligible scholarships route */}
        <Route path="/eligible-scholarships" element={<EligibleScholarships />} />
        {/* User profile and documents routes */}
        <Route path="/my-profile" element={<MyProfile onBack={() => navigate('/')} />} />
        <Route path="/edit-profile" element={<EditProfile onBack={() => navigate('/')} />} />
        <Route path="/my-documents" element={<MyDocuments onBack={() => navigate('/')} />} />
      </Routes>
      {/* Dynamic category navbar strip, always visible outside preloader */}
      <NavCategoriesBar />
    </>
  );
}

export default App;