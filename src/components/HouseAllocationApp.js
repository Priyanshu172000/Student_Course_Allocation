import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import AlgorithmComparison from './Comparison/AlgorithmComparison';
import './HouseAllocationApp.css';

const HouseAllocationApp = () => {
  const [students, setStudents] = useState(2);
  const [courses, setCourses] = useState(3);
  const [prefLength, setPrefLength] = useState(2);
  const [courseCapacities, setCourseCapacities] = useState({});
  const [preferences, setPreferences] = useState({});
  const [allocation, setAllocation] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAllocationAnimation, setShowAllocationAnimation] = useState(false);
  const [fileError, setFileError] = useState('');

  // Initialize course capacities when number of courses changes
  useEffect(() => {
    const newCapacities = {};
    for (let i = 1; i <= courses; i++) {
      newCapacities[i] = courseCapacities[i] || 1; // Default to 1 seat if not set
    }
    setCourseCapacities(newCapacities);
  }, [courses]);

  // Handle course capacity changes
  const handleCapacityChange = (courseId, capacity) => {
    setCourseCapacities(prev => ({
      ...prev,
      [courseId]: Math.max(1, parseInt(capacity) || 1)
    }));
  };

  // Reset preferences when params change
//   useEffect(() => {
//     setPreferences({});
//     setAllocation(null);
//     setError('');
//   }, [students, courses, prefLength]);

  // Handle changes to preference values
  const handlePreferenceChange = (studentId, prefIndex, courseId) => {
    setPreferences(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [prefIndex]: parseInt(courseId) || ''
      }
    }));
  };

  // Check if preferences are valid
  const arePreferencesValid = () => {
    // Check if all students have complete preference lists
    for (let i = 1; i <= students; i++) {
      if (!preferences[i]) return false;
      
      for (let j = 1; j <= prefLength; j++) {
        if (preferences[i][j] === undefined || preferences[i][j] === '' || isNaN(preferences[i][j])) {
          return false;
        }
        
        // Check if the course ID is valid
        if (preferences[i][j] < 1 || preferences[i][j] > courses) {
          return false;
        }
      }
      
      // Check for duplicates in preferences
      const preferenceValues = Object.values(preferences[i]);
      const uniqueValues = new Set(preferenceValues);
      if (uniqueValues.size !== preferenceValues.length) {
        return false;
      }
    }

    // Check if course capacities are valid
    for (let i = 1; i <= courses; i++) {
      if (!courseCapacities[i] || courseCapacities[i] < 1) {
        return false;
      }
    }
    
    return true;
  };

  // Algorithm to allocate courses
  const allocateCourses = async () => {
    if (!arePreferencesValid()) {
      setError('Please fill in all preferences with valid course numbers without duplicates.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      // Simulating calculation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Implementation of a simple course allocation algorithm
      // Initialize allocation
      const result = {};
      const freeStudents = Array.from({ length: students }, (_, i) => i + 1);
      const courseAllocated = {};
      const studentPreferenceIndex = {};
      
      for (let i = 1; i <= students; i++) {
        studentPreferenceIndex[i] = 1; // Start with first preference
      }
      
      // Continue until all students are allocated or have exhausted preferences
      while (freeStudents.length > 0) {
        const currentStudent = freeStudents[0];
        
        // If student has exhausted all preferences
        if (studentPreferenceIndex[currentStudent] > prefLength) {
          freeStudents.shift();
          continue;
        }
        
        // Get current course preference of the student
        const preferredCourse = preferences[currentStudent][studentPreferenceIndex[currentStudent]];
        
        // If course is free, allocate it
        if (!courseAllocated[preferredCourse]) {
          courseAllocated[preferredCourse] = currentStudent;
          result[currentStudent] = preferredCourse;
          freeStudents.shift();
        } else {
          // Course is already allocated, move to next preference
          studentPreferenceIndex[currentStudent]++;
        }
      }
      
      setAllocation(result);
      setShowAllocationAnimation(true);
      
      // Optional: Save to database via API
      try {
        await axios.post('http://localhost:5000/api/allocate', {
          students,
          courses,
          prefLength,
          courseCapacities,
          preferences,
          allocation: result
        });
      } catch (error) {
        console.error('Error saving allocation:', error);
        // Not showing this error to user as it's non-critical
      }
      
    } catch (error) {
      setError('An error occurred during allocation.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate the preference input fields
  const renderPreferenceInputs = () => {
    const rows = [];
    
    for (let i = 1; i <= students; i++) {
      const prefInputs = [];
      
      for (let j = 1; j <= prefLength; j++) {
        prefInputs.push(
          <div key={`student-${i}-pref-${j}`} className="preference-input">
            <label>
              Choice {j}:
            </label>
            <input
              type="number"
              min="1"
              max={courses}
              value={(preferences[i] && preferences[i][j]) || ''}
              onChange={(e) => handlePreferenceChange(i, j, e.target.value)}
            />
          </div>
        );
      }
      
      rows.push(
        <div key={`student-${i}`} className="student-preferences">
          <div className="student-label">
            <div className="student-icon">👤</div>
            <div>Student {i}</div>
          </div>
          <div className="preference-list">{prefInputs}</div>
        </div>
      );
    }
    
    return rows;
  };

  // Render course icons for the legend
  const renderCourseLegend = () => {
    const courseIcons = [];
    
    for (let i = 1; i <= courses; i++) {
      courseIcons.push(
        <div key={`course-${i}`} className="course-icon-container">
          <div className="course-icon">📚</div>
          <div>Course {i}</div>
        </div>
      );
    }
    
    return (
      <div className="course-legend">
        <h3>Available Courses:</h3>
        <div className="course-icons">{courseIcons}</div>
      </div>
    );
  };

  // Render allocation results
  const renderAllocation = () => {
    if (!allocation) return null;
    
    const allocatedStudents = Object.keys(allocation);
    if (allocatedStudents.length === 0) {
      return <div className="no-allocation">No valid allocation possible.</div>;
    }
    
    return (
      <div className={`allocation-results ${showAllocationAnimation ? 'show-animation' : ''}`}>
        <h3>Course Allocation Results:</h3>
        <div className="allocation-grid">
          {allocatedStudents.map(student => (
            <div key={`result-${student}`} className="allocation-item">
              <div className="student-course-icons">
                <div className="student-result-icon">👤</div>
                <div className="allocation-arrow">→</div>
                <div className="course-result-icon">📚</div>
              </div>
              <div className="allocation-text">
                Student {student} is allocated Course {allocation[student]}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Handle Excel file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Validate the data structure
        if (jsonData.length < 2) {
          setFileError('Excel file must have at least 2 rows (header and data)');
          return;
        }

        // Process the data
        const newPreferences = {};
        let validData = true;
        for (let i = 1; i < Math.min(jsonData.length, students+1); i++) {
          const row = jsonData[i];
          if (!row || row.length < prefLength + 1) {
            validData = false;
            break;
          }

          const studentId = parseInt(row[0]);
          if (isNaN(studentId) || studentId < 1 || studentId > students) {
            validData = false;
            break;
          }

          newPreferences[studentId] = {};
          for (let j = 1; j <= prefLength; j++) {
            const courseId = parseInt(row[j]);
            if (isNaN(courseId) || courseId < 1 || courseId > courses) {
              validData = false;
              break;
            }
            newPreferences[studentId][j] = courseId;
          }
        }

        if (!validData) {
          setFileError('Invalid data format in Excel file. Please check the structure.');
          return;
        }

        setPreferences(newPreferences);
        setFileError('');
        setError('');
      } catch (error) {
        setFileError('Error processing Excel file. Please check the format.');
        console.error('Excel processing error:', error);
      }
    };

    reader.onerror = () => {
      setFileError('Error reading file');
    };

    reader.readAsArrayBuffer(file);
  };

  // Generate course capacity inputs
  const renderCourseCapacities = () => {
    const capacityInputs = [];
    for (let i = 1; i <= courses; i++) {
      capacityInputs.push(
        <div key={`capacity-${i}`} className="capacity-input">
          <label>
            Seats in Course {i}:
          </label>
          <input
            type="number"
            min="1"
            value={courseCapacities[i] || 1}
            onChange={(e) => handleCapacityChange(i, e.target.value)}
          />
        </div>
      );
    }
    return capacityInputs;
  };

  return (
    <div className="course-allocation-container">
      <div className="app-header">
        <h1>Course Allocation Problem</h1>
        <p className="app-description">
          Assign courses to students based on preference rankings
        </p>
      </div>
      
      <div className="input-parameters">
        <div className="parameter-input">
          <label>
            Number of Students (n):
          </label>
          <input
            type="number"
            min="1"
            value={students}
            onChange={(e) => setStudents(parseInt(e.target.value)||1)}
          />
        </div>
        
        <div className="parameter-input">
          <label>
            Number of Courses (m):
          </label>
          <input
            type="number"
            min="1"
            value={courses}
            onChange={(e) => setCourses(parseInt(e.target.value) || 1)}
          />
        </div>
        
        <div className="parameter-input">
          <label>
            Preference List Length (r):
          </label>
          <input
            type="number"
            min="1"
            max={courses}
            value={prefLength}
            onChange={(e) => {
              const newVal = parseInt(e.target.value) || 1;
              setPrefLength(Math.min(newVal, courses));
            }}
          />
        </div>
      </div>

      <div className="course-capacities-section">
        <h3>Course Capacities:</h3>
        <div className="capacity-inputs">
          {renderCourseCapacities()}
        </div>
      </div>

      <div className="file-upload-section">
        <h3>Upload Preferences (Excel)</h3>
        <div className="file-upload-container">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="file-input"
          />
          <p className="file-format-info">
            Excel format: First column should be Student ID, followed by preference columns (1 to r)
          </p>
          {fileError && <div className="error-message">{fileError}</div>}
        </div>
      </div>
      
      {/* {renderCourseLegend()} */}
      
      <div className="preferences-container">
        <h2>Student Preferences:</h2>
        <p className="preferences-help">
          For each student, enter course numbers (1 to {courses}) in order of preference.
        </p>
        <div className="preferences-list">
          {renderPreferenceInputs()}
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <button
        className={`calculate-button ${isLoading ? 'loading' : ''}`}
        onClick={allocateCourses}
        disabled={isLoading}
      >
        {isLoading ? 'Calculating...' : 'Calculate Allocation'}
      </button>
      
      {allocation && (
        <>
          {/* {renderAllocation()} */}
          <AlgorithmComparison
            students={students}
            courses={courses}
            courseCapacities={courseCapacities}
            preferences={preferences}
          />
        </>
      )}
    </div>
  );
};

export default HouseAllocationApp;