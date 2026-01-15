import React, { useState } from 'react';
import { auth } from './firebase'; 
import './App.css'; 

const MyDocuments = ({ onBack }) => {
  const user = auth.currentUser;
  
  // ⚠️ REPLACE THESE WITH YOUR CLOUDINARY DETAILS
  const CLOUD_NAME = "djujs1suh"; 
  const UPLOAD_PRESET = "janseva_upload"; 

  const folders = [
    { id: '10th', name: '10th Marksheet' },
    { id: '12th', name: '12th Marksheet' },
    { id: 'aadhaar', name: 'Aadhaar Card' },
    { id: 'pan', name: 'PAN Card' },
    { id: 'bonafide', name: 'Bonafide Certificate' },
    { id: 'income', name: 'Income Certificate' },
    { id: 'caste', name: 'Caste Certificate' },
    { id: 'bank', name: 'Bank Passbook' },
    { id: 'other', name: 'Other Documents' }
  ];

  const [uploading, setUploading] = useState({}); 
  const [files, setFiles] = useState({}); 

  const handleUpload = async (file, folderId) => {
    if (!user) { alert("Please login first!"); return; }
    if (!file) return;

    setUploading(prev => ({ ...prev, [folderId]: true }));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", `janseva_users/${user.uid}/${folderId}`); // Organize in folders

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (data.secure_url) {
        setFiles(prev => ({ ...prev, [folderId]: { name: file.name, url: data.secure_url } }));
        alert("Uploaded successfully to Cloudinary!");
      } else {
        throw new Error("Cloudinary upload failed");
      }

    } catch (error) {
      console.error(error);
      alert("Upload failed. Check your Cloudinary config.");
    }
    setUploading(prev => ({ ...prev, [folderId]: false }));
  };

  return (
    <div className="section-container">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
        <button onClick={onBack} className="btn-edit">← Back Home</button>
        <h2>My Digital Documents (Cloud)</h2>
      </div>

      <div className="cards-grid">
        {folders.map(folder => (
          <div key={folder.id} className="category-card" style={{border: '2px dashed #ccc', textAlign:'center'}}>
            <div className="icon-box blue" style={{margin:'0 auto 15px'}}>
               {files[folder.id] ? '✅' : '📁'}
            </div>
            <h4>{folder.name}</h4>
            
            {files[folder.id] ? (
               <div>
                 <p style={{fontSize:'0.8rem', wordBreak: 'break-all'}}>{files[folder.id].name}</p>
                 <a href={files[folder.id].url} target="_blank" rel="noreferrer" style={{color:'green'}}>View Document</a>
               </div>
            ) : (
               <div>
                 {uploading[folder.id] ? <span>Uploading...</span> : (
                   <label style={{cursor:'pointer', color:'#2563EB', fontWeight:'bold'}}>
                     Upload File
                     <input type="file" hidden onChange={(e) => handleUpload(e.target.files[0], folder.id)} />
                   </label>
                 )}
               </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyDocuments;