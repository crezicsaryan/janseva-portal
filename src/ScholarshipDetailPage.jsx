import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import './App.css';

/**
 * Scholarship detail page, accessible without login.
 * Shows complete details of a single scholarship.
 */
const ScholarshipDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScholarship = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const ref = doc(db, 'scholarships', id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setScholarship({ id: snap.id, ...snap.data() });
        } else {
          setScholarship(null);
        }
      } catch (err) {
        console.error('Error loading scholarship detail:', err);
      }
      setLoading(false);
    };

    fetchScholarship();
  }, [id]);

  if (loading) {
    return (
      <div className="public-page-container">
        <p>Loading scholarship details…</p>
      </div>
    );
  }

  if (!scholarship) {
    return (
      <div className="public-page-container">
        <p>Scholarship not found.</p>
        <button
          type="button"
          className="scheme-detail-cta"
          onClick={() => navigate('/scholarships')}
        >
          Back to Scholarships
        </button>
      </div>
    );
  }

  const {
    title,
    description,
    eligibility,
    award,
    class: classLevel,
    category,
    gender,
    state,
    religion,
    course,
    studyLevel,
    deadline,
    imageUrl,
    link,
    lastUpdated,
  } = scholarship;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="public-page-container scheme-detail-layout">
      <button
        type="button"
        className="back-link"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <header className="scheme-detail-header">
        {imageUrl && (
          <div className="scholarship-detail-image">
            <img
              src={imageUrl}
              alt={title || 'Scholarship'}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        <h1>{title || 'Scholarship'}</h1>
        <div className="scheme-detail-tags">
          {category && <span className="scheme-tag">{category}</span>}
          {state && state !== 'All India' && <span className="scheme-location">{state}</span>}
          {scholarship.isFeatured && <span className="scholarship-featured-tag">Featured</span>}
        </div>
      </header>

      <section className="scheme-detail-main">
        <div className="scheme-detail-body">
          {description && (
            <>
              <h2>Overview</h2>
              <p>{description}</p>
            </>
          )}

          {eligibility && (
            <>
              <h2>Eligibility</h2>
              {typeof eligibility === 'string' ? (
                <p>{eligibility}</p>
              ) : Array.isArray(eligibility) ? (
                <ul className="eligibility-list">
                  {eligibility.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>{JSON.stringify(eligibility)}</p>
              )}
            </>
          )}

          <h2>Details</h2>
          <ul className="eligibility-list">
            {classLevel && (
              <li>
                <strong>Class:</strong>{' '}
                {Array.isArray(classLevel) ? classLevel.join(', ') : classLevel}
              </li>
            )}
            {category && <li><strong>Category:</strong> {category}</li>}
            {gender && gender !== 'All' && <li><strong>Gender:</strong> {gender}</li>}
            {state && state !== 'All India' && <li><strong>State:</strong> {state}</li>}
            {religion && religion !== 'All' && <li><strong>Religion/Minority:</strong> {religion}</li>}
            {course && course !== 'All' && <li><strong>Course:</strong> {course}</li>}
            {studyLevel && studyLevel !== 'All' && <li><strong>Study Level:</strong> {studyLevel}</li>}
          </ul>
        </div>

        <aside className="scheme-detail-sidebar">
          {award && (
            <div className="benefit-box">
              <h3>Award / Benefit</h3>
              <p>{award}</p>
            </div>
          )}
          {deadline && (
            <div className="deadline-box">
              <h3>Deadline</h3>
              <p>{formatDate(deadline)}</p>
            </div>
          )}
          {lastUpdated && (
            <div className="deadline-box" style={{ background: '#f0f9ff', color: '#0369a1' }}>
              <h3>Last Updated</h3>
              <p>{formatDate(lastUpdated)}</p>
            </div>
          )}
          {link && (
            <a
              className="apply-primary-btn"
              href={link}
              target="_blank"
              rel="noreferrer"
            >
              Apply on Official Website
            </a>
          )}
          <button
            type="button"
            className="secondary-cta"
            onClick={() => navigate('/scholarships')}
          >
            Browse More Scholarships
          </button>
        </aside>
      </section>
    </div>
  );
};

export default ScholarshipDetailPage;
