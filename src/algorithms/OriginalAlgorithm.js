import BaseAlgorithm from './BaseAlgorithm';

class OriginalAlgorithm extends BaseAlgorithm {
  calculateAllocation() {
    this.validateInput();
    
    const allocation = {};
    
    

    class Graph {
      constructor(numStudents, numCourses) {
          this.numStudents = numStudents;
          this.numCourses = numCourses;
          this.adj = Array.from({ length: numStudents + 1 }, () => []);
      }
  }
  
  let matchH2 = []; // Global variable for house matchings
  let courseId = [0]; // Global variable for course IDs
  
  function bfs(matchA, matchH, dist, graph) {
      let queue = [];
      for (let a = 1; a <= graph.numStudents; a++) {
          if (matchA[a] === 0) {
              dist[a] = 0;
              queue.push(a);
          } else {
              dist[a] = Infinity;
          }
      }
      dist[0] = Infinity;
  
      while (queue.length > 0) {
          let a = queue.shift();
          if (dist[a] < dist[0]) {
              for (let h of graph.adj[a]) {
                  if (dist[matchH[h]] === Infinity) {
                      dist[matchH[h]] = dist[a] + 1;
                      queue.push(matchH[h]);
                  }
              }
          }
      }
      return dist[0] !== Infinity;
  }
  
  function dfs(a, matchA, matchH, dist, graph) {
      if (a !== 0) {
          for (let h of graph.adj[a]) {
              if (dist[matchH[h]] === dist[a] + 1) {
                  if (dfs(matchH[h], matchA, matchH, dist, graph)) {
                      matchH[h] = a;
                      matchA[a] = h;
                      return true;
                  }
              }
          }
          dist[a] = Infinity;
          return false;
      }
      return true;
  }
  
  function hopcroftKarp(graph, matchA, matchH) {
      matchA.length = graph.numStudents + 1;
      matchH.length = graph.numCourses + 1;
      matchA.fill(0);
      matchH.fill(0);
      const dist = Array(graph.numStudents + 1).fill(0);
  
      let matchingSize = 0;
      while (bfs(matchA, matchH, dist, graph)) {
          for (let a = 1; a <= graph.numStudents; a++) {
              if (matchA[a] === 0 && dfs(a, matchA, matchH, dist, graph)) {
                  matchingSize++;
              }
          }
      }
      return [matchingSize, matchA.slice()];
  }
  
  function makeCoalitionFree(matchA, matchH, graph) {
      let ptr = Array(graph.numStudents + 1).fill(0);
      let improved;
  
      do {
          improved = false;
          let visitedAgent = Array(graph.numStudents + 1).fill(false);
          let visitedHouse = Array(graph.numCourses + 1).fill(false);
  
          for (let a = 1; a <= graph.numStudents; ++a) {
              if (matchA[a] === 0 || visitedAgent[a]) continue;
  
              let cycleAgents = [];
              let cycleHouses = [];
              let currentAgent = a;
  
              while (true) {
                  if (visitedAgent[currentAgent]) break;
                  visitedAgent[currentAgent] = true;
  
                  let nextHouse = -1;
                  while (ptr[currentAgent] > graph.adj[currentAgent].length) {
                      nextHouse = graph.adj[currentAgent][ptr[currentAgent]++];
                      if (nextHouse !== matchA[currentAgent] && !visitedHouse[nextHouse]) break;
                  }
                  if (nextHouse === -1) break;
  
                  cycleAgents.push(currentAgent);
                  cycleHouses.push(nextHouse);
                  visitedHouse[nextHouse] = true;
  
                  currentAgent = matchH[nextHouse];
                  if (currentAgent === 0) break;
              }
  
              if (cycleAgents.length > 1) {
                  improved = true;
                  for (let agent of cycleAgents) {
                      if (matchA[agent] !== 0) {
                          matchH[matchA[agent]] = 0;
                      }
                  }
                  for (let i = 0; i < cycleAgents.length; i++) {
                      let agent = cycleAgents[i];
                      let house = cycleHouses[i];
                      matchA[agent] = house;
                      matchH[house] = agent;
                  }
              }
          }
      } while (improved);
  }
  
  function leastDissatisfaction(graph, maxMatchingSize) {
      let left = 1, right = graph.numCourses, result = right;
      let ans = [0, []];
  
      while (left <= right) {
          let mid = Math.floor((left + right) / 2);
          let restrictedGraph = new Graph(graph.numStudents, graph.numCourses);
  
          for (let a = 1; a <= graph.numStudents; ++a) {
              for (let i = 0; i < Math.min(mid, graph.adj[a].length); ++i) {
                  restrictedGraph.adj[a].push(graph.adj[a][i]);
              }
          }
  
          let matchA = [], matchH = [];
          let [matchingSize, currentMatchA] = hopcroftKarp(restrictedGraph, matchA, matchH);
  
          if (matchingSize === maxMatchingSize) {
              result = mid;
              ans = [mid, currentMatchA];
              matchH2 = matchH;
              right = mid - 1;
          } else {
              left = mid + 1;
          }
      }
      // console.log(ans);
  
      return ans;
  }
  
    // Preprocess the graph to set up the adjacency list and preferences
    function preprocessGraph(graph, seats) {
      for (let i = 1; i <= graph.numCourses; ++i) {
        seats[i-1] = Math.min(seats[i-1], graph.numStudents); // Ensure seats don't exceed students
        for (let j = 0; j < seats[i-1]; ++j) {
          courseId.push(i); // Store the course IDs
        }
      }
    
      const courseCount = new Map();
      for (let i = 0; i < graph.numStudents; i++) {
        for (let j = 0; j < graph.adj[i + 1].length; j++) {
          const h = graph.adj[i + 1][j];
          if (!courseCount.has(h)) {
            courseCount.set(h, []);
          }
          courseCount.get(h).push([j, i + 1]); // Store preference of each student for each course
        }
      }
      
      let cnt = 1;
      for (let i = 1; i <= graph.numCourses; ++i) {
        let cur = 0;
        if (courseCount.has(i)) {
          const preferences = courseCount.get(i);
          preferences.sort((a, b) => a[0] - b[0]); // Sort preferences for each course
          
          for (let j = 0; j < preferences.length; ++j) {
            const studentIndex = preferences[j][1];
            const prefIndex = preferences[j][0];
            graph.adj[studentIndex][prefIndex] = cnt + (cur % seats[i-1]); // Add house-agent edge
            cur++;
          }
        }
        cnt += seats[i-1]; // Update count for next course
      }
      graph.numCourses = cnt;
    }
    
    // Main function
  
      const numStudents=this.students;
      const numCourses=this.courses;
      
      
      let graph = new Graph(numStudents, numCourses);
      let seats = Array(this.courses+1).fill(0);
      for (let i=1; i<=this.courses; i++)
      {
        seats[i-1]=this.courseCapacities[i];

      }
      for (let i = 1; i <= numStudents; i++) {
        // Convert preferences to array format if needed
        const agentPreferences = [];
        for (let j = 1; j <= Object.keys(this.preferences[i]).length; j++) {
          agentPreferences.push(this.preferences[i][j]);
        }
        graph.adj[i] = agentPreferences;
      }
      
      preprocessGraph(graph, seats); // Preprocess graph for preferences and seats
      console.log(graph.adj);
      const matchA = Array(graph.numStudents + 1).fill(0);
      const matchH = Array(graph.numCourses + 1).fill(0);
      
      const maxMatchingSize = hopcroftKarp(graph, matchA, matchH);
      const res = leastDissatisfaction(graph, maxMatchingSize[0]);
      const matchA2 = res[1];
    
      console.log("Maximal Matching : " + maxMatchingSize[0]);
      console.log("Least Dissatisfaction Matching Size: " + res[0]);
    
      makeCoalitionFree(matchA2, matchH2, graph);
      for (let a = 1; a <= numStudents; ++a) {
        allocation[a] = matchA2[a] !== 0 ? courseId[matchA2[a]] : null;
      }
      
      makeCoalitionFree(matchA, matchH, graph);
      
    

        
        
        
        
      
    
    return allocation;
  }
}

export default OriginalAlgorithm; 