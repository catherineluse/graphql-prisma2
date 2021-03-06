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
      return;
    });

  res.json(updatedUser);
});

// Delete user and delete discussions and comments
// authored by the user.
app.delete(`/u/:handle`, async (req, res) => {
  const { handle } = req.params;

  // For the comments authored by this user,
  // replace them with [deleted].
  await prisma.comment
    .updateMany({
      where: {
        authorHandle: handle,
      },
      data: {
        text: "[Deleted]",
      },
    })
    .catch((error) => {
      res.send(error.message);
      return;
    });

  // The discussions authored by the user are
  // cascade deleted when the author is deleted,
  // along with all the comments in those discussions.

  // For the communities created by the user,
  // the organizer is changed to null.
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
app.put(`/c/:url`, async (req, res) => {
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

// Delete community
app.delete(`/c/:url`, async (req, res) => {
  const { url } = req.params;

  // Delete all comments in all discussions in the community
  const deletedComments = await prisma.comment
    .deleteMany({
      where: {
        Discussion: {
          communityUrl: url,
        },
      },
    })
    .catch((error) => {
      res.send(error.message);
    });

  // Delete all discussions in the community
  const deletedDiscussions = await prisma.discussion
    .deleteMany({
      where: {
        communityUrl: url,
      },
    })
    .catch((error) => {
      res.send(error.message);
    });

  // Delete the community
  await prisma.community
    .delete({
      where: {
        url,
      },
    })
    .catch((error) => {
      res.send(error.message);
    });

  res.send(
    `Deleted the community ${url} along with ${deletedComments.count} comments and ${deletedDiscussions.count} discussions`
  );
});

// DISCUSSIONS

// Create a discussion in a community
app.post(`/c/:url/discussions`, async (req, res) => {
  const { authorId, body, title } = req.body;
  const { url } = req.params;

  const newDiscussion = await prisma.discussion
    .create({
      data: {
        Community: {
          connect: {
            url,
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

  const discussions = await prisma.discussion
    .findMany({
      where: {
        communityUrl: url,
      },
    })
    .catch((error) => {
      res.send(error.message);
    });

  if (discussions === null) {
    res.send("Could not find discussions.");
    return;
  }

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

// Update a discussion
app.put(`/c/:communityUrl/discussions/:discussionId`, async (req, res) => {
  const { discussionId } = req.params;

  const updatedDiscussion = await prisma.discussion
    .update({
      where: {
        id: parseInt(discussionId),
      },
      data: {
        ...req.body,
      },
    })
    .catch((error) => {
      res.send(error.message);
    });

  res.json(updatedDiscussion);
});

const deleteCommentsInDiscussion = async (discussionId) => {
  const deletedCommentCount = await prisma.comment
    .deleteMany({
      where: {
        Discussion: {
          id: discussionId,
        },
      },
    })
    .catch((error) => {
      res.send(error.message);
    });
};

const deleteDiscussion = async (discussionId) => {
  const deletedDiscussion = await prisma.discussion
    .delete({
      where: {
        id: discussionIdInt,
      },
    })
    .catch((error) => {
      res.send(error.message);
    });
};

// Delete a discussion and all of its comments
app.delete(`/c/:communityUrl/discussions/:discussionId`, async (req, res) => {
  const { discussionId } = req.params;
  const discussionIdInt = parseInt(discussionId);

  const deletedCommentCount = await deleteCommentsInDiscussion(discussionIdInt);

  const deletedDiscussion = await deleteDiscussion(discussionIdInt);

  res.send(
    `Deleted ${deletedCommentCount.count} comments discussion ${deletedDiscussion.id} and deleted the discussion`
  );
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

// Get discussion with nested comments
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
        id: commentId,
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
  `/c/:communityUrl/discussions/:discussionId/comment/:commentId/replies`,
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

const replaceCommentTextWithDeleted = async (commentId) => {
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

  return updatedComment;
};

// Delete a comment
app.delete(
  `/c/:communityUrl/discussions/:discussionId/comment/:commentId`,
  async (req, res) => {
    const { commentId } = req.params;
    const commentIdInt = parseInt(commentId);

    // Check if comment has replies. If there are replies,
    // replace the comment with a placeholder.
    const replies = await getRepliesToComment(commentIdInt);

    if (replies.length > 0) {
      await replaceCommentTextWithDeleted(commentIdInt);
      res.send(`Replaced comment ${commentIdInt} with [deleted]`);
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
