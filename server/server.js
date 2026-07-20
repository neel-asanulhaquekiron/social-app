const express = require("express");
const postRouter = require("./router/postRouter.js");
const userRouter = require("./router/userRouter.js");
const notificationRouter = require("./router/notificationRouter.js");
const authRouter = require("./router/authRouter.js");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use("/posts", postRouter);
app.use("/users", userRouter);
app.use("/notifications", notificationRouter);
app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
