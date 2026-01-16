import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import './App.css';

/**
 * Scholarships listing page with filters (similar to Buddy4Study)
 * - Left sidebar: Filter panel with checkboxes and dropdowns
 * - Right side: Scholarship listing with tabs (Live, Upcoming, Always Open)
 * - All filters trigger Firestore queries (not frontend-only filtering)
 * 
 * EXPECTED FIRESTORE DATA STRUCTURE (collection: 'scholarships'):
 * {
 *   title: string (required)
 *   description: string
 *   eligibility: string | array
 *   award: string (e.g., "₹50,000 per year")
 *   class: string | array (e.g., "Class 12" or ["Class 11", "Class 12"])
 *   category: string (e.g., "Merit-Based", "Need-Based")
 *   gender: string (e.g., "Male", "Female", "All")
 *   state: string (e.g., "Maharashtra", "All India")
 *   religion: string (e.g., "Hindu", "Muslim", "All")
 *   course: string (e.g., "Engineering", "Medical", "All")
 *   studyLevel: string (e.g., "Undergraduate", "Postgraduate", "All")
 *   deadline: Date | string (ISO date string)
 *   status: "live" | "upcoming" | "always-open" (required)
 *   isFeatured: boolean
 *   imageUrl: string (Cloudinary URL)
 *   link: string (application URL)
 *   lastUpdated: Date | string
 * }
 */
