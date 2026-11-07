ALTER TABLE `tasks` ADD `hidden` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `wake_to_run` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `disallow_start_if_on_batteries` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `stop_if_going_on_batteries` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `run_highest` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `multiple_instances` text DEFAULT 'ignore-new' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `execution_time_limit_minutes` integer;--> statement-breakpoint
ALTER TABLE `tasks` ADD `end_time` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `repeat_interval_minutes` integer;--> statement-breakpoint
ALTER TABLE `tasks` ADD `repeat_duration_minutes` integer;--> statement-breakpoint
ALTER TABLE `tasks` ADD `delay_minutes` integer;