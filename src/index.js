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

// Create user
app.post("/users", async (req, res) => {
  const result = await prisma.user
    .create({
      data: {
        ...req.body,
      },
    })
    .catch((error) => {
      res.send(error.message);
    });
  res.json(result);
});

// Get users
app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany().catch((error) => {
    res.send(error.message);
  });
  res.json(users);
});

// Get user by handle
app.get(`/u/:handle`, async (req, res) => {
  const { handle } = req.params;

  const userData = await prisma.user
    .findOne({
      where: {
        handle,
      },
    })
    .catch((error) => {
      res.send(error.message);
    });
  res.json(userData);
});

// Update user
app.post(`/u/:handle`, async (req, res) => {
  const { handle } = req.params;

  const updatedUser = await prisma.user
    .update({
      where: {
        handle,
      },
      data: {
        ...req.body,
      },
    })
    .catch((error) => {
      res.send(error.message);
    });

  res.json(updatedUser);
});

// Delete user
app.delete(`/u/:handle`, async (req, res) => {
  const { handle } = req.params;

  const deletedUser = await prisma.user
    .delete({
      where: {
        handle,
      },
    })
    .catch((error) => {
      res.send(error.message);
    });

  res.json(deletedUser);
});

// Get the communities a logged-in user is subscribed to
app.get(`/u/:handle/subscribed`, async (req, res) => {
  const { handle } = req.params;
  const communityList = await prisma.user
    .findOne({
      where: {
        handle,
      },
    })
    .SubscriberOfCommunities()
    .catch((error) => {
      res.send(error.message);
    });

  res.json(communityList);
});

// Get the communities a user organizes
app.get(`/u/:handle/organizer`, async (req, res) => {
  const { handle } = req.params;
  const communityList = await prisma.user
    .findOne({
      where: {
        handle,
      },
    })
    .OrganizerOfCommunities()
    .catch((error) => {
      res.send(error.message);
    });

  res.json(communityList);
});

// Subscribe a user to a community
app.post(`/c/:url/subscribe`, async (req, res) => {
  const { url } = req.params;
  const { handle } = req.body;

  const updatedSubscribedCommunities = await prisma.user
    .update({
      where: {
        handle,
      },
      data: {
        SubscriberOfCommunities: {
          connect: {
            url,
          },
        },
      },
    })
    .SubscriberOfCommunities()
    .catch((error) => {
      res.send(error.message);
    });

  res.json(updatedSubscribedCommunities);
});

// Unsubscribe a user from a community
app.post(`/c/:url/unsubscribe`, async (req, res) => {
  const { url } = req.params;
  const { handle } = req.body;

  const updatedUser = await prisma.user
    .update({
      where: {
        handle,
      },
      data: {
        SubscriberOfCommunities: {
          disconnect: {
            url,
          },
        },
      },
    })
    .SubscriberOfCommunities()
    .catch((error) => {
      res.send(error.message);
    });

  res.json(updatedUser);
});

// COMMUNITIES

// Create a community
app.post(`/communities`, async (req, res) => {
  const { url, name, description, organizerHandle } = req.body;
  const result = await prisma.community
    .create({
      data: {
        url,
        name,
        description,
        Organizer: {
          connect: {
            handle: organizerHandle,
          },
        },
      },
    })
    .catch((error) => {
      res.send(error.message);
    });

  res.json(result);
});

// Update a community
app.post(`/c/:url`, async (req, res) => {
  const { url } = req.params;

  const result = await prisma.community
    .update({
      where: {
        url,
      },
      data: {
        ...req.body,
      },
    })
    .catch((error) => {
      res.send(error.message);
    });

  res.json(result);
});

// Get communities
app.get("/communities", async (req, res) => {
  const communities = await prisma.community.findMany().catch((error) => {
    res.send(error.message);
  });

  res.json(communities);
});

// Get community by url
app.get(`/c/:url`, async (req, res) => {
  const { url } = req.params;

  const result = await prisma.community
    .findOne({
      where: {
        url,
      },
    })
    .catch((error) => {
      res.send(error.message);
    });

  res.json(result);
});

