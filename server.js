const express = require("express");
const postRouter = require("./server/router/postRouter.js");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use("/posts", postRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
