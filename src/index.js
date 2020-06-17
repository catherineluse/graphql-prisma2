const express = require("express");
const bodyParser = require("body-parser");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

app.use(bodyParser.json());

app.post("/user", async (req, res) => {
  const result = await prisma.user.create({
    data: {
      ...req.body,
    },
  });
  res.json(result);
});

app.get("/user", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get(`/user/:id`, async (req, res) => {
  const { id } = req.params;

  const userById = await prisma.user.findOne({
    where: {
      id: parseInt(id),
    },
  });
  res.json(userById);
});

app.delete(`/user/:id`, async (req, res) => {
  const { id } = req.params;

  const deletedUser = await prisma.user.delete({
    where: {
      id: parseInt(id),
    },
  });
  res.json(deletedUser);
});

app.post(`/user/:id`, async (req, res) => {
  const { id } = req.params;

  const updatedUser = await prisma.user.update({
    where: {
      id: parseInt(id),
    },
    data: {
      ...req.body,
    },
  });

  res.json(updatedUser);
});

app.post(`/community`, async (req, res) => {
  const { url, name, description, creatorId } = req.body;
  const result = await prisma.community.create({
    data: {
      Creator: { connect: { id: parseInt(creatorId) } },
      url,
      name,
      description,
    },
  });
  res.json(result);
});

const server = app.listen(3000, () =>
  console.log(
    "🚀 Server ready at: http://localhost:3000\n⭐️ See sample requests: http://pris.ly/e/ts/rest-express#3-using-the-rest-api"
  )
);