// DISCUSSIONS

// Create a discussion in a community
app.post(`/c/:url/discussions`, async (req, res) => {
  const { authorId, body, communityId, title } = req.body;

  const newDiscussion = await prisma.discussion
    .create({
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
    })
    .catch((error) => {
      res.send(error.message);
    });

  res.json(newDiscussion);
});

// Get discussions in a community
app.get(`/c/:url/discussions`, async (req, res) => {
  const { url } = req.params;

  const discussions = await prisma.community
    .findOne({
      where: {
        url,
      },
    })
    .Discussion()
    .catch((error) => {
      res.send(error.message);
    });

  res.json(discussions);
});

const getDiscussionsByUser = async (handle) => {
  const discussions = await prisma.user
    .findOne({
      where: {
        handle,
      },
    })
    .Discussion()
    .catch((error) => {
      res.send(error.message);
    });

  return discussions;
};

// Get discussions authored by a user
app.get(`/u/:handle/discussions`, async (req, res) => {
  const { handle } = req.params;

  const discussions = await getDiscussionsByUser(handle);

  res.json(discussions);
});

// MESSAGES

// Create a message from one user to another
app.post(`/u/:recipientHandle/message`, async (req, res) => {
  const { authorHandle, text } = req.body;
  const { recipientHandle } = req.params;

  const newMessage = await prisma.message
    .create({
      data: {
        Recipient: {
          connect: {
            handle: recipientHandle,
          },
        },
        Author: {
          connect: {
            handle: authorHandle,
          },
        },
        text,
      },
    })
    .catch((error) => {
      res.send(error.message);
    });

  res.json(newMessage);
});

const sortByCreated = (object) => {
  return object.sort((a, b) => b.createdAt - a.createdAt);
};

// Get all correspondence to and from one user
app.get(`/u/:handle/message`, async (req, res) => {
  const { handle } = req.params;

  const sentAndReceivedMessages = await prisma.message
    .findMany({
      where: {
        OR: [
          {
            recipientHandle: handle,
          },
          {
            authorHandle: handle,
          },
        ],
      },
    })
    .catch((error) => {
      res.send(error.message);
    });

  const chronologicalMessages = sortByCreated(sentAndReceivedMessages);
  res.json(chronologicalMessages);
});

// Get a conversation between two users
app.get(`/u/:handle/message/:interlocutor`, async (req, res) => {
  const { handle, interlocutor } = req.params;

  const messagesToInterlocutor = await prisma.message
    .findMany({
      where: {
        AND: [
          {
            recipientHandle: interlocutor,
          },
          {
            authorHandle: handle,
          },
        ],
      },
    })
    .catch((error) => {
      res.send(error.message);
    });

  const messagesFromInterlocutor = await prisma.message
    .findMany({
      where: {
        AND: [
          {
            recipientHandle: handle,
          },
          {
            authorHandle: interlocutor,
          },
        ],
      },
    })
    .catch((error) => {
      res.send(error.message);
    });

  const conversation = [...messagesToInterlocutor, ...messagesFromInterlocutor];
  const chronologicalConversation = sortByCreated(conversation);

  res.json(chronologicalConversation);
});

// COMMENTS

// Create root comment in discussion
// Requirements:
// - isRootComment must be true
// - there is no parent comment
app.post("/c/:communityUrl/discussion/:discussionId", async (req, res) => {
  const { authorHandle, text, isRootComment } = req.body;
  const { discussionId } = req.params;

  if (!authorHandle) {
    res.send("An author handle is required to create a comment.");
    return;
  }

  const comment = await prisma.comment
    .create({
      data: {
        User: {
          connect: {
            handle: authorHandle,
          },
        },
        Discussion: {
          connect: {
            id: parseInt(discussionId),
          },
        },
        text,
        isRootComment,
      },
    })
    .catch((error) => {
      res.send(error.message);
    });

  res.json(comment);
});

