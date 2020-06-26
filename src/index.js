const express = require("express");
const bodyParser = require("body-parser");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

app.use(bodyParser.json());

app.get("/", async (req, res) => {
  res.json("The server is running");
});

// USERS

// Get users
app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// Create user
app.post("/users", async (req, res) => {
  const result = await prisma.user.create({
    data: {
      ...req.body,
    },
  });
  res.json(result);
});

// Get user by ID
app.get(`/users/:id`, async (req, res) => {
  const { id } = req.params;

  const userById = await prisma.user.findOne({
    where: {
      id: parseInt(id),
    },
  });
  res.json(userById);
});

// Update user
app.post(`/users/:id`, async (req, res) => {
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

// Delete user
app.delete(`/users/:id`, async (req, res) => {
  const { id } = req.params;

  const deletedUser = await prisma.user.delete({
    where: {
      id: parseInt(id),
    },
  });
  res.json(deletedUser);
});

// COMMUNITIES

// Get communities
app.get("/communities", async (req, res) => {
  const communities = await prisma.community.findMany();
  res.json(communities);
});

// Create a community
app.post(`/communities`, async (req, res) => {
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

// Get community by url
app.get(`/c/:url`, async (req, res) => {
  const result = await prisma.community.findOne({
    where: {
      url: req.params.url,
    },
  });
  res.json(result);
});

// DISCUSSIONS

// Get discussions in a community
app.get(`/c/:url/discussions`, async (req, res) => {
  const communityData = await prisma.community.findOne({
    where: {
      url: req.params.url,
    },
    select: {
      id: true,
    },
  });

  const communityId = communityData.id;

  const discussions = await prisma.discussion.findMany({
    where: {
      Community: {
        id: {
          equals: communityId,
        },
      },
    },
  });
  res.json(discussions);
});

const getUserIdByHandle = async (handle) => {
  const userData = await prisma.user.findOne({
    where: {
      handle,
    },
    select: {
      id: true,
    },
  });
  return parseInt(userData.id);
};

// Get discussions authored by a user
app.get(`/:handle/discussions`, async (req, res) => {
  const userId = await getUserIdByHandle(req.params.handle);

  // Get discussions by user ID
  const discussions = await prisma.discussion.findMany({
    where: {
      authorId: userId,
    },
  });

  res.json(discussions);
});

// Create a discussion in a community
app.post(`/c/:community/discussions`, async (req, res) => {
  const { authorId, body, communityId, title } = req.body;

  const newDiscussion = await prisma.discussion.create({
    data: {
      Community: {
        connect: {
          id: parseInt(communityId),
        },
      },
      title,
      body,
      User: {
        connect: {
          id: parseInt(authorId),
        },
      },
    },
  });
  res.json(newDiscussion);
});

// MESSAGES

// Create a message from one user to another
app.post(`/u/:handle/message`, async (req, res) => {
  const { authorId, text } = req.body;

  const newMessage = await prisma.message.create({
    data: {
      userRecipient: {
        connect: {
          handle: req.params.handle,
        },
      },
      userAuthor: {
        connect: {
          id: parseInt(authorId),
        },
      },
      text,
    },
  });
  res.json(newMessage);
});

// Get all correspondence to and from one user
const getAllCorrespondence = async (userId) => {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        {
          recipientId: userId,
        },
        {
          authorId: userId,
        },
      ],
    },
  });

  const chronologicalMessages = messages.sort(
    (a, b) => b.createdAt - a.createdAt
  );
  return chronologicalMessages;
};

// Get a conversation between two users
// Example query:
// localhost:3000/u/randomperson/message&interlocutor=cluse
app.get(`/u/:handle/message/`, async (req, res) => {
  const { handle } = req.params;

  if (!handle) {
    res.json("Could not find the user.");
    return;
  }

  const loggedInUserId = await getUserIdByHandle(handle);

  const { interlocutor } = req.query;

  // If no interlocutor is specified, return all
  // messages sent or received by the logged-in user.
  if (!interlocutor) {
    const allCorrespondence = await getAllCorrespondence(loggedInUserId);
    res.json(allCorrespondence);
    return;
  }

  const interlocutorId = await getUserIdByHandle(interlocutor);

  // If an interlocutor is specified, return
  // only the messages between the logged-in user
  // and the interlocutor.
  const messagesToInterlocutor = await prisma.message.findMany({
    where: {
      AND: [
        {
          recipientId: interlocutorId,
        },
        {
          authorId: loggedInUserId,
        },
      ],
    },
  });

  const messagesFromInterlocutor = await prisma.message.findMany({
    where: {
      AND: [
        {
          recipientId: loggedInUserId,
        },
        {
          authorId: interlocutorId,
        },
      ],
    },
  });

  const conversation = [...messagesToInterlocutor, ...messagesFromInterlocutor];
  const chronologicalConversation = conversation.sort(
    (a, b) => b.createdAt - a.createdAt
  );
  res.json(chronologicalConversation);
});

const server = app.listen(3000, () =>
  console.log(
    "🚀 Server ready at: http://localhost:3000\n⭐️ See sample requests: http://pris.ly/e/ts/rest-express#3-using-the-rest-api"
  )
);
