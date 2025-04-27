import BaseAlgorithm from './BaseAlgorithm';

class GaleShapleyAlgorithm extends BaseAlgorithm {
  calculateAllocation() {
    this.validateInput();
    
    const allocation = {};
    const freeStudents = Array.from({ length: this.students }, (_, i) => i + 1);
    const courseProposals = {};
    
    // Initialize course proposals
    for (let i = 1; i <= this.courses; i++) {
      courseProposals[i] = [];
    }
    
    // Continue until all students are allocated
    while (freeStudents.length > 0) {
      const currentStudent = freeStudents[0];
      const studentPreferences = this.preferences[currentStudent];
      
      // Find the highest-ranked course that currentStudent hasn't proposed to yet
      let nextCourseToPropose = null;
      for (let rank = 1; rank <= Object.keys(studentPreferences).length; rank++) {
        const course = studentPreferences[rank];
        if (!allocation[currentStudent] && courseProposals[course].length < this.courseCapacities[course]) {
          nextCourseToPropose = course;
          break;
        }
      }
      
      if (!nextCourseToPropose) {
        // Student has proposed to all courses and got rejected
        freeStudents.shift();
        continue;
      }
      
      // If course has capacity, allocate it
      if (courseProposals[nextCourseToPropose].length < this.courseCapacities[nextCourseToPropose]) {
        courseProposals[nextCourseToPropose].push(currentStudent);
        allocation[currentStudent] = nextCourseToPropose;
        freeStudents.shift();
      } else {
        // Course is full, check if current student is preferred over any existing occupant
        const currentOccupants = courseProposals[nextCourseToPropose];
        let worstOccupant = null;
        let worstRank = -1;
        
        for (const occupant of currentOccupants) {
          const rank = this.getCoursePreferenceRank(nextCourseToPropose, occupant);
          if (rank > worstRank) {
            worstRank = rank;
            worstOccupant = occupant;
          }
        }
        
        const newStudentRank = this.getCoursePreferenceRank(nextCourseToPropose, currentStudent);
        
        if (newStudentRank < worstRank) {
          // Current student is preferred over the worst occupant
          const index = currentOccupants.indexOf(worstOccupant);
          currentOccupants[index] = currentStudent;
          allocation[currentStudent] = nextCourseToPropose;
          delete allocation[worstOccupant];
          freeStudents.shift();
          freeStudents.push(worstOccupant);
        } else {
          // Current student is not preferred, move to next preference
          freeStudents.shift();
          freeStudents.push(currentStudent);
        }
      }
    }
    
    return allocation;
  }
  
  // Helper method to get the rank of a student in a course's preference list
  getCoursePreferenceRank(course, student) {
    // In this implementation, we assume courses prefer students with lower IDs
    // You can modify this to implement different course preferences
    return student;
  }
}

export default GaleShapleyAlgorithm; 