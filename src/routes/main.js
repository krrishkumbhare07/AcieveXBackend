const express = require('express');
const router = express.Router();

// GET /api
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to UPSC and CDS Questions API',
    endpoints: {
      '/api/upsc': 'Access UPSC related questions',
      '/api/cds': 'Access CDS related questions'
    }
  });
});

module.exports = router; 