// Create child comment
// Requirements:
// - isRootComment must be false
// - a parent comment ID must be provided
app.post(
  "/c/:communityUrl/discussion/:discussionId/comments/:commentId",
  async (req, res) => {
    const { authorHandle, text, isRootComment } = req.body;
    const { discussionId, commentId } = req.params;

    if (!authorHandle) {
      res.send("An author handle is required to create a comment.");
      return;
    }

    const comment = await prisma.comment
      .create({
        data: {
          User: {
            connect: {
              handle: authorHandle,
            },
          },
          Discussion: {
            connect: {
              id: parseInt(discussionId),
            },
          },
          parentComment: {
            connect: {
              id: parseInt(commentId),
            },
          },
          text,
          isRootComment,
        },
      })
      .catch((error) => {
        res.send(error.message);
      });

    res.json(comment);
  }
);

// Get discussion with structured comments
app.get(`/c/:communityUrl/discussion/:discussionId`, async (req, res) => {
  const { discussionId } = req.params;

  const discussion = await prisma.discussion
    .findOne({
      where: {
        id: parseInt(discussionId),
      },
      include: {
        Comment: {
          where: {
            isRootComment: true,
          },
          include: {
            childComment: true,
          },
        },
      },
    })
    .catch((error) => {
      res.send(error.message);
    });

  res.json(discussion);
});

// Update comment text
app.put(
  `/c/:communityUrl/discussions/:discussionId/comment/:commentId`,
  async (req, res) => {
    const { commentId } = req.params;
    const { text } = req.body;

    const updatedComment = await prisma.comment
      .update({
        where: {
          id: parseInt(commentId),
        },
        data: {
          text,
        },
      })
      .catch((error) => {
        res.send(error.message);
      });

    res.json(updatedComment);
  }
);

const getRepliesToComment = async (commentId) => {
  const replies = await prisma.comment
    .findOne({
      where: {
        id: parseInt(commentId),
      },
    })
    .childComment()
    .catch((error) => {
      res.send(error.message);
    });

  return replies;
};

// Get child comments of parent comment
app.get(
  `/c/:communityUrl/discussions/:discussionId/comment/:commentId/children`,
  async (req, res) => {
    const { commentId } = req.params;
    const replies = await getRepliesToComment(commentId);
    res.json(replies);
  }
);
const getCommentsByUser = async (handle) => {
  const comments = await prisma.user
    .findOne({
      where: {
        handle,
      },
    })
    .Comment()
    .catch((error) => {
      res.send(error.message);
    });

  return comments;
};

// Get all comments authored by user
app.get(`/u/:handle/comments`, async (req, res) => {
  const { handle } = req.params;

  const comments = await getCommentsByUser(handle);

  res.json(comments);
});

// Get comments and discussions authored by user
app.get(`/u/:handle/history`, async (req, res) => {
  const { handle } = req.params;
  const comments = await getCommentsByUser(handle);
  const discussions = await getDiscussionsByUser(handle);
  const history = [...comments, ...discussions];
  const chronologicalHistory = sortByCreated(history);
  return res.json(chronologicalHistory);
});

// Delete a comment
app.delete(
  `/c/:communityUrl/discussions/:discussionId/comment/:commentId`,
  async (req, res) => {
    const { commentId } = req.params;

    // Check if comment has replies. If there are replies,
    // replace the comment with a placeholder.
    const replies = await getRepliesToComment(commentId);
    if (replies.length > 0) {
      const updatedComment = await prisma.comment
        .update({
          where: {
            id: parseInt(commentId),
          },
          data: {
            text: "[Deleted]",
            User: {
              connect: {
                handle: "deleted",
              },
            },
          },
        })
        .catch((error) => {
          res.send(error.message);
        });

      res.json(updatedComment);
      return;
    }

    // If there are no replies, delete the comment.
    const deletedComment = await prisma.comment
      .delete({
        where: {
          id: parseInt(commentId),
        },
      })
      .catch((error) => {
        res.send(error.message);
      });

    res.json(deletedComment);
  }
);

const server = app.listen(3000, () =>
  console.log(
    "🚀 Server ready at: http://localhost:3000\n⭐️ See sample requests: http://pris.ly/e/ts/rest-express#3-using-the-rest-api"
  )
);
