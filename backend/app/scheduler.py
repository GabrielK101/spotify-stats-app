from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from .services.spotify_poller import SpotifyPoller
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def poll_all_users_job():
    """Job that runs every hour to poll all users"""
    logger.info("Starting hourly poll of all users...")
    try:
        results = SpotifyPoller.poll_all_users()
        successful = sum(1 for r in results if r["success"])
        failed = len(results) - successful
        logger.info(f"Poll complete: {successful} successful, {failed} failed")
    except Exception as e:
        logger.error(f"Error in polling job: {e}")

def start_scheduler():
    """Start the scheduler with hourly polling"""
    # Run every hour at minute 0
    scheduler.add_job(
        poll_all_users_job,
        CronTrigger(minute=0),
        id='poll_listening_history',
        name='Poll Spotify listening history',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started - will poll users every hour")

def stop_scheduler():
    """Stop the scheduler gracefully"""
    scheduler.shutdown()
    logger.info("Scheduler stopped")