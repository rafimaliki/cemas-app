import { checkExpiringEvidence } from "../controllers/notif-controller.ts";

/**
 * Scheduler utility for running periodic tasks
 */
class Scheduler {
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();

  /**
   * Start a scheduled task that runs at the specified interval
   * @param taskName Name of the task for reference
   * @param task Function to execute
   * @param intervalMs Interval in milliseconds
   */
  startTask(taskName: string, task: () => Promise<void>, intervalMs: number): void {
    // Clear any existing timer with the same name
    this.stopTask(taskName);
    
    // Set up the new timer
    const timer = setInterval(async () => {
      try {
        await task();
      } catch (error) {
        console.error(`Error executing scheduled task ${taskName}:`, error);
      }
    }, intervalMs);
    
    this.timers.set(taskName, timer);
    console.log(`Scheduled task ${taskName} started, running every ${intervalMs / (1000 * 60)} minutes`);
  }

  /**
   * Stop a scheduled task
   * @param taskName Name of the task to stop
   */
  stopTask(taskName: string): void {
    const timer = this.timers.get(taskName);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(taskName);
      console.log(`Scheduled task ${taskName} stopped`);
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stopAllTasks(): void {
    for (const [taskName, timer] of this.timers.entries()) {
      clearInterval(timer);
      console.log(`Scheduled task ${taskName} stopped`);
    }
    this.timers.clear();
  }
}

// Create a singleton instance
const scheduler = new Scheduler();

/**
 * Initialize all scheduled tasks
 */
export const initializeScheduledTasks = (): void => {
  // Check for expiring evidence once a day (24 hours)
  // You can adjust the interval as needed
  const DAILY_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  scheduler.startTask('checkExpiringEvidence', async () => {
    console.log('Running scheduled task: checkExpiringEvidence');
    const result = await checkExpiringEvidence();
    console.log('Expiring evidence check result:', result);
  }, DAILY_CHECK_INTERVAL);
};

export { scheduler }; 