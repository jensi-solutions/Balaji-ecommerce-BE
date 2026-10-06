require('dotenv').config();
const app = require('./src/app');
const db = require('./src/models');

const PORT = process.env.PORT || 5000;
const DB_NAME = process.env.DB_NAME || 'balaji_ecommerce';
const NODE_ENV = process.env.NODE_ENV || 'development';

const printBanner = () => {
  const green = '\x1b[32m';
  const boldGreen = '\x1b[1;32m';
  const reset = '\x1b[0m';
  const cyan = '\x1b[36m';
  const white = '\x1b[37m';

  const formatLine = (text) => {
    // Calculate length without ANSI color codes
    const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '');
    const padding = 58 - cleanText.length;
    return `${green}│${reset}  ${text}${' '.repeat(Math.max(0, padding))}${green}│${reset}`;
  };

  console.log(`\n${green}┌${'─'.repeat(60)}┐${reset}`);
  console.log(formatLine(''));
  console.log(formatLine(`${boldGreen}✔  DATABASE CONNECTED SUCCESSFULLY${reset}`));
  console.log(formatLine(`   Database : ${cyan}${DB_NAME}${reset}`));
  console.log(formatLine(`   Dialect  : ${cyan}mysql${reset}`));
  console.log(formatLine(`   Status   : ${boldGreen}Connected & Authenticated${reset}`));
  console.log(formatLine(''));
  console.log(formatLine(`${boldGreen}🚀 SERVER IS RUNNING SUCCESSFULLY${reset}`));
  console.log(formatLine(`   Local    : ${cyan}http://localhost:${PORT}${reset}`));
  console.log(formatLine(`   Health   : ${cyan}http://localhost:${PORT}/api/health${reset}`));
  console.log(formatLine(`   Env      : ${white}${NODE_ENV}${reset}`));
  console.log(formatLine(''));
  console.log(`${green}└${'─'.repeat(60)}┘${reset}\n`);
};

const startServer = async () => {
  try {
    // Authenticate database connection
    await db.sequelize.authenticate();

    // Start HTTP Server
    app.listen(PORT, () => {
      printBanner();
    });
  } catch (error) {
    const red = '\x1b[31m';
    const reset = '\x1b[0m';
    console.error(`\n${red}✖ DATABASE CONNECTION FAILED:${reset} ${error.message}`);
    console.warn(`👉 Check MySQL service status and .env configuration (DB_NAME, DB_USER, DB_PASSWORD).\n`);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT} (without DB connection)`);
    });
  }
};

startServer();
