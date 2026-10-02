require('dotenv').config();
const app = require('./app');
const { migrate } = require('./db/migrate');
const { seed } = require('./db/seed');

const PORT = process.env.PORT || 4000;

migrate();
seed();

app.listen(PORT, () => {
  console.log(`🚗 Car Dealership API listening on http://localhost:${PORT}`);
});
