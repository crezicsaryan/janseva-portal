import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';
import { db } from './firebase'; // We don't need auth here for hardcoded admin
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('add'); 
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    name: '', department: '', description: '', benefitAmount: '', link: '',
    targetRole: 'Student', incomeLimit: '', category: 'All', state: 'All India',
    ageMin: '', ageMax: '', documents: [], status: 'Draft', deadline: ''
  });

  const [customDoc, setCustomDoc] = useState('');

  const documentOptions = [
    "Income Certificate", "Caste Certificate", "Marksheet", 
    "Bonafide Certificate", "Land Record", "Age Proof", 
    "Bank Passbook", "Aadhaar Card (Ref)", "PAN Card"
  ];

  // --- FETCH SCHEMES ---
  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "schemes"));
      const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchemes(list);
    } catch (error) {
      console.error("Error fetching schemes:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'view') {
      fetchSchemes();
    }
  }, [activeTab]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDocCheckbox = (docName) => {
    let updatedDocs = [...formData.documents];
    if (updatedDocs.includes(docName)) {
      updatedDocs = updatedDocs.filter(d => d !== docName);
    } else {
      updatedDocs.push(docName);
    }
    setFormData({ ...formData, documents: updatedDocs });
  };

  const addCustomDoc = () => {
    if (customDoc.trim() !== "") {
      setFormData({ ...formData, documents: [...formData.documents, customDoc] });
      setCustomDoc("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.deadline) {
      alert("Please fill in required fields (Name, Description, Deadline)");
      return;
    }

    try {
      await addDoc(collection(db, "schemes"), {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      alert("Scheme Created Successfully!");
      setFormData({
        name: '', department: '', description: '', benefitAmount: '', link: '',
        targetRole: 'Student', incomeLimit: '', category: 'All', state: 'All India',
        ageMin: '', ageMax: '', documents: [], status: 'Draft', deadline: ''
      });
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to PERMANENTLY delete this scheme?")) {
      try {
        await deleteDoc(doc(db, "schemes", id));
        fetchSchemes(); 
      } catch (error) {
        alert("Error deleting: " + error.message);
      }
    }
  };

  const handleToggleStatus = async (scheme) => {
    const currentStatus = scheme.status || 'Draft';
    const newStatus = currentStatus === "Active" ? "Draft" : "Active";
    
    try {
      await updateDoc(doc(db, "schemes", scheme.id), { status: newStatus });
      fetchSchemes();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // --- NAVIGATION FIXES ---
  const goHome = () => {
    navigate('/'); // Redirects to Home Page
  };

  const handleLogout = () => {
    // Since this is a hardcoded admin, we just redirect home or reload
    if(window.confirm("Logout from Admin Panel?")) {
        navigate('/'); // Redirects to Home Page
        window.location.reload(); // Ensures state is cleared
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-left">
          {/* FIX 1: Home Button uses navigate */}
          <button className="home-btn" onClick={goHome}>🏠 Home</button>
          <h2>Admin Dashboard</h2>
        </div>
        {/* FIX 2: Logout Button uses handleLogout */}
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <div className="admin-tabs">
        <button className={activeTab === 'add' ? 'active-tab' : ''} onClick={() => setActiveTab('add')}>1️⃣ Add New Scheme</button>
        <button className={activeTab === 'view' ? 'active-tab' : ''} onClick={() => setActiveTab('view')}>2️⃣ View All Schemes</button>
      </div>

      {activeTab === 'add' && (
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-section">
            <h3>📝 Basic Scheme Information</h3>
            <div className="grid-2">
              <input type="text" name="name" placeholder="Scheme Name *" value={formData.name} onChange={handleChange} required />
              <input type="text" name="department" placeholder="Department / Ministry" value={formData.department} onChange={handleChange} />
            </div>
            <textarea name="description" placeholder="Description (Simple language) *" value={formData.description} onChange={handleChange} required />
            <div className="grid-2">
              <input type="text" name="benefitAmount" placeholder="Benefit Amount (e.g. ₹5000)" value={formData.benefitAmount} onChange={handleChange} />
              <input type="url" name="link" placeholder="Official Application Link" value={formData.link} onChange={handleChange} />
            </div>
          </div>

          <div className="form-section">
            <h3>🎯 Target & Eligibility</h3>
            <div className="grid-3">
              <select name="targetRole" value={formData.targetRole} onChange={handleChange}>
                <option value="Student">Student</option>
                <option value="Farmer">Farmer</option>
                <option value="Senior Citizen">Senior Citizen</option>
                <option value="Worker">Worker</option>
                <option value="General Citizen">General Citizen</option>
              </select>
              <input type="number" name="incomeLimit" placeholder="Max Income (₹)" value={formData.incomeLimit} onChange={handleChange} />
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="All">All Categories</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>
            <div className="grid-3">
              <input type="text" name="state" placeholder="State (e.g. All India)" value={formData.state} onChange={handleChange} />
              <input type="number" name="ageMin" placeholder="Min Age" value={formData.ageMin} onChange={handleChange} />
              <input type="number" name="ageMax" placeholder="Max Age" value={formData.ageMax} onChange={handleChange} />
            </div>
          </div>

          <div className="form-section">
            <h3>📄 Documents Required</h3>
            <div className="checkbox-grid">
              {documentOptions.map(doc => (
                <label key={doc} className="checkbox-label">
                  <input type="checkbox" checked={formData.documents.includes(doc)} onChange={() => handleDocCheckbox(doc)} />
                  {doc}
                </label>
              ))}
            </div>
            <div className="custom-doc">
              <input type="text" placeholder="Add Custom Document" value={customDoc} onChange={(e) => setCustomDoc(e.target.value)} />
              <button type="button" onClick={addCustomDoc}>➕ Add</button>
            </div>
            <small>Selected: {formData.documents.join(', ')}</small>
          </div>

          <div className="form-section">
            <h3>📅 Status & Deadline</h3>
            <div className="grid-2">
              <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} required />
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Draft">Draft (Hidden)</option>
                <option value="Active">Active (Visible)</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <button type="submit" className="submit-btn">✅ Publish Scheme</button>
        </form>
      )}

      {activeTab === 'view' && (
        <div className="schemes-list">
          <h3>All Schemes ({schemes.length})</h3>
          {loading ? <p>Loading...</p> : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Target</th><th>Deadline</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {schemes.map(sch => {
                    const safeStatus = sch.status || 'Draft';
                    return (
                      <tr key={sch.id} className={safeStatus === 'Draft' ? 'row-draft' : ''}>
                        <td>{sch.name || sch.title}</td>
                        <td>{sch.targetRole}</td>
                        <td>{sch.deadline}</td>
                        <td><span className={`status-badge ${safeStatus.toLowerCase()}`}>{safeStatus}</span></td>
                        <td>
                          <button onClick={() => handleToggleStatus(sch)} className="action-btn toggle">
                            {safeStatus === 'Active' ? '⏸ Disable' : '▶ Activate'}
                          </button>
                          <button onClick={() => handleDelete(sch.id)} className="action-btn delete">🗑️ Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;