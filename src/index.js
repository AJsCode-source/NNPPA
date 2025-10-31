const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb'); // Import MongoClient
const multer = require('multer');


// --- MongoDB Connection Setup ---
const uri = "mongodb://localhost:27017/navylogin"; // <--- PUT YOUR MONGO URI HERE
const client = new MongoClient(uri);

let collection; // We will define this *after* we connect

// --- Main Server Function ---
async function startServer() {
  try {
    // 1. Connect to the database
    await client.connect();
    console.log("Successfully connected to MongoDB!");

    // 2. Define your db and collection *after* connecting
    const db = client.db("navy_db"); // <--- REPLACE "navy_db" with your database name
    collection = db.collection("users"); // <--- This is now a valid, connected collection

    // 3. All your Express setup goes *INSIDE* this function
    const app = express();

    // convert data into json format
    app.use(express.json());

    //use express url encoded method
    app.use(express.urlencoded({ extended: false }));

    // Set EJS as the view/templating engine
    app.set('view engine', 'ejs');

    // 1. Make 'uploads' folder public
    // We use path.join to make sure it works on all operating systems
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    //static file
    app.use(express.static("images"));
    app.use(express.static("css")); 
    app.use(express.static("uploads"));


    // --- MULTER CONFIGURATION ---
    // This tells Multer where and how to save the files
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'uploads/'); // <-- Files will be saved in an 'uploads' folder
      },
      filename: function (req, file, cb) {
        // Name the file: [svcNo] + [original file extension]
        // e.g., "test1234.jpg"
        // We get the svcNo from the hidden form field
        const extension = path.extname(file.originalname);
        cb(null, req.body.svcNo + extension);
      }
    });

    const upload = multer({ 
      storage: storage,
      limits: { fileSize: 5 * 1024 * 1024 } // 5 MB file size limit);
    });

    // --- All Routes Go Here ---

    app.get('/', (req, res) => {
      res.render('login', { title: 'Login Page' });
    });

    app.get('/signup', (req, res) => {
      res.render('signup', { title: 'Signup Page' });
    });

    // Register user
    app.post('/signup', async (req, res) => {
      const data = {
        svcNo: req.body.svcNo,
        password: req.body.password
      }

      try {
        const existingUser = await collection.findOne({ svcNo: data.svcNo });
        if (existingUser) {
          return res.status(400).send("Personnel with this Service Number already exists. Please try again.");
        } else {
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(data.password, saltRounds);
          data.password = hashedPassword;

          const userdata = await collection.insertMany([data]);
          console.log(userdata);
          res.render('newProfile', { svcNo: data.svcNo });
        }
      } catch (err) {
        console.error("Signup error:", err);
        res.status(500).send("An error occurred during signup.");
      }
    });

    // User login

    app.post('/login', async (req, res) => {
      try {
        // 1. Find the user
        const check = await collection.findOne({ svcNo: req.body.svcNo });
        if (!check) {
          return res.send("Service Number is not registered. Please sign up first.");
        }

        // 2. Compare the password
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);

        if (isPasswordMatch) {
          // Check if the 'profileComplete' flag is true in the database
          if (check.profileComplete === true) {
            // 4a. If YES, redirect to their finished profile page
            res.redirect('/profile?svcNo=' + check.svcNo);
          } else {
            // 4b. If NO (or the field doesn't exist), send them to the form
            res.render('newProfile', { svcNo: check.svcNo });
          }
        } else {
          // Password was wrong
          res.send("Incorrect password. Please try again.");
        }
      } catch (err) {
        console.error("Login error:", err);
        res.send('An error occurred during login.');
      }
    });

    // Create/Update user profile
    app.post('/create-profile', async (req, res) => {
      try {
        console.log("Form data received:", req.body);
        const filter = { svcNo: req.body.svcNo };

        const updateData = {
          $set: {
            firstName: req.body.firstname,
            middleName: req.body.middlename,
            surname: req.body.surname,
            svcName: req.body.svcname,
            rateRank: req.body.raterank,
            dob: req.body.dob,
            bloodGroup: req.body.bloodgroup,
            maritalStatus: req.body.maritalstatus,
            gender: req.body.gender,
            email: req.body.email,
            phone: req.body.phone,
            currentShip: req.body.currentship,
            specialization: req.body.specialization,
            branch: req.body.branch,
            yrCommissioning: req.body.yrcommissioning,
            course: req.body.course,
            profileComplete: true
          }
        };

        const result = await collection.updateOne(filter, updateData);
        console.log("Database update result:", result);

        if (result.modifiedCount === 1) {
          res.redirect('/profile?svcNo=' + req.body.svcNo);
        } else {
          // This could be matchedCount: 0 (user not found) or modifiedCount: 0 (data was identical)
          res.send("Profile update failed. User not found or no data changed.");
        }
      } catch (err) {
        console.log("Error updating profile:", err);
        res.status(500).send("An error occurred creating your profile");
      }
    });

    // Display the user's personal profile page
    app.get('/profile', async (req, res) => {
      try {
        const svcNo = req.query.svcNo;
        if (!svcNo) {
          return res.send("Cannot display profile: No service number provided.");
        }

        const userData = await collection.findOne({ svcNo: svcNo });
        if (!userData) {
          return res.send("Could not find profile for service number: " + svcNo);
        }

        res.render('profile', { user: userData });

      } catch (error) {
        console.error("Profile display error:", error);
        res.send("An error occurred while fetching your profile.");
      }
    });


    // UPLOAD A PROFILE PHOTO
   app.post('/upload-photo', (req, res) => {
    const uploadMiddleware = upload.single('profilePhoto');

    uploadMiddleware(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).send("File is too large (Limit: 5MB).");
            }
            return res.status(400).send("File upload error: " + err.message);
        } else if (err) {
            return res.status(500).send("An unknown error occurred: " + err.message);
        }

        try {
            if (!req.file) {
                return res.send("No file was uploaded.");
            }

            const svcNo = req.body.svcNo;
            
            // *** USE THE LOCAL FILE PATH ***
            const photoPath = req.file.path; 

            const filter = { svcNo: svcNo };
            const update = { $set: { photoPath: photoPath } };

            const result = await collection.updateOne(filter, update);

            if (result.modifiedCount === 1) {
                res.redirect('/profile?svcNo=' + svcNo);
            } else {
                res.send("Could not update database with photo path.");
            }
        } catch (dbErr) {
            console.error("Error saving photo path to database:", dbErr);
            res.send("An error occurred after file upload.");
        }
    });
});



    // 4. Start the server *last*
    const port = 5000;
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1); // Exit the app if DB connection fails
  }
}

// 5. Run the server
startServer();