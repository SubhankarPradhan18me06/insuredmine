const schedule = require('node-schedule');
const ScheduledMessage = require('../model/scheduled_message.model');
const { responseLogger } = require('../logger/index.logger');

/**
 * Convert day (YYYY-MM-DD) + time (HH:mm) + optional timezone -> JS Date (in server local time)
 * If timezone provided, you can adjust with Intl or a timezone library. For simplicity we'll assume
 * day+time are in server local timezone OR user can pass an ISO datetime in "scheduledAt".
 */
function buildDateFromDayTime(day, time) {
  // day: 'YYYY-MM-DD', time: 'HH:mm'
  const [y, m, d] = day.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0);
}

const scheduledJobs = new Map(); // key: docId -> job

async function scheduleJobForDocument(doc) {
  const when = new Date(doc.scheduledAt);
  if (when <= new Date()) {
    responseLogger.warn('scheduled time is in the past; executing immediately', { id: doc._id });
    return executeScheduledMessage(doc);
  }

  const job = schedule.scheduleJob(when, async () => {
    await executeScheduledMessage(doc);
  });

  scheduledJobs.set(String(doc._id), job);
  responseLogger.info('Scheduled job created', { id: doc._id, scheduledAt: doc.scheduledAt });
}

async function executeScheduledMessage(doc) {
  try {
    responseLogger.info('Executing scheduled message', { id: doc._id });
    // Example action: mark done and store result. Replace with actual "post-service" action if needed.
    const result = { delivered: true, info: 'Inserted to DB (no external service)' };

    await ScheduledMessage.findByIdAndUpdate(doc._id, { status: 'done', doneAt: new Date(), result }, { new: true });
    scheduledJobs.delete(String(doc._id));
    responseLogger.info('Scheduled message executed', { id: doc._id });
  } catch (err) {
    responseLogger.error('Scheduled message execution failed', { id: doc._id, message: err.message, stack: err.stack });
    await ScheduledMessage.findByIdAndUpdate(doc._id, { status: 'failed', result: { error: err.message } });
  }
}

async function createAndSchedule({ message, day, time /* OR scheduledAtISO */ }) {
  let scheduledAt;
  if (day && time) {
    scheduledAt = buildDateFromDayTime(day, time);
  } else {
    throw new Error('day and time required, or provide scheduledAt as ISO');
  }

  const doc = await ScheduledMessage.create({
    message,
    scheduledAt,
    status: 'pending'
  });

  await scheduleJobForDocument(doc);
  return doc;
}

async function loadAndSchedulePending() {
  const now = new Date();
  // find pending jobs scheduled in the future (or short past window)
  const docs = await ScheduledMessage.find({ status: 'pending', scheduledAt: { $gte: new Date(now.getTime() - 5 * 60 * 1000) } }).lean();
  for (const d of docs) {
    // schedule each
    scheduleJobForDocument(d).catch(err => responseLogger.error('loadAndSchedulePending error', { err: err.message }));
  }
  responseLogger.info('Loaded scheduled messages', { count: docs.length });
}

module.exports = {
  createAndSchedule,
  loadAndSchedulePending,
  scheduledJobs
};
