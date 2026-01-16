import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import './AdminPanel.css';

/**
 * Admin-only Category Manager
 * - Create / edit / delete categories
 * - Control visibility and navbar order (sortOrder)
 */
const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    isVisible: true,
    sortOrder: 0,
  });
  const [editingId, setEditingId] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'schemeCategories'),
        orderBy('sortOrder', 'asc')
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(list);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      slug: '',
      description: '',
      isVisible: true,
      sortOrder: categories.length,
    });
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'sortOrder'
          ? parseInt(value || '0', 10)
          : value,
    }));
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      isVisible: cat.isVisible !== false,
      sortOrder: typeof cat.sortOrder === 'number' ? cat.sortOrder : 0,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? (Schemes remain but lose this tag)')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'schemeCategories', id));
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Name is required');
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: (form.slug || form.name)
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, ''),
      description: form.description,
      isVisible: form.isVisible,
      sortOrder:
        typeof form.sortOrder === 'number' ? form.sortOrder : categories.length,
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'schemeCategories', editingId), payload);
      } else {
        await addDoc(collection(db, 'schemeCategories'), payload);
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Error saving category');
    }
  };

  const moveCategory = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= categories.length) return;
    const updated = [...categories];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);

    // Reassign sortOrder sequentially
    try {
      await Promise.all(
        updated.map((cat, idx) =>
          updateDoc(doc(db, 'schemeCategories', cat.id), { sortOrder: idx })
        )
      );
      fetchCategories();
    } catch (err) {
      console.error('Error reordering categories:', err);
    }
  };

  return (
    <div className="admin-category-manager">
      <h3>📂 Scheme Category Manager</h3>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-section">
          <h4>{editingId ? 'Edit Category' : 'Add New Category'}</h4>
          <div className="grid-2">
            <input
              type="text"
              name="name"
              placeholder="Category Name (e.g. Scholarships)"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="slug"
              placeholder="Slug (auto from name if empty)"
              value={form.slug}
              onChange={handleChange}
            />
          </div>
          <textarea
            name="description"
            placeholder="Short description (optional)"
            value={form.description}
            onChange={handleChange}
          />
          <div className="grid-2">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isVisible"
                checked={form.isVisible}
                onChange={handleChange}
              />
              Visible on main website
            </label>
            <input
              type="number"
              name="sortOrder"
              placeholder="Navbar order (0,1,2...)"
              value={form.sortOrder}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="submit-btn">
            {editingId ? 'Save Changes' : 'Create Category'}
          </button>
          {editingId && (
            <button
              type="button"
              className="action-btn"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="schemes-list">
        <h4>All Categories ({categories.length})</h4>
        {loading ? (
          <p>Loading categories…</p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Visible</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, index) => (
                  <tr key={cat.id}>
                    <td>{cat.sortOrder}</td>
                    <td>{cat.name}</td>
                    <td>{cat.slug}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          cat.isVisible !== false ? 'active' : 'draft'
                        }`}
                      >
                        {cat.isVisible !== false ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => moveCategory(index, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => moveCategory(index, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="action-btn toggle"
                        onClick={() => handleEdit(cat)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="action-btn delete"
                        onClick={() => handleDelete(cat.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManager;

