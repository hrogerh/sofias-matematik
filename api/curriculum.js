const { redisGet } = require('./_lib/redis');

module.exports = async (req, res) => {
  const subject = req.query.subject;
  if (!subject) {
    res.status(400).json({ error: 'missing subject' });
    return;
  }

  try {
    const curriculum = await redisGet(`curriculum:${subject}`);
    res.status(200).json(curriculum || { title: subject, groups: [] });
  } catch (err) {
    res.status(500).json({ error: 'db error', message: err.message });
  }
};
