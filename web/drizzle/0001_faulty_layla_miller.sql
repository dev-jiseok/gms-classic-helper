CREATE TABLE `shared_timers` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`duration` integer NOT NULL,
	`ends_at` integer,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `social_members` (
	`key` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`joined_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `social_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`sender_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	`read_at` text
);
--> statement-breakpoint
CREATE TABLE `social_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`room` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`note` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `social_spaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_id` text NOT NULL,
	`invite_code` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_spaces_invite_code_unique` ON `social_spaces` (`invite_code`);--> statement-breakpoint
ALTER TABLE `community_posts` ADD `revision` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `community_posts` ADD `updated_at` text DEFAULT '' NOT NULL;