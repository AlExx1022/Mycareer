CREATE TABLE "learning_path" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"subject" text NOT NULL,
	"code_language" text NOT NULL,
	"status" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "learning_path_status_check" CHECK ("learning_path"."status" in ('draft', 'published'))
);
--> statement-breakpoint
CREATE TABLE "learning_path_recommendation" (
	"path_id" text NOT NULL,
	"recommended_path_id" text NOT NULL,
	CONSTRAINT "learning_path_recommendation_path_id_recommended_path_id_pk" PRIMARY KEY("path_id","recommended_path_id"),
	CONSTRAINT "learning_path_recommendation_not_self_check" CHECK ("learning_path_recommendation"."path_id" <> "learning_path_recommendation"."recommended_path_id")
);
--> statement-breakpoint
ALTER TABLE "lesson" ADD COLUMN "practice_runtime" text;--> statement-breakpoint
ALTER TABLE "lesson" ADD COLUMN "practice_blueprint" jsonb;--> statement-breakpoint
ALTER TABLE "unit" ADD COLUMN "path_id" text;--> statement-breakpoint
ALTER TABLE "practice_session" ADD COLUMN "user_files" jsonb;--> statement-breakpoint
INSERT INTO "learning_path" (
	"id",
	"title",
	"description",
	"subject",
	"code_language",
	"status",
	"position"
) VALUES (
	'react-junior-mid',
	'React Junior → Mid',
	'建立 React 核心心智模型，掌握 Hooks、資料流與常見實作面試題。',
	'React',
	'TypeScript',
	'published',
	0
) ON CONFLICT ("id") DO UPDATE SET
	"title" = EXCLUDED."title",
	"description" = EXCLUDED."description",
	"subject" = EXCLUDED."subject",
	"code_language" = EXCLUDED."code_language",
	"status" = EXCLUDED."status",
	"position" = EXCLUDED."position";--> statement-breakpoint
UPDATE "unit"
SET "path_id" = 'react-junior-mid'
WHERE "id" IN ('react-core-model', 'hooks-and-data-flow')
	AND "path_id" IS NULL;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "unit" WHERE "path_id" IS NULL) THEN
		RAISE EXCEPTION 'multi-path migration aborted: unit.path_id backfill incomplete';
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "unit" ALTER COLUMN "path_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_path_recommendation" ADD CONSTRAINT "learning_path_recommendation_path_id_learning_path_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_recommendation" ADD CONSTRAINT "learning_path_recommendation_recommended_path_id_learning_path_id_fk" FOREIGN KEY ("recommended_path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit" ADD CONSTRAINT "unit_path_id_learning_path_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "unit_pathId_idx" ON "unit" USING btree ("path_id");--> statement-breakpoint
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_practice_runtime_check" CHECK ("lesson"."practice_runtime" is null or "lesson"."practice_runtime" in ('react-ts', 'vanilla-ts', 'vanilla-js', 'python'));
