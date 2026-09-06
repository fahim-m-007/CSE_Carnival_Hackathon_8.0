import mongoose from 'mongoose';

let isConnected = false;
let connectionStatus = 'DISCONNECTED';
let connectionError = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI?.trim();

  // Detect unconfigured placeholder
  if (!uri || uri.includes('admin:admin123@cluster0.mongodb.net') || uri.includes('<username>:<password>')) {
    connectionStatus = 'AWAITING_CONFIG';
    connectionError = 'MongoDB Atlas URI not configured yet in .env';
    console.log('\n================================================================');
    console.log('📌 MONGODB ATLAS SETUP:');
    console.log('Backend is running, awaiting your MongoDB Atlas connection string.');
    console.log('Edit .env in root or server/.env and set:');
    console.log('MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/gradecalibrate?retryWrites=true&w=majority');
    console.log('API is fully functional with intelligent built-in mock fallbacks.');
    console.log('================================================================\n');
    return;
  }

  try {
    connectionStatus = 'CONNECTING';
    console.log(`📡 Connecting to MongoDB Atlas...`);
    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000
    });

    isConnected = true;
    connectionStatus = 'CONNECTED';
    connectionError = null;
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Auto-seed if empty
    try {
      const { autoSeedIfEmpty } = await import('../seed/seeder.js');
      await autoSeedIfEmpty();
    } catch (seedErr) {
      console.warn('Auto-seed check note:', seedErr.message);
    }

    return conn;
  } catch (error) {
    isConnected = false;
    connectionStatus = 'ERROR';
    connectionError = error.message;
    console.error('❌ MongoDB Atlas Connection Error:', error.message);
    console.log('💡 Tip: Ensure IP Address (e.g., 0.0.0.0/0) is whitelisted in MongoDB Atlas Network Access.');
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  connectionStatus = 'DISCONNECTED';
  console.log('⚠️  MongoDB connection lost.');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  connectionStatus = 'CONNECTED';
  connectionError = null;
  console.log('🔄 MongoDB reconnected successfully.');
});

export function getConnectionStatus() {
  return {
    isConnected,
    status: connectionStatus,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null,
    error: connectionError
  };
}
