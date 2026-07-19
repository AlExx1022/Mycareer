CREATE TABLE "review_session" (
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"version" integer NOT NULL,
	"questions" jsonb NOT NULL,
	"results" jsonb NOT NULL,
	"current" integer NOT NULL,
	"source_weakness_ids" jsonb NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "review_session_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
ALTER TABLE "review_session" ADD CONSTRAINT "review_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_session" ADD CONSTRAINT "review_session_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;