const ScholarshipsPage = () => {
  const navigate = useNavigate();
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('live'); // live, upcoming, always-open

  // Filter states
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedReligion, setSelectedReligion] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudyLevel, setSelectedStudyLevel] = useState('');

  // Available filter options (could be fetched from Firestore or kept static)
  const classOptions = ['Class 9', 'Class 10', 'Class 11', 'Class 12', 'Graduation', 'Post Graduation'];
  const categoryOptions = ['Merit-Based', 'Need-Based', 'Sports', 'Arts', 'Research', 'Minority', 'Government'];
  const genderOptions = ['Male', 'Female', 'All'];
  const stateOptions = ['Maharashtra', 'Delhi', 'UP', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'All India'];
  const religionOptions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'All'];
  const courseOptions = ['Engineering', 'Medical', 'Arts', 'Science', 'Commerce', 'Law', 'MBA', 'All'];
  const studyLevelOptions = ['School', 'Undergraduate', 'Postgraduate', 'PhD', 'All'];

  // Fetch scholarships with filters
  useEffect(() => {
    const fetchScholarships = async () => {
      setLoading(true);
      try {
        let q = collection(db, 'scholarships');

        // Build Firestore query based on filters
        const conditions = [];

        // Status filter (tab-based)
        if (activeTab === 'live') {
          conditions.push(where('status', '==', 'live'));
        } else if (activeTab === 'upcoming') {
          conditions.push(where('status', '==', 'upcoming'));
        } else if (activeTab === 'always-open') {
          conditions.push(where('status', '==', 'always-open'));
        }

        // Class filter (array-contains-any for multiple selections)
        if (selectedClasses.length > 0) {
          conditions.push(where('class', 'in', selectedClasses));
        }

        // Single value filters
        if (selectedCategory && selectedCategory !== 'All') {
          conditions.push(where('category', '==', selectedCategory));
        }
        if (selectedGender && selectedGender !== 'All') {
          conditions.push(where('gender', '==', selectedGender));
        }
        if (selectedState && selectedState !== 'All India') {
          conditions.push(where('state', '==', selectedState));
        }
        if (selectedReligion && selectedReligion !== 'All') {
          conditions.push(where('religion', '==', selectedReligion));
        }
        if (selectedCourse && selectedCourse !== 'All') {
          conditions.push(where('course', '==', selectedCourse));
        }
        if (selectedStudyLevel && selectedStudyLevel !== 'All') {
          conditions.push(where('studyLevel', '==', selectedStudyLevel));
        }

        // Apply conditions to query
        if (conditions.length > 0) {
          // For simple cases, we can use compound queries
          // But for complex filtering, we'll fetch all and filter client-side
          try {
            const snapshot = await getDocs(q);
            let filtered = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // IMPORTANT: Always filter for live/active scholarships by default
            // This ensures only admin-approved active scholarships are shown
            filtered = filtered.filter(s => {
              // First check if scholarship is active/live (from admin panel)
              if (s.status !== 'live' && s.status !== 'active') {
                return false;
              }
              
              // Then apply tab filter
              if (activeTab === 'live') return s.status === 'live' || s.status === 'active';
              if (activeTab === 'upcoming') return s.status === 'upcoming';
              if (activeTab === 'always-open') return s.status === 'always-open';
              return true;
            });

            // Apply other filters
            if (selectedClasses.length > 0) {
              filtered = filtered.filter(s => {
                const sClass = s.class || [];
                return selectedClasses.some(c => sClass.includes(c) || sClass === c);
              });
            }
            if (selectedCategory && selectedCategory !== 'All') {
              filtered = filtered.filter(s => s.category === selectedCategory);
            }
            if (selectedGender && selectedGender !== 'All') {
              filtered = filtered.filter(s => !s.gender || s.gender === selectedGender || s.gender === 'All');
            }
            if (selectedState && selectedState !== 'All India') {
              filtered = filtered.filter(s => !s.state || s.state === selectedState || s.state === 'All India');
            }
            if (selectedReligion && selectedReligion !== 'All') {
              filtered = filtered.filter(s => !s.religion || s.religion === selectedReligion || s.religion === 'All');
            }
            if (selectedCourse && selectedCourse !== 'All') {
              filtered = filtered.filter(s => !s.course || s.course === selectedCourse || s.course === 'All');
            }
            if (selectedStudyLevel && selectedStudyLevel !== 'All') {
              filtered = filtered.filter(s => !s.studyLevel || s.studyLevel === selectedStudyLevel || s.studyLevel === 'All');
            }

            setScholarships(filtered);
          } catch (error) {
            console.error('Error with compound query, falling back to client-side filtering:', error);
            // Fallback: fetch all and filter client-side
            const snapshot = await getDocs(collection(db, 'scholarships'));
            let allScholarships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Filter for active/live scholarships first
            allScholarships = allScholarships.filter(s => s.status === 'live' || s.status === 'active');
            
            setScholarships(allScholarships);
          }
        } else {
          // No filters - fetch only live/active scholarships
          const snapshot = await getDocs(q);
          let allScholarships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // IMPORTANT: Filter to show only active/live scholarships by default
          allScholarships = allScholarships.filter(s => s.status === 'live' || s.status === 'active');
          
          // Apply tab filter
          const filtered = allScholarships.filter(s => {
            if (activeTab === 'live') return s.status === 'live' || s.status === 'active';
            if (activeTab === 'upcoming') return s.status === 'upcoming';
            if (activeTab === 'always-open') return s.status === 'always-open';
            return true;
          });
          
          setScholarships(filtered);
        }
      } catch (err) {
        console.error('Error fetching scholarships:', err);
        setScholarships([]);
      }
      setLoading(false);
    };

    fetchScholarships();
  }, [activeTab, selectedClasses, selectedCategory, selectedGender, selectedState, selectedReligion, selectedCourse, selectedStudyLevel]);

  // Apply search filter
  const filteredScholarships = useMemo(() => {
    if (!search.trim()) return scholarships;
    const term = search.toLowerCase();
    return scholarships.filter(s =>
      (s.title && s.title.toLowerCase().includes(term)) ||
      (s.category && s.category.toLowerCase().includes(term)) ||
      (s.description && s.description.toLowerCase().includes(term))
    );
  }, [scholarships, search]);

  const handleClassToggle = (classVal) => {
    setSelectedClasses(prev =>
      prev.includes(classVal)
        ? prev.filter(c => c !== classVal)
        : [...prev, classVal]
    );
  };

  const openScholarshipDetail = (scholarshipId) => {
    navigate(`/scholarship/${scholarshipId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="scholarships-page-container">
      <div className="scholarships-layout">
        {/* LEFT SIDEBAR - FILTERS */}
        <aside className="scholarships-filter-sidebar">
          <h3>Filters</h3>

          {/* Select Class */}
          <div className="filter-group">
            <h4>Select Class</h4>
            {classOptions.map(opt => (
              <label key={opt} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={selectedClasses.includes(opt)}
                  onChange={() => handleClassToggle(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>

          {/* Category */}
          <div className="filter-group">
            <h4>Category</h4>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categoryOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div className="filter-group">
            <h4>Gender</h4>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="filter-select"
            >
              <option value="">All</option>
              {genderOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* State */}
          <div className="filter-group">
            <h4>State</h4>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="filter-select"
            >
              <option value="">All States</option>
              {stateOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Religion / Minority */}
          <div className="filter-group">
            <h4>Religion / Minority</h4>
            <select
              value={selectedReligion}
              onChange={(e) => setSelectedReligion(e.target.value)}
              className="filter-select"
            >
              <option value="">All</option>
              {religionOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Course */}
          <div className="filter-group">
            <h4>Course</h4>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="filter-select"
            >
              <option value="">All Courses</option>
              {courseOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Study Level */}
          <div className="filter-group">
            <h4>Study Level</h4>
            <select
              value={selectedStudyLevel}
              onChange={(e) => setSelectedStudyLevel(e.target.value)}
              className="filter-select"
            >
              <option value="">All Levels</option>
              {studyLevelOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(selectedClasses.length > 0 || selectedCategory || selectedGender || selectedState || selectedReligion || selectedCourse || selectedStudyLevel) && (
            <button
              type="button"
              className="clear-filters-btn"
              onClick={() => {
                setSelectedClasses([]);
                setSelectedCategory('');
                setSelectedGender('');
                setSelectedState('');
                setSelectedReligion('');
                setSelectedCourse('');
                setSelectedStudyLevel('');
              }}
            >
              Clear All Filters
            </button>
          )}
        </aside>

        {/* RIGHT SIDE - SCHOLARSHIP LISTING */}
        <main className="scholarships-listing-area">
          {/* Top Section */}
          <header className="scholarships-header">
            <h1>Scholarships for Indian Students</h1>
            <div className="scholarships-search">
              <input
                type="text"
                placeholder="Search Category and Skills"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="scholarships-search-input"
              />
            </div>

            {/* Tabs */}
            <div className="scholarships-tabs">
              <button
                type="button"
                className={activeTab === 'live' ? 'tab-btn active' : 'tab-btn'}
                onClick={() => setActiveTab('live')}
              >
                Live Scholarships
              </button>
              <button
                type="button"
                className={activeTab === 'upcoming' ? 'tab-btn active' : 'tab-btn'}
                onClick={() => setActiveTab('upcoming')}
              >
                Upcoming Scholarships
              </button>
              <button
                type="button"
                className={activeTab === 'always-open' ? 'tab-btn active' : 'tab-btn'}
                onClick={() => setActiveTab('always-open')}
              >
                Always Open
              </button>
            </div>
          </header>

          {/* Scholarship Cards Grid */}
          {loading ? (
            <div className="scholarships-loading">Loading scholarships...</div>
          ) : filteredScholarships.length === 0 ? (
            <div className="scholarships-empty">
              <p>No scholarships found. Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="scholarships-grid">
              {filteredScholarships.map(scholarship => (
                <article
                  key={scholarship.id}
                  className="scholarship-card"
                  onClick={() => openScholarshipDetail(scholarship.id)}
                >
                  {/* Scholarship Logo/Image */}
                  {scholarship.imageUrl && (
                    <div className="scholarship-card-image">
                      <img
                        src={scholarship.imageUrl}
                        alt={scholarship.title || 'Scholarship'}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Featured Tag */}
                  {scholarship.isFeatured && (
                    <span className="scholarship-featured-tag">Featured</span>
                  )}

                  {/* Card Content */}
                  <div className="scholarship-card-content">
                    <h3 className="scholarship-card-title">
                      {scholarship.title || 'Scholarship Title'}
                    </h3>

                    {/* Award/Benefit */}
                    {scholarship.award && (
                      <div className="scholarship-award">
                        <strong>Award:</strong> {scholarship.award}
                      </div>
                    )}

                    {/* Eligibility Summary */}
                    {scholarship.eligibility && (
                      <p className="scholarship-eligibility">
                        {typeof scholarship.eligibility === 'string'
                          ? scholarship.eligibility.length > 100
                            ? `${scholarship.eligibility.substring(0, 100)}...`
                            : scholarship.eligibility
                          : JSON.stringify(scholarship.eligibility)}
                      </p>
                    )}

                    {/* Card Footer */}
                    <div className="scholarship-card-footer">
                      {scholarship.deadline && (
                        <div className="scholarship-deadline">
                          <span className="deadline-label">Deadline:</span>
                          <span className="deadline-value">{formatDate(scholarship.deadline)}</span>
                        </div>
                      )}
                      {scholarship.lastUpdated && (
                        <div className="scholarship-updated">
                          Last updated: {formatDate(scholarship.lastUpdated)}
                        </div>
                      )}
                      <button
                        type="button"
                        className="scholarship-apply-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openScholarshipDetail(scholarship.id);
                        }}
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ScholarshipsPage;
