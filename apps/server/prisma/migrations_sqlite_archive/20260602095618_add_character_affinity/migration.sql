-- CreateTable
CREATE TABLE "character_affinities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "affinity" INTEGER NOT NULL DEFAULT 0,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "character_affinities_user_id_character_id_key" ON "character_affinities"("user_id", "character_id");
