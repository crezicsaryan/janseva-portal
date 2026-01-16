/**
 * Eligibility Checker Utility
 * Matches user profile with scholarship eligibility criteria
 */

/**
 * Check if user is eligible for a scholarship
 * @param {Object} userProfile - User profile data from Firestore
 * @param {Object} scholarship - Scholarship data from Firestore
 * @returns {boolean} - True if user is eligible
 */
export const checkEligibility = (userProfile, scholarship) => {
  // Basic validation
  if (!userProfile || !scholarship) return false;

  // IMPORTANT: First check if scholarship is active/live (admin approved)
  // This ensures only admin-approved scholarships are considered for eligibility
  if (scholarship.status !== 'live' && scholarship.status !== 'active') {
    return false;
  }

  // Check if scholarship is published
  if (scholarship.isPublished !== true) {
    return false;
  }

  // Check class eligibility
  if (scholarship.eligibleClasses && scholarship.eligibleClasses.length > 0) {
    if (!scholarship.eligibleClasses.includes(userProfile.class)) {
      return false;
    }
  }

  // Check category eligibility
  if (scholarship.eligibleCategories && scholarship.eligibleCategories.length > 0) {
    if (!scholarship.eligibleCategories.includes(userProfile.category)) {
      return false;
    }
  }

  // Check gender eligibility
  if (scholarship.eligibleGenders && scholarship.eligibleGenders.length > 0) {
    if (!scholarship.eligibleGenders.includes(userProfile.gender)) {
      return false;
    }
  }

  // Check state eligibility
  if (scholarship.eligibleStates && scholarship.eligibleStates.length > 0) {
    if (!scholarship.eligibleStates.includes(userProfile.state)) {
      return false;
    }
  }

  // Check religion eligibility
  if (scholarship.eligibleReligions && scholarship.eligibleReligions.length > 0) {
    if (!scholarship.eligibleReligions.includes(userProfile.religion)) {
      return false;
    }
  }

  // Check education level eligibility
  if (scholarship.eligibleEducationLevels && scholarship.eligibleEducationLevels.length > 0) {
    if (!scholarship.eligibleEducationLevels.includes(userProfile.educationLevel)) {
      return false;
    }
  }

  // Check income limit
  if (scholarship.incomeLimit && scholarship.incomeLimit > 0) {
    const userIncome = parseFloat(userProfile.annualIncome) || 0;
    if (userIncome > scholarship.incomeLimit) {
      return false;
    }
  }

  // All checks passed - user is eligible
  return true;
};

/**
 * Filter scholarships based on user profile
 * @param {Object} userProfile - User profile data
 * @param {Array} scholarships - Array of scholarship objects
 * @returns {Array} - Array of eligible scholarships
 */
export const getEligibleScholarships = (userProfile, scholarships) => {
  if (!userProfile || !Array.isArray(scholarships)) {
    return [];
  }

  return scholarships.filter(scholarship => checkEligibility(userProfile, scholarship));
};

/**
 * Get eligibility reasons for a scholarship (why user is NOT eligible)
 * @param {Object} userProfile - User profile data
 * @param {Object} scholarship - Scholarship data
 * @returns {Array} - Array of reasons for ineligibility
 */
export const getIneligibilityReasons = (userProfile, scholarship) => {
  const reasons = [];

  if (!userProfile || !scholarship) {
    reasons.push('Invalid data provided');
    return reasons;
  }

  // IMPORTANT: First check if scholarship is active/live (admin approved)
  if (scholarship.status !== 'live' && scholarship.status !== 'active') {
    reasons.push('Scholarship is not currently active or approved by admin');
  }
  
  if (scholarship.isPublished !== true) {
    reasons.push('Scholarship is not published');
  }

  // Check class eligibility
  if (scholarship.eligibleClasses && scholarship.eligibleClasses.length > 0) {
    if (!scholarship.eligibleClasses.includes(userProfile.class)) {
      reasons.push(`Class mismatch. Required: ${scholarship.eligibleClasses.join(', ')}`);
    }
  }

  // Check category eligibility
  if (scholarship.eligibleCategories && scholarship.eligibleCategories.length > 0) {
    if (!scholarship.eligibleCategories.includes(userProfile.category)) {
      reasons.push(`Category mismatch. Required: ${scholarship.eligibleCategories.join(', ')}`);
    }
  }

  // Check gender eligibility
  if (scholarship.eligibleGenders && scholarship.eligibleGenders.length > 0) {
    if (!scholarship.eligibleGenders.includes(userProfile.gender)) {
      reasons.push(`Gender mismatch. Required: ${scholarship.eligibleGenders.join(', ')}`);
    }
  }

  // Check state eligibility
  if (scholarship.eligibleStates && scholarship.eligibleStates.length > 0) {
    if (!scholarship.eligibleStates.includes(userProfile.state)) {
      reasons.push(`State mismatch. Required: ${scholarship.eligibleStates.join(', ')}`);
    }
  }

  // Check religion eligibility
  if (scholarship.eligibleReligions && scholarship.eligibleReligions.length > 0) {
    if (!scholarship.eligibleReligions.includes(userProfile.religion)) {
      reasons.push(`Religion mismatch. Required: ${scholarship.eligibleReligions.join(', ')}`);
    }
  }

  // Check education level eligibility
  if (scholarship.eligibleEducationLevels && scholarship.eligibleEducationLevels.length > 0) {
    if (!scholarship.eligibleEducationLevels.includes(userProfile.educationLevel)) {
      reasons.push(`Education level mismatch. Required: ${scholarship.eligibleEducationLevels.join(', ')}`);
    }
  }

  // Check income limit
  if (scholarship.incomeLimit && scholarship.incomeLimit > 0) {
    const userIncome = parseFloat(userProfile.annualIncome) || 0;
    if (userIncome > scholarship.incomeLimit) {
      reasons.push(`Income exceeds limit. Maximum: ₹${scholarship.incomeLimit.toLocaleString('en-IN')}`);
    }
  }

  return reasons;
};
