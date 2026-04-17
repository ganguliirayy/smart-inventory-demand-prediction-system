const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Attempt MongoDB connection with explicit options wrapper
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000, 
      socketTimeoutMS: 45000,
      family: 4 // Force IPv4 (fixes DNS mapping issues randomly leading to timeout on Atlas)
    });

    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error (${error.name}): ${error.message}`);
    // EXTREMELY IMPORTANT: IF DB FAILS, server process must die so Render restarts it properly
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => console.warn('⚠️ MongoDB disconnected from Atlas'));
mongoose.connection.on('error', (err) => console.error(`❌ MongoDB error: ${err.message}`));

module.exports = connectDB;