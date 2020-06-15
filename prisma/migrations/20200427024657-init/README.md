# Migration `20200427024657-init`

This migration has been generated by Catherine Luse at 4/27/2020, 2:46:57 AM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
CREATE TABLE "public"."User" (
    "age" integer   ,
    "createdAt" timestamp(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" text  NOT NULL ,
    "id" SERIAL,
    "name" text  NOT NULL ,
    PRIMARY KEY ("id")
) 

CREATE TABLE "public"."Discussion" (
    "authorId" integer  NOT NULL ,
    "body" text   ,
    "communityId" integer  NOT NULL ,
    "createdAt" timestamp(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" SERIAL,
    "title" text  NOT NULL ,
    PRIMARY KEY ("id")
) 

CREATE TABLE "public"."Comment" (
    "authorId" integer  NOT NULL ,
    "commentId" integer   ,
    "createdAt" timestamp(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discussionId" integer  NOT NULL ,
    "id" integer  NOT NULL ,
    "parentCommentId" integer   ,
    "text" text  NOT NULL ,
    PRIMARY KEY ("id")
) 

CREATE TABLE "public"."Message" (
    "authorId" integer  NOT NULL ,
    "createdAt" timestamp(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" integer  NOT NULL ,
    "recipientId" integer  NOT NULL ,
    "text" text  NOT NULL ,
    PRIMARY KEY ("id")
) 

CREATE TABLE "public"."Community" (
    "createdAt" timestamp(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdDate" text  NOT NULL ,
    "creatorId" integer  NOT NULL ,
    "description" text   ,
    "id" integer  NOT NULL ,
    "name" text  NOT NULL ,
    "url" text  NOT NULL ,
    PRIMARY KEY ("id")
) 

CREATE UNIQUE INDEX "User.email" ON "public"."User"("email")

CREATE UNIQUE INDEX "Community.url" ON "public"."Community"("url")

ALTER TABLE "public"."Discussion" ADD FOREIGN KEY ("communityId")REFERENCES "public"."Community"("id") ON DELETE CASCADE  ON UPDATE CASCADE

ALTER TABLE "public"."Discussion" ADD FOREIGN KEY ("authorId")REFERENCES "public"."User"("id") ON DELETE CASCADE  ON UPDATE CASCADE

ALTER TABLE "public"."Comment" ADD FOREIGN KEY ("authorId")REFERENCES "public"."User"("id") ON DELETE CASCADE  ON UPDATE CASCADE

ALTER TABLE "public"."Comment" ADD FOREIGN KEY ("discussionId")REFERENCES "public"."Discussion"("id") ON DELETE CASCADE  ON UPDATE CASCADE

ALTER TABLE "public"."Comment" ADD FOREIGN KEY ("commentId")REFERENCES "public"."Comment"("id") ON DELETE SET NULL  ON UPDATE CASCADE

ALTER TABLE "public"."Message" ADD FOREIGN KEY ("authorId")REFERENCES "public"."User"("id") ON DELETE CASCADE  ON UPDATE CASCADE

ALTER TABLE "public"."Message" ADD FOREIGN KEY ("authorId")REFERENCES "public"."User"("id") ON DELETE CASCADE  ON UPDATE CASCADE

ALTER TABLE "public"."Community" ADD FOREIGN KEY ("creatorId")REFERENCES "public"."User"("id") ON DELETE CASCADE  ON UPDATE CASCADE
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration ..20200427024657-init
--- datamodel.dml
+++ datamodel.dml
@@ -1,0 +1,70 @@
+// This is your Prisma schema file,
+// learn more about it in the docs: https://pris.ly/d/prisma-schema
+
+datasource db {
+  provider = "postgresql"
+  url      = env("DATABASE_URL")
+}
+
+generator client {
+  provider = "prisma-client-js"
+}
+
+
+model User {
+  id                Int            @id @default(autoincrement())
+  name              String
+  email             String         @unique
+  age               Int?
+  createdAt         DateTime       @default(now())
+  discussions       Discussion[]
+  comments          Comment[]
+  sentMessages      Message[]      @relation("MessageAuthor")
+  receivedMessages  Message[]      @relation("MessageRecipient")
+}
+
+model Discussion {
+  id            Int            @id @default(autoincrement())
+  community     Community      @relation(fields: [communityId], references: [id])
+  communityId   Int
+  title         String
+  body          String?
+  author        User           @relation(fields: [authorId], references: [id])
+  authorId      Int            
+  rootComments  Comment[]
+  createdAt     DateTime       @default(now())
+}
+
+model Comment {
+  id               Int           @id
+  text             String
+  author           User          @relation(fields: [authorId], references: [id]) 
+  authorId         Int
+  discussion       Discussion    @relation(fields: [discussionId], references: [id])
+  discussionId     Int
+  parentCommentId  Int?         
+  childComments    Comment[]     
+  createdAt        DateTime      @default(now())
+}
+
+model Message {
+  id           Int         @id
+  text         String
+  author       User        @relation(name: "MessageAuthor", fields: [authorId], references: [id])
+  authorId     Int         
+  recipient    User        @relation(name: "MessageRecipient", fields: [authorId], references: [id])
+  recipientId  Int         
+  createdAt    DateTime    @default(now())
+}
+
+model Community {
+  id           Int          @id
+  creator      User         @relation(fields: [creatorId], references: [id])
+  creatorId    Int          
+  url          String       @unique
+  name         String
+  description  String?
+  createdDate  String
+  discussions  Discussion[]
+  createdAt    DateTime     @default(now())
+}
```

