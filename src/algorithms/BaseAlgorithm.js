class BaseAlgorithm {
  constructor(students, courses, courseCapacities, preferences) {
    this.students = students;
    this.courses = courses;
    this.courseCapacities = courseCapacities;
    this.preferences = preferences;
  }
  // Method to validate input data
  validateInput() {
    console.log(this.preferences);
    if (!this.preferences || Object.keys(this.preferences).length !== this.students) {
      throw new Error('Invalid preferences data');
    }
    
    // Check if all students have complete preference lists
    for (let i = 1; i <= this.students; i++) {
      if (!this.preferences[i]) {
        throw new Error(`Missing preferences for student ${i}`);
      }
    }

    // Check if all courses have valid capacities
    for (let i = 1; i <= this.courses; i++) {
      if (!this.courseCapacities[i] || this.courseCapacities[i] < 1) {
        throw new Error(`Invalid capacity for course ${i}`);
      }
    }
    
    return true;
  }

  // Method to calculate allocation
  calculateAllocation() {
    throw new Error('calculateAllocation method must be implemented by child class');
  }

  // Method to calculate metrics for comparison
  calculateMetrics(allocation) {
    let metrics = {
      totalPreferenceScore: 0,
      averagePreferenceScore: 0,
      minPreferenceScore: Infinity,
      maxPreferenceScore: 0,
      fairnessScore: 0,
      totalAllocated: 0,
      allocationRate: 0,
      unassigned: 0,
    };
    // Calculate preference scores and track allocations
    let courseAllocations = {};
    for (let i = 1; i <= this.courses; i++) {
      courseAllocations[i] = 0;
    }

    // Initialize unassigned count
    metrics.unassigned = this.students; // Start with all students unassigned

    for (let student = 1; student <= this.students; student++) {
      const allocatedCourse = allocation[student];
      
      // Only count valid course allocations (not null and within capacity)
      if (allocatedCourse && allocatedCourse !== null) {
        courseAllocations[allocatedCourse]++;
        if (courseAllocations[allocatedCourse] <= this.courseCapacities[allocatedCourse]) {
          metrics.totalAllocated++;
          metrics.unassigned--; // Decrease unassigned count for each valid allocation
        }
      }

      const preferenceList = this.preferences[student];
      let preferenceScore = 0;

      // Find the position of allocated course in preference list
      if (allocatedCourse && allocatedCourse !== null) {
        for (let pos = 1; pos <= Object.keys(preferenceList).length; pos++) {
          if (preferenceList[pos] === allocatedCourse) {
            preferenceScore = pos;
            break;
          }
        }
      }

      metrics.totalPreferenceScore += preferenceScore;
      if (preferenceScore > 0) {
        metrics.minPreferenceScore = Math.min(metrics.minPreferenceScore, preferenceScore);
      }
      
      metrics.maxPreferenceScore = Math.max(metrics.maxPreferenceScore, preferenceScore);
    }

    metrics.averagePreferenceScore = metrics.totalAllocated > 0 ? 
      metrics.totalPreferenceScore / metrics.totalAllocated : 0;
    metrics.allocationRate = metrics.totalAllocated / this.students;
    
    // Calculate fairness score (lower is better)
    metrics.fairnessScore = metrics.maxPreferenceScore - metrics.minPreferenceScore;

    // Check if any course is over-allocated
    for (let course = 1; course <= this.courses; course++) {
      if (courseAllocations[course] > this.courseCapacities[course]) {
        throw new Error(`Course ${course} is over-allocated`);
      }
    }

    return metrics;
  }
}

export default BaseAlgorithm; 
