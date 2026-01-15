import React, { useState } from 'react';
import './AdminPanel.css'; // Ensure you have this CSS file, or remove this line if not needed
import { db } from './firebase'; 
import { collection, addDoc } from 'firebase/firestore'; 

const AdminSchemes = () => {
  // STATE: Holds form data
  const [scheme, setScheme] = useState({
    title: '',
    description: '',
    link: '',
    deadline: ''
  });

  // HANDLE CHANGE: Updates state when you type
  const handleChange = (e) => {
    setScheme({ ...scheme, [e.target.name]: e.target.value });
  };

  // SUBMIT: Sends data to Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Debugging: Check console to see if data is present before sending
    console.log("Submitting Scheme Data:", scheme); 

    try {
      // Create the document in 'schemes' collection
      await addDoc(collection(db, "schemes"), {
        title: scheme.title,
        description: scheme.description,
        link: scheme.link,
        deadline: scheme.deadline,
        createdAt: new Date()
      });

      alert("Scheme Added Successfully!");
      // Clear form after success
      setScheme({ title: '', description: '', link: '', deadline: '' }); 
      
    } catch (error) {
      console.error("Error adding scheme: ", error);
      alert("Error adding scheme: " + error.message);
    }
  };

  return (
    <div className="admin-scheme-container">
      <h2>Post New Scholarship / Scheme</h2>
      
      <form onSubmit={handleSubmit} className="admin-form">
        
        {/* Title Input */}
        <div className="form-group">
          <label>Scheme Title</label>
          <input 
            type="text" 
            name="title" 
            placeholder="e.g. National Scholarship 2026" 
            value={scheme.title} 
            onChange={handleChange} 
            required 
          />
        </div>

        {/* Description Input */}
        <div className="form-group">
          <label>Description</label>
          <textarea 
            name="description" 
            placeholder="Enter scheme details here..." 
            value={scheme.description} 
            onChange={handleChange} 
            required 
          />
        </div>

        {/* Link Input */}
        <div className="form-group">
          <label>Application Link</label>
          <input 
            type="url" 
            name="link" 
            placeholder="https://..." 
            value={scheme.link} 
            onChange={handleChange} 
            required 
          />
        </div>

        {/* Deadline Input */}
        <div className="form-group">
          <label>Deadline Date</label>
          <input 
            type="date" 
            name="deadline" 
            value={scheme.deadline} 
            onChange={handleChange} 
            required 
          />
        </div>

        <button type="submit" className="submit-btn">Publish Scheme</button>
      </form>
    </div>
  );
};

export default AdminSchemes;