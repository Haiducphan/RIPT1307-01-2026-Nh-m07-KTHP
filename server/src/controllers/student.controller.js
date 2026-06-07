const studentService = require('../services/student.service');

async function adjustTrustScore(req, res) {
  try {
    const { delta, note } = req.body;

    if (delta === undefined) {
      return res.status(400).json({ message: 'Thieu truong delta' });
    }

    const result = await studentService.adjustTrustScore(
      req.params.id,
      Number(delta),
      req.user.id,
      note
    );

    res.json(result);
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('adjustTrustScore error:', error.message);
    res.status(500).json({ message: 'Failed to adjust trust score' });
  }
}

async function lockBorrow(req, res) {
  try {
    const result = await studentService.setBorrowLock(req.params.id, true);
    res.json(result);
  } catch (error) {
    if (error.status === 404) return res.status(404).json({ message: error.message });
    console.error('lockBorrow error:', error.message);
    res.status(500).json({ message: 'Failed to lock' });
  }
}

async function unlockBorrow(req, res) {
  try {
    const result = await studentService.setBorrowLock(req.params.id, false);
    res.json(result);
  } catch (error) {
    if (error.status === 404) return res.status(404).json({ message: error.message });
    console.error('unlockBorrow error:', error.message);
    res.status(500).json({ message: 'Failed to unlock' });
  }
}

module.exports = { adjustTrustScore, lockBorrow, unlockBorrow };