import React, { useState } from 'react';
import { db } from '../firebase'; // Adjust path if needed (e.g., './firebase')
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const EligibilityCheck = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [matchedSchemes, setMatchedSchemes] = useState(null); // null means "hasn't checked yet"
  
  // User Inputs
  const [userData, setUserData] = useState({
    role: 'Student',
    income: '',
    age: '',
    category: 'General'
  });

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const checkEligibility = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMatchedSchemes([]); // Reset previous results

    try {
      // 1. Fetch ALL schemes from Firebase
      const querySnapshot = await getDocs(collection(db, "schemes"));
      const allSchemes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. Filter logic
      const results = allSchemes.filter(scheme => {
        // --- Status Check ---
        if (scheme.status === 'Draft' || scheme.status === 'Expired') return false;

        // --- Role Check ---
        // If scheme is for "General Citizen", everyone qualifies. Otherwise, roles must match.
        const roleMatches = scheme.targetRole === 'General Citizen' || scheme.targetRole === userData.role;

        // --- Income Check ---
        // User's income must be LOWER than the limit. (If limit is missing, assume no limit)
        const incomeLimit = scheme.incomeLimit ? parseInt(scheme.incomeLimit) : 999999999;
        const userIncome = userData.income ? parseInt(userData.income) : 0;
        const incomeMatches = userIncome <= incomeLimit;

        // --- Age Check ---
        const userAge = userData.age ? parseInt(userData.age) : 0;
        const minAge = scheme.ageMin ? parseInt(scheme.ageMin) : 0;
        const maxAge = scheme.ageMax ? parseInt(scheme.ageMax) : 100;
        const ageMatches = userAge >= minAge && userAge <= maxAge;

        return roleMatches && incomeMatches && ageMatches;
      });

      setMatchedSchemes(results);

    } catch (error) {
      console.error("Error checking eligibility:", error);
      alert("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/')} style={styles.homeBtn}>🏠 Home</button>
        <h2>Check Your Eligibility</h2>
      </div>

      {/* FORM SECTION */}
      <form onSubmit={checkEligibility} style={styles.form}>
        <div style={styles.inputGroup}>
          <label>Who are you?</label>
          <select name="role" value={userData.role} onChange={handleChange} style={styles.input}>
            <option value="Student">Student</option>
            <option value="Farmer">Farmer</option>
            <option value="Senior Citizen">Senior Citizen</option>
            <option value="Worker">Worker</option>
            <option value="General Citizen">General Citizen</option>
          </select>
        </div>

        <div style={styles.inputGroup}>
          <label>Annual Family Income (₹)</label>
          <input 
            type="number" 
            name="income" 
            placeholder="e.g. 150000" 
            value={userData.income} 
            onChange={handleChange} 
            required 
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label>Your Age</label>
          <input 
            type="number" 
            name="age" 
            placeholder="e.g. 21" 
            value={userData.age} 
            onChange={handleChange} 
            required 
            style={styles.input}
          />
        </div>

        <button type="submit" style={styles.checkBtn} disabled={loading}>
          {loading ? 'Checking...' : '🔍 Find Schemes'}
        </button>
      </form>

      {/* RESULTS SECTION */}
      {matchedSchemes !== null && (
        <div style={styles.results}>
          <h3>
            {matchedSchemes.length > 0 
              ? `🎉 We found ${matchedSchemes.length} schemes for you!` 
              : "❌ No matching schemes found based on your details."}
          </h3>

          <div style={styles.grid}>
            {matchedSchemes.map(scheme => (
              <div key={scheme.id} style={styles.card}>
                <h4 style={{margin: '0 0 10px 0', color: '#007bff'}}>{scheme.name || scheme.title}</h4>
                <p style={{fontSize: '0.9em', color: '#555'}}>{scheme.department}</p>
                <p><strong>Benefit:</strong> {scheme.benefitAmount || 'N/A'}</p>
                <a href={scheme.link} target="_blank" rel="noreferrer">
                  <button style={styles.applyBtn}>View Details</button>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Simple CSS-in-JS styles
const styles = {
  container: { maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'Arial, sans-serif' },
  header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' },
  homeBtn: { padding: '8px 12px', cursor: 'pointer', background: '#eee', border: 'none', borderRadius: '5px' },
  form: { background: '#f9f9f9', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  inputGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' },
  checkBtn: { width: '100%', padding: '12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', marginTop: '10px' },
  results: { marginTop: '30px' },
  grid: { display: 'grid', gap: '15px', marginTop: '15px' },
  card: { padding: '15px', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', background: '#fff' },
  applyBtn: { padding: '8px 15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }
};

export default EligibilityCheck;