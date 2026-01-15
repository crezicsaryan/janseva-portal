import React, { useEffect, useState } from 'react';
import { db } from '../firebase'; // Adjust path if needed (e.g. '../firebase' or './firebase')
import { collection, getDocs } from 'firebase/firestore';

const SchemesPage = () => {
  const [schemes, setSchemes] = useState([]);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "schemes"));
        const schemesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSchemes(schemesList);
      } catch (error) {
        console.error("Error fetching schemes:", error);
      }
    };

    fetchSchemes();
  }, []);

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}>Available Schemes</h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        {schemes.map((item) => (
          <div key={item.id} style={{ 
            border: "1px solid #eee", 
            borderRadius: "10px", 
            padding: "20px", 
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            backgroundColor: "#fff"
          }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#007bff" }}>{item.title}</h3>
            <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "5px" }}><strong>Dept:</strong> {item.department}</p>
            <p style={{ color: "#444", margin: "10px 0" }}>{item.description}</p>
            <p style={{ fontWeight: "bold", color: "#28a745" }}>Amount: ₹{item.amount}</p>
            <p style={{ fontSize: "0.9rem", color: "#d9534f" }}>Deadline: {item.deadline}</p>
            
            <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <button style={{
                marginTop: "15px",
                width: "100%",
                padding: "10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}>
                Apply Now
              </button>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchemesPage;


