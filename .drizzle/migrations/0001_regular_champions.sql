CREATE TABLE `daily_triggers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`interval_days` integer DEFAULT 1 NOT NULL,
	`start_time` text NOT NULL,
	`start_when_available` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `monthly_triggers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`months` text NOT NULL,
	`trigger_mode` text NOT NULL,
	`days_of_month` text,
	`weeks_of_month` text,
	`days_of_week` text,
	`start_time` text NOT NULL,
	`start_when_available` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `once_triggers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`start_time` text NOT NULL,
	`start_when_available` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `weekly_triggers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`interval_weeks` integer DEFAULT 1 NOT NULL,
	`days_of_week` text NOT NULL,
	`start_time` text NOT NULL,
	`start_when_available` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `start_time`;--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `start_when_available`;