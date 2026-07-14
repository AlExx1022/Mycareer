CREATE TABLE "practice_session" (
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"exercise" jsonb NOT NULL,
	"user_code" text NOT NULL,
	"status" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "practice_session_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
ALTER TABLE "practice_session" ADD CONSTRAINT "practice_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session" ADD CONSTRAINT "practice_session_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;