import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link } from 'react-router-dom'; 
import { signInWithGoogle, auth, db } from './firebase'; 
import { signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore'; 
import gsap from 'gsap';
import AdminPanel from './AdminPanel';
import MyDocuments from './MyDocuments'; 
import './App.css';

// --- COMPONENT 1: USER PORTAL ---
const UserPortal = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('preloader'); 
  const [loading, setLoading] = useState(false);
  
  // 1. ADDED: State to store schemes fetched from DB
  const [dbSchemes, setDbSchemes] = useState([]);

  const [formData, setFormData] = useState({
    role: 'Student', age: '', gender: 'Male', state: 'Maharashtra', category: 'General', 
    education: 'Class 12', landSize: '', income: ''
  });

  const [results, setResults] = useState({ eligible: [], ineligible: [] });

  const preloaderRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(textRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" })
      .to(textRef.current, { color: "#FF9933", duration: 0.5 }) 
      .to(textRef.current, { color: "#0056b3", duration: 0.5 }) 
      .to(preloaderRef.current, { y: "-100%", duration: 0.8, delay: 0.5, ease: "power2.inOut", onComplete: () => setView('landing') });
  }, []);

  useEffect(() => { auth.onAuthStateChanged((u) => { if (u) setUser(u); }); }, []);

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
    if (user) { setView('form'); return; }
    setLoading(true); 
    try {
      await signInWithGoogle();
      setView('form');
    } catch (error) {
      if (error.code === 'auth/popup-blocked') alert("⚠️ Popup blocked!");
      else if (error.code !== 'auth/cancelled-popup-request') alert("Login failed.");
    }
    setLoading(false); 
  };

  const handleUserLogout = () => {
    signOut(auth).then(() => { setUser(null); setView('landing'); });
  };

  const checkEligibility = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // We can use dbSchemes here since we already fetched them
      const eligible = [], ineligible = [];

      dbSchemes.forEach(scheme => {
        let reasons = [];
        let isEligible = true;
        const sRole = scheme.targetRole || 'All';
        const sIncome = scheme.incomeLimit ? parseInt(scheme.incomeLimit) : 0;
        const sMinAge = scheme.ageMin ? parseInt(scheme.ageMin) : 0;
        const sMaxAge = scheme.ageMax ? parseInt(scheme.ageMax) : 100;
        const sState = scheme.state || 'All India';
        const sStatus = scheme.status || 'Draft';

        if (sStatus !== 'Active') return; 

        if (sRole !== 'General Citizen' && sRole !== 'All' && sRole !== formData.role) { isEligible = false; reasons.push(`Only for ${sRole}s`); }
        if (sIncome > 0 && (formData.income ? parseInt(formData.income) : 0) > sIncome) { isEligible = false; reasons.push(`Income < ₹${sIncome}`); }
        const uAge = formData.age ? parseInt(formData.age) : 0;
        if (uAge < sMinAge || uAge > sMaxAge) { isEligible = false; reasons.push(`Age mismatch`); }
        if (sState !== 'All India' && !sState.includes('All') && sState.toLowerCase() !== formData.state.toLowerCase()) { isEligible = false; reasons.push(`Resident of ${sState} only`); }

        if (isEligible) eligible.push({ ...scheme, _id: scheme.id });
        else ineligible.push({ ...scheme, _id: scheme.id, reasons });
      });
      setResults({ eligible, ineligible });
      setView('results');
    } catch (err) { alert("Error checking schemes."); }
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

      {/* NAVBAR */}
      {view !== 'preloader' && (
        <nav className="navbar">
          <div className="logo-section" onClick={() => setView('landing')}>
            <div className="logo-circle">ज</div>
            <div className="logo-text">जनसेवा</div>
          </div>
          <div className="nav-menu">
            <span onClick={() => setView('landing')}>Home</span>
            {user && <span onClick={() => setView('documents')}>My Documents</span>}
            {/* UPDATED: Scroll Links */}
            <span onClick={() => scrollToSection('scholarship-section')}>Scholarships</span>
            <span onClick={() => scrollToSection('scheme-section')}>Schemes</span>
          </div>
          <div className="nav-actions">
            {user ? (
               <div className="user-menu">
                 <span className="user-name">Hi, {user.displayName ? user.displayName.split(' ')[0] : 'User'}</span>
                 <button className="btn-logout" onClick={handleUserLogout}>Logout</button>
               </div>
            ) : (
               <button className="btn-orange-nav" onClick={handleStart} disabled={loading}>{loading ? "..." : "Sign Up"}</button>
            )}
          </div>
        </nav>
      )}

      {/* 1. LANDING PAGE */}
      {view === 'landing' && (
        <div className="landing">
          <header className="hero-section">
            <div className="hero-content">
              <span className="badge-pill">● All Government Schemes in One Place</span>
              <h1>जनसेवा</h1>
              <h2>सरकारी योजना और छात्रवृत्ति खोजें</h2>
              <p>Discover government schemes and scholarships tailored to your eligibility.</p>
              <div className="hero-btns">
                <button className="btn-white-hero" onClick={handleStart} disabled={loading}>{loading ? "Please Wait..." : "Check Your Eligibility →"}</button>
                {user && <button className="btn-outline-hero" onClick={() => setView('documents')}>Upload Documents</button>}
              </div>
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
                {/* UPDATED: Scroll Links in Footer */}
                <p onClick={() => scrollToSection('scholarship-section')} style={{cursor:'pointer'}}>Scholarships</p>
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
            <form onSubmit={checkEligibility}>
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
              <div className="input-group"><div><label>State</label><select name="state" onChange={handleInputChange}><option>Maharashtra</option><option>Delhi</option><option>UP</option><option>Other</option></select></div><div><label>Category</label><select name="category" onChange={handleInputChange}><option>General</option><option>OBC</option><option>SC</option><option>ST</option></select></div></div>
              
              {formData.role === 'Student' && (
                <div className="dynamic-box" style={{marginTop: '15px', padding: '10px', background: '#e0f2fe', borderRadius: '5px'}}>
                  <label>Education Level</label>
                  <select name="education" onChange={handleInputChange} style={{marginTop: '5px', width: '100%'}}>
                    <option>Class 12</option><option>Undergraduate</option><option>Postgraduate</option>
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
                <input name="income" type="number" onChange={handleInputChange} required />
              </div>
              <button type="submit" className="btn-orange-full" disabled={loading}>{loading ? "Analyzing..." : "Check My Eligibility"}</button>
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
  return (
    <Routes>
      <Route path="/" element={<UserPortal />} />
      <Route path="/admin" element={<AdminWrapper />} />
    </Routes>
  );
}

export default App;