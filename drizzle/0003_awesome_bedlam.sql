CREATE TABLE "lesson_session" (
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"version" integer NOT NULL,
	"phase" text NOT NULL,
	"messages" jsonb NOT NULL,
	"check_state" jsonb NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "lesson_session_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "llm_usage" (
	"user_id" text NOT NULL,
	"day" text NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "llm_usage_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "weakness_record" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "weakness_record_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"criterion" text NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_session" ADD CONSTRAINT "lesson_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_session" ADD CONSTRAINT "lesson_session_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_usage" ADD CONSTRAINT "llm_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weakness_record" ADD CONSTRAINT "weakness_record_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weakness_record" ADD CONSTRAINT "weakness_record_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "weakness_record_userId_idx" ON "weakness_record" USING btree ("user_id");