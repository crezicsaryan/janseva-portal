import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import './App.css';

/**
 * Public scheme detail page, accessible without login.
 * Uses Firestore document ID as route param.
 */
const SchemeDetailPage = () => {
  const { schemeId } = useParams();
  const navigate = useNavigate();
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScheme = async () => {
      if (!schemeId) return;
      setLoading(true);
      try {
        const ref = doc(db, 'schemes', schemeId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setScheme({ id: snap.id, ...snap.data() });
        } else {
          setScheme(null);
        }
      } catch (err) {
        console.error('Error loading scheme detail:', err);
      }
      setLoading(false);
    };

    fetchScheme();
  }, [schemeId]);

  if (loading) {
    return (
      <div className="public-page-container">
        <p>Loading scheme details…</p>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="public-page-container">
        <p>Scheme not found.</p>
        <button
          type="button"
          className="scheme-detail-cta"
          onClick={() => navigate('/schemes')}
        >
          Back to Schemes
        </button>
      </div>
    );
  }

  const {
    name,
    description,
    department,
    benefitAmount,
    link,
    documents,
    targetRole,
    incomeLimit,
    state,
    ageMin,
    ageMax,
    deadline,
  } = scheme;

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
        <h1>{name}</h1>
        <div className="scheme-detail-tags">
          {targetRole && <span className="scheme-tag">{targetRole}</span>}
          {state && <span className="scheme-location">{state}</span>}
        </div>
        {department && (
          <p className="scheme-meta">
            Department / Ministry: {department}
          </p>
        )}
      </header>

      <section className="scheme-detail-main">
        <div className="scheme-detail-body">
          <h2>Overview</h2>
          <p>{description}</p>

          <h2>Eligibility (Human Readable)</h2>
          <ul className="eligibility-list">
            {typeof ageMin !== 'undefined' && typeof ageMax !== 'undefined' && ageMin !== '' && ageMax !== '' && (
              <li>Age between {ageMin} and {ageMax} years</li>
            )}
            {incomeLimit && (
              <li>Annual family income up to ₹{incomeLimit}</li>
            )}
            {state && state !== 'All India' && (
              <li>Resident of {state}</li>
            )}
            {scheme.category && scheme.category !== 'All' && (
              <li>Caste category: {scheme.category}</li>
            )}
          </ul>

          {documents && documents.length > 0 && (
            <>
              <h2>Documents Commonly Required</h2>
              <ul className="documents-list">
                {documents.map((docName) => (
                  <li key={docName}>{docName}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="scheme-detail-sidebar">
          {benefitAmount && (
            <div className="benefit-box">
              <h3>Benefit</h3>
              <p>{benefitAmount}</p>
            </div>
          )}
          {deadline && (
            <div className="deadline-box">
              <h3>Deadline</h3>
              <p>{deadline}</p>
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
            onClick={() => navigate('/')}
          >
            Get Personalized Recommendations (Login Required)
          </button>
        </aside>
      </section>
    </div>
  );
};

export default SchemeDetailPage;

