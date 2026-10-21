CREATE INDEX `market_observations_item_at` ON `market_observations` (`item_id`,`observed_at`);--> statement-breakpoint
CREATE INDEX `market_observations_at` ON `market_observations` (`observed_at`);