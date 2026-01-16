import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import './App.css';

/**
 * Public scheme browsing page (no login required).
 * - Lists all active schemes
 * - Filter by dynamic category
 * - Search by keyword
 */
const PublicSchemesPage = () => {
  const [schemes, setSchemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { slug: categorySlugParam } = useParams();

  const urlParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  // Support both ?category=... and /category/:slug for SEO-friendly URLs
  const queryCategory = urlParams.get('category') || '';
  const activeCategory = categorySlugParam || queryCategory;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch schemes
        const schemesSnap = await getDocs(collection(db, 'schemes'));
        const list = schemesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSchemes(list);

        // Fetch categories controlling filters
        const catQuery = query(
          collection(db, 'schemeCategories'),
          orderBy('sortOrder', 'asc')
        );
        const catSnap = await getDocs(catQuery);
        const catList = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(catList.filter(c => c.isVisible !== false));
      } catch (err) {
        console.error('Error loading public schemes page:', err);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleCategoryChange = (slug) => {
    const params = new URLSearchParams(location.search);
    if (slug) params.set('category', slug);
    else params.delete('category');
    navigate(`/schemes?${params.toString()}`);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const filteredSchemes = useMemo(() => {
    return schemes
      .filter(s => (s.status || 'Draft') === 'Active')
      .filter(s => {
        if (!activeCategory) return true;
        const navCats = s.navCategories || [];
        return navCats.includes(activeCategory);
      })
      .filter(s => {
        if (!search.trim()) return true;
        const term = search.toLowerCase();
        return (
          (s.name && s.name.toLowerCase().includes(term)) ||
          (s.description && s.description.toLowerCase().includes(term)) ||
          (s.department && s.department.toLowerCase().includes(term))
        );
      });
  }, [schemes, activeCategory, search]);

  const openSchemeDetail = (schemeId) => {
    navigate(`/scheme/${schemeId}`);
  };

  return (
    <div className="public-page-container">
      <header className="public-page-hero">
        <h1>Government Schemes & Scholarships</h1>
        <p>Browse verified schemes without login. Filter by category and search instantly.</p>

        <div className="public-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by scheme name, department, or keyword"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="category-chips-row">
            <button
              type="button"
              className={`filter-chip ${!activeCategory ? 'active' : ''}`}
              onClick={() => handleCategoryChange('')}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`filter-chip ${activeCategory === (cat.slug || cat.id) ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat.slug || cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="public-schemes-grid">
        {loading && <p>Loading schemes...</p>}
        {!loading && !filteredSchemes.length && (
          <p>No schemes found. Try changing filters or search terms.</p>
        )}

        {!loading && filteredSchemes.map(s => (
          <article
            key={s.id}
            className="scheme-card"
            onClick={() => openSchemeDetail(s.id)}
          >
            <div className="scheme-card-header">
              <h3>{s.name}</h3>
              {s.targetRole && (
                <span className="scheme-tag">
                  {s.targetRole}
                </span>
              )}
            </div>
            {s.department && (
              <p className="scheme-meta">
                {s.department}
              </p>
            )}
            <p className="scheme-description">
              {s.description && s.description.length > 140
                ? `${s.description.substring(0, 140)}…`
                : s.description}
            </p>
            <div className="scheme-card-footer">
              <div className="scheme-footer-left">
                {s.benefitAmount && (
                  <span className="scheme-benefit">
                    {s.benefitAmount}
                  </span>
                )}
                {s.state && (
                  <span className="scheme-location">
                    {s.state}
                  </span>
                )}
              </div>
              <div className="scheme-footer-right">
                {s.deadline && (
                  <span className="scheme-deadline">
                    Deadline: {s.deadline}
                  </span>
                )}
                <button
                  type="button"
                  className="scheme-detail-cta"
                  onClick={(e) => {
                    e.stopPropagation();
                    openSchemeDetail(s.id);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
};

export default PublicSchemesPage;

