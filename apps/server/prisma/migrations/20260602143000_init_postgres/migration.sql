-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "referral_code" TEXT,
    "referred_by" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "status" TEXT NOT NULL DEFAULT 'active',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nickname" TEXT,
    "wizard_title" TEXT,
    "house" TEXT,
    "house_locked" BOOLEAN NOT NULL DEFAULT false,
    "grade" TEXT,
    "team" TEXT,
    "bio" TEXT,
    "selected_badge" TEXT,
    "selected_frame" TEXT,
    "forest_patrol_progress" INTEGER NOT NULL DEFAULT 0,
    "injury_end_time" TIMESTAMP(3),

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "balance_galleons" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT,
    "description" TEXT,
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recharge_packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "galleons" INTEGER NOT NULL,
    "bonus_galleons" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recharge_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recharge_orders" (
    "id" TEXT NOT NULL,
    "order_no" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "package_id" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "galleons" INTEGER NOT NULL,
    "bonus_galleons" INTEGER NOT NULL DEFAULT 0,
    "channel" TEXT NOT NULL DEFAULT 'virtual',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "virtual_pay_key" TEXT,
    "provider_trade_no" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recharge_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_callback_logs" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "order_no" TEXT,
    "raw_payload" JSONB NOT NULL,
    "signature_ok" BOOLEAN NOT NULL DEFAULT false,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_callback_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "before_json" JSONB,
    "after_json" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sign_in_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reward" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sign_in_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'private',
    "title" TEXT,
    "owner_id" TEXT,
    "character_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_members" (
    "conversation_id" TEXT NOT NULL,
    "member_type" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("conversation_id","member_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_type" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "token_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "houses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "crest_url" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "house_point_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "house" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "house_point_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "house_cup_quiz_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "house" TEXT NOT NULL,
    "day_key" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "grade" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "house_cup_quiz_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulletin_task_states" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "day_key" TEXT NOT NULL,
    "tasks_json" TEXT NOT NULL,
    "quiz_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_difficulties" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulletin_task_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "reward_galleons" INTEGER NOT NULL DEFAULT 0,
    "reward_points" INTEGER NOT NULL DEFAULT 0,
    "target_count" INTEGER NOT NULL DEFAULT 1,
    "reset_rule" TEXT,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "user_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options_json" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "reward_points" INTEGER NOT NULL DEFAULT 0,
    "reward_galleons" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "house_cup_quiz_questions" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options_json" TEXT NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "house_cup_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shops" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_galleons" INTEGER NOT NULL,
    "item_type" TEXT,
    "item_payload_json" TEXT,
    "image_url" TEXT,
    "stock" INTEGER,
    "limit_per_user" INTEGER,
    "available_from" TIMESTAMP(3),
    "available_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "total_price" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "metadata_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "name" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'egg',
    "level" INTEGER NOT NULL DEFAULT 1,
    "hunger" INTEGER NOT NULL DEFAULT 100,
    "hatched_at" TIMESTAMP(3),
    "last_fed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_unlocks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "unlocked_at" TIMESTAMP(3),

    CONSTRAINT "room_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_rewards" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referred_user_id" TEXT NOT NULL,
    "reward_type" TEXT NOT NULL,
    "reward_amount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redeem_codes" (
    "id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "reward_type" TEXT NOT NULL,
    "reward_payload_json" TEXT,
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redeem_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redeem_code_uses" (
    "id" TEXT NOT NULL,
    "code_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redeem_code_uses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_affinities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "affinity" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_affinities_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "recharge_orders_order_no_key" ON "recharge_orders"("order_no");

-- CreateIndex
CREATE UNIQUE INDEX "recharge_orders_virtual_pay_key_key" ON "recharge_orders"("virtual_pay_key");

-- CreateIndex
CREATE UNIQUE INDEX "recharge_orders_provider_trade_no_key" ON "recharge_orders"("provider_trade_no");

-- CreateIndex
CREATE INDEX "recharge_orders_user_id_status_idx" ON "recharge_orders"("user_id", "status");

-- CreateIndex
CREATE INDEX "recharge_orders_created_at_idx" ON "recharge_orders"("created_at");

-- CreateIndex
CREATE INDEX "payment_callback_logs_order_no_idx" ON "payment_callback_logs"("order_no");

-- CreateIndex
CREATE INDEX "admin_audit_logs_admin_user_id_idx" ON "admin_audit_logs"("admin_user_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_target_type_target_id_idx" ON "admin_audit_logs"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_post_id_user_id_key" ON "post_likes"("post_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "houses_name_key" ON "houses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "house_cup_quiz_records_user_id_day_key_key" ON "house_cup_quiz_records"("user_id", "day_key");

-- CreateIndex
CREATE UNIQUE INDEX "bulletin_task_states_user_id_day_key_key" ON "bulletin_task_states"("user_id", "day_key");

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

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE UNIQUE INDEX "character_affinities_user_id_character_id_key" ON "character_affinities"("user_id", "character_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recharge_orders" ADD CONSTRAINT "recharge_orders_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "recharge_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "house_point_logs" ADD CONSTRAINT "house_point_logs_house_fkey" FOREIGN KEY ("house") REFERENCES "houses"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tasks" ADD CONSTRAINT "user_tasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redeem_code_uses" ADD CONSTRAINT "redeem_code_uses_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "redeem_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

