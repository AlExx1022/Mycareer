CREATE TABLE "lesson" (
	"id" text PRIMARY KEY NOT NULL,
	"unit_id" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"position" integer NOT NULL,
	"exam_points" jsonb NOT NULL,
	"rubric" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_dependency" (
	"lesson_id" text NOT NULL,
	"depends_on_lesson_id" text NOT NULL,
	CONSTRAINT "lesson_dependency_lesson_id_depends_on_lesson_id_pk" PRIMARY KEY("lesson_id","depends_on_lesson_id")
);
--> statement-breakpoint
CREATE TABLE "unit" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_lesson_mastery" (
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"score" integer NOT NULL,
	"assessed_at" timestamp NOT NULL,
	CONSTRAINT "user_lesson_mastery_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_unit_id_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_dependency" ADD CONSTRAINT "lesson_dependency_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_dependency" ADD CONSTRAINT "lesson_dependency_depends_on_lesson_id_lesson_id_fk" FOREIGN KEY ("depends_on_lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_mastery" ADD CONSTRAINT "user_lesson_mastery_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_mastery" ADD CONSTRAINT "user_lesson_mastery_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_unitId_idx" ON "lesson" USING btree ("unit_id");