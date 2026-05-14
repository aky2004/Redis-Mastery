import mongoose from "mongoose"
import express from "express"
import { createClient } from "redis"

const app = express()
app.use(express.json())

const client = await createClient().on("error", (err) => console.error("Redis Client Error", err)).connect();

const mongoUri = "mongodb://127.0.0.1:27017/test"

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const User = mongoose.model("User", userSchema)

// async function seedUsers() {
//   const firstNames = [
//     "Ava", "Noah", "Mia", "Liam", "Emma", "Olivia", "Lucas", "Sophia",
//     "Ethan", "Isabella", "Amelia", "Mason", "Harper", "Elijah", "Charlotte",
//     "James", "Benjamin", "Ella", "Henry", "Sofia",
//   ]
//   const lastNames = [
//     "Smith", "Johnson", "Brown", "Taylor", "Anderson", "Thomas", "Jackson",
//     "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson",
//     "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall",
//   ]
//   const roles = ["user", "user", "user", "admin", "moderator"]
//   function pick(arr) {
//     return arr[Math.floor(Math.random() * arr.length)]
//   }
//   function randomDateWithinLastDays(days) {
//     const now = new Date()
//     const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
//     return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()))
//   }
//   function makeEmail(firstName, lastName, i) {
//     return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`
//   }
//   const usersToInsert = []
//   for (let i = 1; i <= 800; i++) {
//     const firstName = pick(firstNames)
//     const lastName = pick(lastNames)
//     usersToInsert.push({
//       name: `${firstName} ${lastName}`,
//       email: makeEmail(firstName, lastName, i),
//       role: pick(roles),
//       createdAt: randomDateWithinLastDays(365),
//     })
//   }
//   try {
//     const result = await User.insertMany(usersToInsert)
//     console.log(`✅ Inserted ${result.length} users`)
//   } catch (err) {
//     console.error("❌ Seed error:", err)
//   }
// }

mongoose.connect(mongoUri)
  .then(async () => {
    console.log("✅ Mongoose connected to MongoDB at", mongoUri)
    // await seedUsers()
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err)
    process.exit(1)
  })

app.get("/user-data", async (req, res) => {
  try {
    const cacheKey = generateCacheKey(req);
    
    // Check if data exists in cache
    const cachedData = await client.get(cacheKey);
    if (cachedData) {
      console.log(`✅ Cache HIT for key: ${cacheKey}`);
      return res.json(JSON.parse(cachedData));
    }
    
    console.log(`❌ Cache MISS for key: ${cacheKey}`);
    const query={};
    if(req.query.role){
      query.role=req.query.role;
    }
    const users = await User.find(query);
    
    // Store in cache for 1 hour (3600 seconds)
    await client.setEx(cacheKey, 3600, JSON.stringify(users));
    console.log(`📦 Data cached for key: ${cacheKey}`);
    
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
})


function generateCacheKey(req) {
  const baseURL = req.path.replace(/\//g, ':');
  const params = Object.keys(req.query).sort().map(key => `${key}=${req.query[key]}`).join('&');
  return `${baseURL}?${params}`;
}

app.put("/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Invalidate all user-data cache keys
    const cachePattern = "*user-data*";
    const keys = await client.keys(cachePattern);
    
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`🗑️  Cleared ${keys.length} cache keys after update`);
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
})




const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})