/**
 * Convex Cron Jobs
 * - Schedules daily data retention for messages older than 48 hours.
 * - Calls an internal mutation that deletes in batches to respect limits.
 */
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run once per day at 00:00 UTC to purge old messages.
crons.daily(
  "purge-messages-older-than-48h",
  { hourUTC: 0, minuteUTC: 0 },
  internal.messages.deleteOldMessages,
  { batchSize: 500 },
);

export default crons;

