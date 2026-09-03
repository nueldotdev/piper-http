import { Piper } from "./core/index.js";

const example = new Piper({
  baseURL: "https://jsonplaceholder.typicode.com",
  routes: {
    users: "/users",
    getPosts: "/posts/:id",
    getComments: "/comments/:id",
  },
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_ACCESS_TOKEN",
  },
});

console.log("example instance:", example);

const result = await example
  .get("users")
  .on((response) => {
    // const userId = data[0].id; // Assuming you want the first user's ID
    // const user = data.find((user) => user.id === userId);
    return response;
  })
  .fail((error) => {
    console.error("Error fetching user data:", error);
    return null;
  });

const newReq = await example
  .get("getPosts", { id: 1 })
  .on((data) => data)
  .fail((error) => {
    console.error("Error fetching posts:", error);
    return null;
  });

const response = await example
  .post("users", {
    name: "John Doe",
    email: "K8A7o@example.com",
    username: "johndoe",
  })
  .on((data) => data);

console.log(response);

console.log("result:", result.new());
