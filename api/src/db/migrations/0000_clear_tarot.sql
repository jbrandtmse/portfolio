CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"org" text,
	"message" text NOT NULL,
	"topic" text,
	"attribution" text NOT NULL,
	"source" text DEFAULT 'form' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"mail_status" text
);
