const express = require("express");
const postRouter = require("./router/postRouter.js");
const userRouter = require("./router/userRouter.js");
const notificationRouter = require("./router/notificationRouter.js");
const authRouter = require("./router/authRouter.js");
const { notFound, errorHandler } = require("./middlewares/errorHandler.js");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json({ limit: "100kb" }));

app.use("/posts", postRouter);
app.use("/users", userRouter);
app.use("/notifications", notificationRouter);
app.use("/auth", authRouter);

// Always answer with JSON — no Express HTML pages for unknown routes or errors.
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
