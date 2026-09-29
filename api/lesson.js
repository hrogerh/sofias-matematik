const { redisGet } = require('./_lib/redis');

module.exports = async (req, res) => {
  const { subject, section } = req.query;
  if (!subject || !section) {
    res.status(400).json({ error: 'missing subject/section' });
    return;
  }

  try {
    const content = await redisGet(`content:${subject}/${section}`);
    if (!content) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.status(200).json(content);
  } catch (err) {
    res.status(500).json({ error: 'db error', message: err.message });
  }
};
