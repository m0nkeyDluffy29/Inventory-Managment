require('dotenv').config();
const app = require('./app');
const { startJobs } = require('./jobs/expiryCheck.job');

const PORT = ProcessingInstruction.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
  startJobs();
})