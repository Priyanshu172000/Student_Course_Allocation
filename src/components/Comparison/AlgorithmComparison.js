import React from 'react';
import OriginalAlgorithm from '../../algorithms/OriginalAlgorithm';
import minSpread from '../../algorithms/GaleShapleyAlgorithm';
import './AlgorithmComparison.css';

const AlgorithmComparison = ({ students, courses, courseCapacities, preferences }) => {
  const runAlgorithms = () => {
    const algorithms = [
      { name: 'Least Dissatisfaction', instance: new OriginalAlgorithm(students, courses, courseCapacities, preferences) },
      { name: 'minSpread', instance: new minSpread(students, courses, courseCapacities, preferences) }
    ];
    let result = algorithms.map(alg => {
      try {
        const allocation = alg.instance.calculateAllocation();
        let metrics = alg.instance.calculateMetrics(allocation);
        return {
          name: alg.name, 
          allocation,
          metrics,
          error: null
        };
      } catch (error) {
        return {
          name: alg.name,
          allocation: null,
          metrics: null,
          error: error.message
        };
      }
    });

    return result;
  };

  let results = runAlgorithms();

  const renderStudentAllocation = (studentId, courseId, studentPreferences) => {
    const preferenceRank = Object.values(studentPreferences).indexOf(courseId) + 1;
    
    return (
      <div key={studentId} className="student-allocation">
        <div className="allocation-result">
          <span className="student-name">Student {studentId}</span>
          <span className="course-value">Course {courseId}</span>
          <span className="preference-rank">(Preference #{preferenceRank})</span>
        </div>
      </div>
    );
  };

  return (
    <div className="algorithm-comparison">
      <h2>Algorithm Comparison</h2>
      <div className="comparison-grid">
        {results.map((result, index) => (
          <div key={index} className="algorithm-result">
            <h3>{result.name}</h3>
            {result.error ? (
              <div className="error-message">{result.error}</div>
            ) : (
              <>
                <div className="allocation-details">
                  <h4>Allocation Results:</h4>
                  <div className="allocation-list">
                    {Object.entries(result.allocation).map(([student, course]) => (
                      renderStudentAllocation(student, course, preferences[student])
                    ))}
                  </div>
                </div>
                <div className="metrics-details">
                  <h4>Performance Metrics:</h4>
                  <ul>
                    <li>Total Preference Score: {result.metrics.totalPreferenceScore}</li>
                    <li>Min Preference Score: {result.metrics.minPreferenceScore}</li>
                    <li>Max Preference Score: {result.metrics.maxPreferenceScore}</li>
                    <li>Allocated Students: {result.metrics.totalAllocated}</li>
                    <li>Fairness Score: {result.metrics.fairnessScore}</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlgorithmComparison; 
