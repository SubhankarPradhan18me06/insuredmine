const scheduleService = require('../service/schedule.service');

async function createSchedule(req, res, next) {
  try {
    const { message, day, time } = req.body;
    if (!message || !day || !time) return res.status(400).json({ error: 'message, day (YYYY-MM-DD) and time (HH:mm) are required' });

    const doc = await scheduleService.createAndSchedule({ message, day, time });
    return res.status(201).json({ ok: true, scheduled: doc });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createSchedule };
