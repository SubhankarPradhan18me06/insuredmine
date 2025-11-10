const mongoose = require('mongoose');
const { databaseLogger } = require('../logger/index.logger');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/insuredmine_assessment';

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: Number(process.env.DB_POOL_SIZE || 10),
  serverSelectionTimeoutMS: 5000
};

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, options);
    databaseLogger.info(`Connected to MongoDB: ${MONGO_URI}`);

    // Register models once after connecting so populate() works everywhere
    try {
      require('../model/agent.model');
      require('../model/user.model');
      require('../model/account.model');
      require('../model/lob.model');
      require('../model/carrier.model');
      require('../model/policy.model');
      databaseLogger.info('Mongoose models registered: Agent, User, Account, LOB, Carrier, Policy');
    } catch (modelErr) {
      databaseLogger.error('Failed to register models', { message: modelErr.message, stack: modelErr.stack });
      throw modelErr;
    }

    // setup event listeners
    mongoose.connection.on('connected', () => databaseLogger.info('[MongoDB] connected'));
    mongoose.connection.on('reconnected', () => databaseLogger.info('[MongoDB] reconnected'));
    mongoose.connection.on('disconnected', () => databaseLogger.warn('[MongoDB] disconnected'));
    mongoose.connection.on('error', (err) => databaseLogger.error('[MongoDB] error', { message: err.message, stack: err.stack }));

    return mongoose;
  } catch (err) {
    databaseLogger.error('MongoDB connection error', { message: err.message, stack: err.stack });
    throw err;
  }
}

module.exports = { connectDB, mongoose };
