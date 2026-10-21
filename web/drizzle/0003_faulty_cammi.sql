CREATE TABLE `market_observations` (
	`provider_id` text NOT NULL,
	`item_id` text NOT NULL,
	`type` text NOT NULL,
	`observed_at` text NOT NULL,
	`unit_price` real NOT NULL,
	`minimum_quantity` integer NOT NULL,
	`minimum_total` real NOT NULL,
	`options_json` text NOT NULL,
	`quantity_known` integer NOT NULL,
	`evidence_id` text NOT NULL,
	PRIMARY KEY(`provider_id`, `evidence_id`, `observed_at`, `unit_price`)
);
--> statement-breakpoint
CREATE INDEX `market_observations_item_type_at` ON `market_observations` (`item_id`,`type`,`observed_at`);--> statement-breakpoint
CREATE TABLE `market_provider_snapshots` (
	`provider_id` text PRIMARY KEY NOT NULL,
	`payload_json` text NOT NULL,
	`fetched_at` text NOT NULL,
	`source_updated_at` text,
	`next_fetch_at` integer DEFAULT 0 NOT NULL
);
