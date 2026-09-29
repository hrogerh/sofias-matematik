const { redisGet, redisSet } = require('./_lib/redis');

const KEY = 'progress:sofia';

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const data = await redisGet(KEY);
      res.status(200).json(data || {});
      return;
    }

    if (req.method === 'POST') {
      const { section, step, correct, attempts } = req.body || {};
      if (!section || step === undefined) {
        res.status(400).json({ error: 'missing section/step' });
        return;
      }
      const data = (await redisGet(KEY)) || {};
      data[section] = data[section] || {};
      data[section][step] = {
        correct: !!correct,
        attempts: attempts || 1,
        ts: new Date().toISOString()
      };
      await redisSet(KEY, data);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).end();
  } catch (err) {
    res.status(500).json({ error: 'db error', message: err.message });
  }
};
