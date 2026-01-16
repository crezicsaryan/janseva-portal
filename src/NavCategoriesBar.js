import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import './App.css';

/**
 * Lightweight, read-only navbar extension that shows
 * dynamic scheme categories fetched from Firestore.
 *
 * It does NOT replace your existing navbar – it simply
 * renders a slim category strip below it.
 */
const NavCategoriesBar = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'schemeCategories'),
          orderBy('sortOrder', 'asc')
        );
        const snapshot = await getDocs(q);
        const visible = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(cat => cat.isVisible !== false); // default visible
        setCategories(visible);
      } catch (err) {
        console.error('Error fetching categories for navbar:', err);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  const handleClickCategory = (slug) => {
    // Route user to public schemes page filtered by this category
    const params = new URLSearchParams(location.search);
    if (slug) params.set('category', slug);
    else params.delete('category');
    navigate(`/schemes?${params.toString()}`);
  };

  if (loading && categories.length === 0) {
    return null;
  }

  if (!categories.length) {
    return null;
  }

  return (
    <div className="nav-categories-strip">
      <div className="nav-categories-inner">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className="nav-category-chip"
            onClick={() => handleClickCategory(cat.slug || cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NavCategoriesBar;

