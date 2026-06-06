-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "referral_code" TEXT,
    "referred_by" TEXT,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "nickname" TEXT,
    "wizard_title" TEXT,
    "house" TEXT,
    "grade" TEXT,
    "team" TEXT,
    "bio" TEXT,
    "selected_badge" TEXT,
    "selected_frame" TEXT,
    CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "balance_galleons" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT,
    "description" TEXT,
    "order_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sign_in_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "signed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reward" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "house" TEXT,
    "grade" TEXT,
    "title" TEXT,
    "description" TEXT,
    "system_prompt" TEXT,
    "greeting" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'private',
    "title" TEXT,
    "owner_id" TEXT,
    "character_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversations_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conversation_members" (
    "conversation_id" TEXT NOT NULL,
    "member_type" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',

    PRIMARY KEY ("conversation_id", "member_id"),
    CONSTRAINT "conversation_members_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversation_id" TEXT NOT NULL,
    "sender_type" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "token_count" INTEGER DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "post_likes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "post_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "houses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "crest_url" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "house_point_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "house" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "house_point_logs_house_fkey" FOREIGN KEY ("house") REFERENCES "houses" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "reward_galleons" INTEGER NOT NULL DEFAULT 0,
    "reward_points" INTEGER NOT NULL DEFAULT 0,
    "target_count" INTEGER NOT NULL DEFAULT 1,
    "reset_rule" TEXT
);

-- CreateTable
CREATE TABLE "user_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "completed_at" DATETIME,
    CONSTRAINT "user_tasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "options_json" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "reward_points" INTEGER NOT NULL DEFAULT 0,
    "reward_galleons" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "shops" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_galleons" INTEGER NOT NULL,
    "item_type" TEXT,
    "item_payload_json" TEXT,
    "image_url" TEXT,
    "stock" INTEGER,
    "limit_per_user" INTEGER,
    "available_from" DATETIME,
    "available_to" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "total_price" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "metadata_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "pets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "name" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'egg',
    "level" INTEGER NOT NULL DEFAULT 1,
    "hunger" INTEGER NOT NULL DEFAULT 100,
    "hatched_at" DATETIME,
    "last_fed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "room_unlocks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "unlocked_at" DATETIME
);

-- CreateTable
CREATE TABLE "referral_rewards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrer_id" TEXT NOT NULL,
    "referred_user_id" TEXT NOT NULL,
    "reward_type" TEXT NOT NULL,
    "reward_amount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "redeem_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code_hash" TEXT NOT NULL,
    "reward_type" TEXT NOT NULL,
    "reward_payload_json" TEXT,
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "redeem_code_uses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "used_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "redeem_code_uses_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "redeem_codes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_post_id_user_id_key" ON "post_likes"("post_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "houses_name_key" ON "houses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_tasks_user_id_task_id_key" ON "user_tasks"("user_id", "task_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_user_id_item_type_item_id_key" ON "inventory"("user_id", "item_type", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_unlocks_user_id_route_key" ON "room_unlocks"("user_id", "route");

-- CreateIndex
CREATE UNIQUE INDEX "redeem_codes_code_hash_key" ON "redeem_codes"("code_hash");

-- CreateIndex
CREATE UNIQUE INDEX "redeem_code_uses_code_id_user_id_key" ON "redeem_code_uses"("code_id", "user_id");
