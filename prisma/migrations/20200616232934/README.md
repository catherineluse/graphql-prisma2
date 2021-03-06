# Migration `20200616232934`

This migration has been generated by catherineluse at 6/16/2020, 11:29:34 PM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

ALTER TABLE "public"."User" DROP COLUMN "role",
ADD COLUMN "role" "Role" NOT NULL DEFAULT E'USER',
DROP COLUMN "updatedAt",
ADD COLUMN "updatedAt" timestamp(3)  NOT NULL ;
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration 20200430121655..20200616232934
--- datamodel.dml
+++ datamodel.dml
@@ -2,68 +2,75 @@
 // learn more about it in the docs: https://pris.ly/d/prisma-schema
 datasource db {
   provider = "postgresql"
-  url = "***"
+  url      = env("DATABASE_URL")
 }
 generator client {
   provider = "prisma-client-js"
 }
-
 model User {
-  id                Int            @id @default(autoincrement())
-  name              String
-  email             String         @unique
-  age               Int?
-  createdAt         DateTime       @default(now())
-  discussions       Discussion[]
-  comments          Comment[]
-  sentMessages      Message[]      @relation("MessageAuthor")
-  receivedMessages  Message[]      @relation("MessageRecipient")
+  id               Int          @id @default(autoincrement())
+  name             String
+  email            String       @unique
+  age              Int?
+  createdAt        DateTime     @default(now())
+  updatedAt        DateTime     @updatedAt
+  discussions      Discussion[]
+  comments         Comment[]
+  sentMessages     Message[]    @relation("MessageAuthor")
+  receivedMessages Message[]    @relation("MessageRecipient")
+  community        Community[]
+  role             Role         @default(USER)
 }
 model Discussion {
-  id            Int            @id @default(autoincrement())
-  community     Community      @relation(fields: [communityId], references: [id])
-  communityId   Int
-  title         String
-  body          String?
-  author        User           @relation(fields: [authorId], references: [id])
-  authorId      Int            
-  rootComments  Comment[]
-  createdAt     DateTime       @default(now())
+  id           Int       @id @default(autoincrement())
+  community    Community @relation(fields: [communityId], references: [id])
+  communityId  Int
+  title        String
+  body         String?
+  author       User      @relation(fields: [authorId], references: [id])
+  authorId     Int
+  rootComments Comment[]
+  createdAt    DateTime  @default(now())
 }
 model Comment {
-  id               Int           @id @default(autoincrement())
-  text             String
-  author           User          @relation(fields: [authorId], references: [id]) 
-  authorId         Int
-  discussion       Discussion    @relation(fields: [discussionId], references: [id])
-  discussionId     Int
-  parentComment    Comment       @relation("ParentChildComments", fields: [id], references: [id])
-  childComments    Comment[]     @relation("ParentChildComments")
-  createdAt        DateTime      @default(now())
+  id            Int        @id @default(autoincrement())
+  text          String
+  author        User       @relation(fields: [authorId], references: [id])
+  authorId      Int
+  discussion    Discussion @relation(fields: [discussionId], references: [id])
+  discussionId  Int
+  parentComment Comment    @relation("ParentChildComments", fields: [id], references: [id])
+  childComments Comment[]  @relation("ParentChildComments")
+  createdAt     DateTime   @default(now())
 }
 model Message {
-  id           Int         @id @default(autoincrement())
-  text         String
-  author       User        @relation(name: "MessageAuthor", fields: [authorId], references: [id])
-  authorId     Int         
-  recipient    User        @relation(name: "MessageRecipient", fields: [authorId], references: [id])
-  recipientId  Int         
-  createdAt    DateTime    @default(now())
-}
+  id          Int      @id @default(autoincrement())
+  text        String
+  author      User     @relation(name: "MessageAuthor", fields: [authorId], references: [id])
+  authorId    Int
+  recipient   User     @relation(name: "MessageRecipient", fields: [authorId], references: [id])
+  recipientId Int
+  createdAt   DateTime @default(now())
+} 
 model Community {
-  id           Int          @id @default(autoincrement())
-  creator      User         @relation(fields: [creatorId], references: [id])
-  creatorId    Int          
-  url          String       @unique
-  name         String
-  description  String?
-  discussions  Discussion[]
-  createdAt    DateTime     @default(now())
+  id          Int          @id @default(autoincrement())
+  creator     User         @relation(fields: [creatorId], references: [id])
+  creatorId   Int
+  url         String       @unique
+  name        String
+  description String?
+  discussions Discussion[]
+  createdAt   DateTime     @default(now())
 }
+
+enum Role {
+  ADMIN
+  USER
+}
```


