import { Piper } from "./core/index.js"


const konva = new Piper({
  baseURL: "https://konva-cmpp.onrender.com",
  routes: {
    test: "/api/test"
  },
  headers: {
    
  }
})

// Example usage
async function runTest() {
  const response = konva.get("test");
  
  response.on((data) => {
    return data;
  });

  try {
    const start = performance.now();
    const res = await response.new();
    console.log("Response from Konva:", res.data);
    const end = performance.now();
    console.log(`Request took ${(end - start).toFixed(2)} ms`);
  } catch (error) {
    console.error("Error fetching data from Konva:", error);
  }
}


runTest();
// Export the Piper instance for use in other modules
export default konva;