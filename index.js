const express = require("express");
const session = require('express-session');
const app = express();
const path = require("path");
const bcrypt = require("bcrypt");
const multer = require("multer");
const SignUpModel = require("./mongodb");
const fs = require("fs");
const hbs = require('hbs');

app.use(session({
    secret: '6872902bd9b071f8de204a8497970de369b20626e3ca6148dda8beffada56281', 
    resave: true,
     saveUninitialized: true
    }))



app.use('/public', express.static('public'));
app.use('/designs', express.static('designs')); // register the new folder


const Classroom = require('./classroomModel');
const TaskModel = require('./taskModel');
const CommentModel = require('./commentModel');
const Attendance = require('./attendanceModel');
const CalendarSettings = require('./calendarModel');
const Event = require('./addEvent');
const Notes = require('./addNote');
const Chats = require('./addChat');
// const TeacherChats = require('./addChatTeacher');
const Star = require('./addStar');
const Report = require('./sendReport');





const templatePath = path.join(__dirname, '../templates');
const imagesDirectory = path.join(__dirname, 'uploads', 'images');


// require("./attendance")(app);// for including routes :))



function formatDateToFolderName(date) {
    const year = date.getFullYear();
    let month = date.getMonth() + 1; // Month is zero-indexed
    month = month < 10 ? `0${month}` : `${month}`;
    let day = date.getDate();
    day = day < 10 ? `0${day}` : `${day}`;
    return `${year}-${month}-${day}`;
}

app.use('/images', express.static(imagesDirectory));

const uploadPath = path.join(__dirname, 'uploads/images');
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const userId = req.body.userId; 

        if (!userId) {
            return cb(new Error('userId is not provided'));
        }

        const isGuardianPicture = file.fieldname === 'guardianPicture';
        const lastName = req.body.Glastname; 

        if (!lastName) {
            return cb(new Error('Last name is not provided'));
        }

        const pictureType = isGuardianPicture ? 'guardian' : 'student'; 
        const uniqueFilename = `${lastName}_${pictureType}_${userId}${path.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
});

const upload = multer({ storage: storage });

// Directory for attendance pictures
// const attendancePicturesPath = path.join(__dirname, 'uploads/attendancePictures');
// if (!fs.existsSync(attendancePicturesPath)) {
//     fs.mkdirSync(attendancePicturesPath, { recursive: true });
// }

// // Multer configuration for attendance pictures
// const attendanceStorage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, attendancePicturesPath);
//     },
//     filename: function (req, file, cb) {
//         const { classCode, userId } = req.body;

//         if (!classCode || !userId) {
//             return cb(new Error('classCode or userId is not provided'));
//         }

//         const currentDate = new Date();
//         const formattedDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;

//         const uniqueFilename = `${classCode}_${userId}_${formattedDate}${path.extname(file.originalname)}`;
//         cb(null, uniqueFilename);
//     }
// });

// const attendanceUpload = multer({ storage: attendanceStorage });


app.use(express.static("uploads/images"));
app.use(express.static("uploads"));
app.use(express.json());
app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(express.urlencoded({ extended: false }));

hbs.registerHelper('formatDate', function (date) {
    return new Date(date).toLocaleDateString(); // Adjust format as needed
});

hbs.registerHelper('range', function (start, end) {
    const array = [];
    for (let i = start; i <= end; i++) {
        array.push(i);
    }
    return array;
});

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());




app.get("/",(req, res) => {
    res.render("login", { wrongPassword: false });

    
});

// app.post("/login", async (req, res) => {
//     const { username, password } = req.body;
//     console.log("Attempting login with username:", username);

//     if (!username || !password) {
//         console.log("Blank fields detected");
//         return res.render("login", { blankFields: true });
//     }

//     try {
//         const user = await SignUpModel.findOne({ username });
//         console.log("User found:", user);

//         if (!user) {
//             console.log("User not found with username:", username);
//             return res.render("login", { wrongName: true });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);
//         console.log("Password match:", isMatch);

//         if (!isMatch) {
//             console.log("Incorrect password");
//             return res.render("login", { wrongPassword: true });
//         }

//         if (user.status === 'pending') {
//             console.log("User status is pending");
//             return res.redirect(`/status-pending/${user.userId}`);
//         }
//         if (user.status === 'denied') {
//             console.log("User status is denied");
//             return res.redirect(`/status-denied/${user.userId}`);
//         }

//         console.log("Login successful");
//         res.redirect(`/home/${user.userId}`);
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Internal Server Error");
//     }
// });

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log("Attempting login with username:", username);

    if (!username || !password) {
        console.log("Blank fields detected");
        return res.render("login", { blankFields: true });
    }

    try {
        const user = await SignUpModel.findOne({ username });
        console.log("User found:", user);

        if (!user) {
            console.log("User not found with username:", username);
            return res.render("login", { wrongName: true });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match:", isMatch);

        if (!isMatch) {
            console.log("Incorrect password");
            return res.render("login", { wrongPassword: true });
        }

        if (user.status === 'pending') {
            console.log("User status is pending");
            return res.redirect(`/status-pending/${user.userId}`);
        }
        if (user.status === 'denied') {
            console.log("User status is denied");
            return res.redirect(`/status-denied/${user.userId}`);
        }

        // Set session userId
        req.session.userId = user.userId;
        console.log("Login successful");
        res.redirect(`/home/${user.userId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/homee/:userId', isAuthenticated, (req, res) => {
    res.render('homee');
});


function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        res.redirect('/');
    }
}
// app.post("/login", async (req, res) => {
//     const { username, password } = req.body;
//     console.log("Attempting login with username:", username);

//     if (!username || !password) {
//         console.log("Blank fields detected");
//         return res.render("login", { blankFields: true });
//     }

//     try {
//         const user = await SignUpModel.findOne({ username });
//         console.log("User found:", user);

//         if (!user) {
//             console.log("User not found with username:", username);
//             return res.render("login", { wrongName: true });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);
//         console.log("Password match:", isMatch);

//         if (!isMatch) {
//             console.log("Incorrect password");
//             return res.render("login", { wrongPassword: true });
//         }

//         if (user.status === 'pending') {
//             console.log("User status is pending");
//             return res.redirect(`/status-pending/${user.userId}`);
//         }
//         if (user.status === 'denied') {
//             console.log("User status is denied");
//             return res.redirect(`/status-denied/${user.userId}`);
//         }

//         // Login successful, set the session cookie
//         const token = user.generateAccessJWT(); // Assuming this function generates the JWT
//         const options = {
//             maxAge: 20 * 60 * 1000, // Expires in 20 minutes
//             httpOnly: true, // Cookie is only accessible by the web server
//             secure: false, // Set to false in development; true for production with HTTPS
//             sameSite: "Lax", // Use "Lax" or "Strict" for development; "None" for cross-site requests with HTTPS
//         };

//         res.cookie("SessionID", token, options);

//         console.log("Login successful, setting cookie and redirecting");
//         res.redirect(`/home/${user.userId}`);
//         res.status(200).json({
//             status: "success",
//             message: "You have successfully logged in.",
//         });



//     } catch (err) {
//         console.error(err);
//         res.status(500).json({
//             status: "error",
//             code: 500,
//             data: [],
//             message: "Internal Server Error",
//         });
//     }
// });


app.get("/admin-users/:classCode", async (req, res) => {
    try {
        const classCode = req.params.classCode;
        if (!classCode) {
            return res.status(400).send("Class code is required");
        }

        const users = await SignUpModel.find({ classCode: classCode, status: 'accepted' });
        const pendingSignupsCount = await SignUpModel.countDocuments({ classCode: classCode, status: 'pending'  });

        res.render("admin-users", { classCode, users, pendingSignupsCount: pendingSignupsCount  }); 
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

// app.get("/teacher-attendance/:classCode", async (req, res) => {
//     try {
//         const classCode = req.params.classCode;
//         if (!classCode) {
//             return res.status(400).send("Class code is required");
//         }

//         const users = await SignUpModel.find({ classCode: classCode, status: 'accepted' });
//         const pendingSignupsCount = await SignUpModel.countDocuments({ classCode: classCode, status: 'pending'  });

//         res.render("teacher-attendance", { classCode, users, pendingSignupsCount: pendingSignupsCount  }); 
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Internal Server Error");
//     }
// });

app.get("/signup", (req, res) => {
    const userId = generateRandomId();
    res.render("signup", { userId: userId });
});



function generateRandomId() {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let userId = '';
    for (let i = 0; i < 8; i++) {
        userId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return userId;
}

app.post("/signup", upload.fields([{ name: 'guardianPicture', maxCount: 1 }, { name: 'studentPicture', maxCount: 1 }]), async (req, res) => {
 
    const userId = req.body.userId;

    if (!userId) {
        return res.status(400).send("userId is missing in the request");
    }

    if (!req.files || !req.files['guardianPicture'] || !req.files['studentPicture']) {
        console.log("Files not uploaded correctly", req.files);
        return res.status(400).send("Guardian or student picture is missing.");
    }

    const guardianPicturePath = req.files['guardianPicture'][0].path;
    const studentPicturePath = req.files['studentPicture'][0].path;

    const data = {
        userId: userId, 
        Glastname: req.body.Glastname,
        Gfirstname: req.body.Gfirstname,
        Gmiddleinitial: req.body.Gmiddleinitial,
        Slastname: req.body.Slastname,
        Sfirstname: req.body.Sfirstname,
        Smiddleinitial: req.body.Smiddleinitial,
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        classCode: req.body.classCode,
        number: "+63" + req.body.number,
        address: req.body.address,
        sex: req.body.sex,
        birthdate: req.body.birthdate,
        guardianPicture: guardianPicturePath,
        studentPicture: studentPicturePath,
        status: "pending" ,
        role: "student"
    };

    console.log("Data received from the signup form:", data);

    try {
        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);

        const existingUser = await SignUpModel.findOne({ username: data.username });
        if (existingUser) {
            return res.status(400).send("Username already exists. Please choose a different username.");
        }

        const newUser = await SignUpModel.create(data);

        if (newUser.status === 'pending') {
            res.redirect(`/status-pending/${newUser.userId}`);
        } else {
           
            res.redirect(`/home/${newUser.userId}`);
        }
        
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});







app.get("/create-classroom", (req, res) => {
    const userId = generateRandomId();
    res.render("create-classroom",{ userId: userId });
});

// Function to generate random userId
function generateRandomId() {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let userId = '';
    for (let i = 0; i < 10; i++) {
        userId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return userId;
}








app.get("/status-pending/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
      
        const user = await SignUpModel.findOne({ userId: userId });
        if (!user) {
            return res.status(404).send("User not found");
        }
     
        res.render("status-pending", { user: user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});
app.get("/status-denied/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
       
        const user = await SignUpModel.findOne({ userId: userId });
        if (!user) {
            return res.status(404).send("User not found");
        }
       
        res.render("status-denied", { user: user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/pending-signups/:classCode", async (req, res) => {
    try {
        const classCode = req.params.classCode;
        if (!classCode) {
            return res.status(400).send("Class code is required");
        }

        const pendingSignups = await SignUpModel.find({ classCode: classCode, status: 'pending' });
        const pendingSignupsCount = await SignUpModel.countDocuments({ classCode: classCode, status: 'pending' });
        
        res.render("pending-signups", { signups: pendingSignups, classCode: classCode, pendingSignupsCount: pendingSignupsCount });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


app.post("/accept-signup/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await SignUpModel.findOneAndUpdate({ userId: userId }, { status: "accepted" });
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.send("Signup request accepted successfully.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


app.post("/deny-signup/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await SignUpModel.findOneAndUpdate({ userId: userId }, { status: "denied" });
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.send("Signup request denied successfully.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


// app.get("/home/:userId", async (req, res) => {
//     try {
//         console.log("Fetching user information for userId:", req.params.userId);
//         const user = await SignUpModel.findOne({ userId: req.params.userId });
//         if (!user) {
//             return res.status(404).send("User not found");
//         }
//         console.log("User information:", user);
//         res.render("home", user.toObject());
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Internal Server Error");
//     }
// });






app.get("/userinfo/:userId", async (req, res) => {
    try {
        const user = await SignUpModel.findOne({ userId: req.params.userId });
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.render("userinfo", { user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/userinfo-edit/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await SignUpModel.findOne({ userId });

        if (!user) {
            return res.status(404).send('User not found');
        }

      
        res.render('userinfo-edit', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.post("/delete-user/:userId", async (req, res) => {
    try {
        const user = await SignUpModel.findOne({ userId: req.params.userId });
        
        if (!user) {
            return res.status(404).send("User not found");
        }

        const guardianImagePath = path.join(__dirname, `//uploads//images/${user.Glastname}_guardian_${user.userId}.jpg`);
        const studentImagePath = path.join(__dirname, `//uploads//images/${user.Slastname}_student_${user.userId}.jpg`);
           
        fs.unlink(guardianImagePath, (err) => {
            if (err) {
                console.error("Error deleting guardian image:", err);
            } else {
                console.log("Guardian image deleted successfully");
            }
        });
        
        fs.unlink(studentImagePath, (err) => {
            if (err) {
                console.error("Error deleting student image:", err);
            } else {
                console.log("Student image deleted successfully");
            }
        });

        await SignUpModel.deleteOne({ userId: req.params.userId });

        res.redirect(`/admin-users/${userId}?success=true`)
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/admin-edituser/:userId", async (req, res) => {
    try {
        const user = await SignUpModel.findOne({ userId: req.params.userId });
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.render("admin-edituser", { user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/update-user/:userId', upload.fields([
    { name: 'guardianPicture', maxCount: 1 },
    { name: 'studentPicture', maxCount: 1 }
]), async (req, res) => {
    const userId = req.params.userId;

    try {
        // Find the user by userId
        const user = await SignUpModel.findOne({ userId });

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update user object with form data
        user.Glastname = req.body.Glastname || user.Glastname;
        user.Gfirstname = req.body.Gfirstname || user.Gfirstname;
        user.Gmiddleinitial = req.body.Gmiddleinitial || user.Gmiddleinitial;
        user.Slastname = req.body.Slastname || user.Slastname;
        user.Sfirstname = req.body.Sfirstname || user.Sfirstname;
        user.Smiddleinitial = req.body.Smiddleinitial || user.Smiddleinitial;
        user.username = req.body.username || user.username;
        user.password = req.body.password; // Update password separately if changed
        user.email = req.body.email || user.email;
        user.number = req.body.number || user.number;
        user.sex = req.body.sex || user.sex;
        user.passCode = req.body.passCode || user.passCode;
        user.classCode = req.body.classCode || user.classCode;

        // Handle file uploads if new pictures are provided
        if (req.files['guardianPicture']) {
            const guardianPicturePath = req.files['guardianPicture'][0].path;
            // Delete previous guardian picture if exists
            if (user.guardianPicture) {
                const previousGuardianPicturePath = path.join(__dirname, 'uploads/images', user.guardianPicture);
                if (fs.existsSync(previousGuardianPicturePath)) {
                    fs.unlinkSync(previousGuardianPicturePath);
                }
            }
            user.guardianPicture = guardianPicturePath;
        }

        if (req.files['studentPicture']) {
            const studentPicturePath = req.files['studentPicture'][0].path;
            // Delete previous student picture if exists
            if (user.studentPicture) {
                const previousStudentPicturePath = path.join(__dirname, 'uploads/images', user.studentPicture);
                if (fs.existsSync(previousStudentPicturePath)) {
                    fs.unlinkSync(previousStudentPicturePath);
                }
            }
            user.studentPicture = studentPicturePath;
        }

        // Save updated user
        await user.save();

        console.log('User updated successfully:', user);
        res.redirect(`/userinfo/${userId}`); // Redirect to user info page or wherever appropriate
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).send('Error updating user');
    }
});





app.get("/creating-classroom", (req, res) => {
    res.render("creating-classroom");
});


app.get("/signup-teacher", (req, res) => {
    const userId = generateRandomId();
    res.render("signup-teacher");
});

function generateRandomId() {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let classCode = '';
    for (let i = 0; i < 10; i++) {
        classCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return classCode;
}





app.post("/login-classroom", async (req, res) => {
    const { teacher_username, teacher_password } = req.body;
    try {
        const classroom = await Classroom.findOne({ teacher_username: teacher_username, teacher_password: teacher_password });
        if (!classroom) {
            return res.status(401).send("Invalid username or password");
        }

      
        if (classroom.teacher_password !== teacher_password) {
            return res.status(401).send("Invalid username or password");
        }

       
        res.redirect(`/classroom/${classroom.classCode}`);
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/classroom/:classCode", async (req, res) => {
    try {
        const classCode = req.params.classCode;
        const classroom = await Classroom.findOne({ classCode: classCode });
        if (!classroom) {
            return res.status(404).send("Classroom not found");
        }
        const pendingSignups = await SignUpModel.find({ classCode: classCode, status: 'pending' });
        const pendingSignupsCount = await SignUpModel.countDocuments({ classCode: classCode, status: 'pending' });
       
        res.render("classroom", { classroom: classroom, pendingSignups: pendingSignups, pendingSignupsCount: pendingSignupsCount });
    } catch (error) {
        console.error("Error fetching classroom details:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/process-signup", async (req, res) => {
    const { userId, action, classCode } = req.body;

    try {
        if (action === 'accept') {
            await SignUpModel.updateOne({ userId: userId }, { $set: { status: 'accepted' } });
        
        } else if (action === 'deny') {
            await SignUpModel.updateOne({ userId }, { status: 'denied' });
        } else {
            res.status(400).send({ success: false, message: 'Invalid action.' });
        }
      
        res.redirect('back');
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
});

app.post("/process-signup-view-userinfo", async (req, res) => {
    const { userId, action } = req.body;

    try {
        const signUpInfo = await SignUpModel.findOne({ userId });
        
        if (!signUpInfo) {
            return res.status(404).send({ success: false, message: 'User sign-up information not found.' });
        }

        const classCode = signUpInfo.classCode; 

        if (action === 'accept') {
            await SignUpModel.updateOne({ userId }, { status: 'accepted' });
        } else if (action === 'deny') {
            await SignUpModel.updateOne({ userId }, { status: 'denied' });
        } else {
            return res.status(400).send({ success: false, message: 'Invalid action.' });
        }

        res.redirect(`/denied-signups/${classCode}`);
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
});


app.get("/login-classroom", (req, res) => {
    res.render("login-classroom");
});

app.post("/login-classroom", async (req, res) => {
    const { teacher_username, teacher_password } = req.body;
    console.log("Attempting login with username:", teacher_username);

    if (!teacher_username || !teacher_password) {
        console.log("Blank fields detected");
        return res.status(400).send("Username and password are required");
    }

    try {
        const classroom = await Classroom.findOne({ teacher_username });
        console.log("Classroom found:", classroom);

        if (!classroom) {
            console.log("Classroom not found with username:", teacher_username);
            return res.status(401).send("Invalid username or password");
        }

        if (classroom.teacher_password !== teacher_password) {
            console.log("Incorrect password");
            return res.status(401).send("Invalid username or password");
        }

        console.log("Login successful");
        res.redirect(`/classroom/${classroom.classCode}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/teacher-taskboard/:classCode", async (req, res) => {
    try {
        const classCode = req.params.classCode;

        const classroom = await Classroom.findOne({ classCode: classCode });

        if (!classroom) {
            return res.status(404).send("Classroom not found");
        }
        const userId = classroom.userId; 


        const tasks = await TaskModel.find({ classCode: classCode }).sort({ createdAt: -1 });

        console.log("Fetched tasks:", tasks);

        
        res.render("teacher-taskboard", { classCode, tasks, userId });

    } catch (error) {
        console.error("Error rendering teacher-taskboard:", error);
        res.status(500).send("Internal Server Error");
    }
});
app.get('/user-taskboard', async (req, res) => {
    try {
        const { userId, classCode } = req.query;
        console.log('Fetching tasks for userId:', userId, 'and classCode:', classCode);
        
        const tasks = await TaskModel.find({ classCode: classCode }).sort({ createdAt: -1 });
        console.log('Fetched tasks:', tasks);

        res.render('user-taskboard', { userId: userId, classCode: classCode, tasks: tasks });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.post('/post-task', async (req, res) => {
    const { content, classCode,postTitle } = req.body;

    try {
      
        const existingTasksCount = await TaskModel.countDocuments({ classCode: classCode });
        const taskNumber = existingTasksCount + 1;

        const newTask = new TaskModel({
            content: content,
            classCode: classCode,
            createdAt: new Date(),
            taskNumber: taskNumber ,
            postTitle: postTitle
        });
          
        const savedTask = await newTask.save();
      
        res.status(201).json({ message: 'Task posted successfully', task: savedTask });
    } catch (error) {
        console.error('Error posting task:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/delete-task/:taskId', async (req, res) => {
    try {
        const taskId = req.params.taskId;
       
        await TaskModel.deleteOne({ _id: taskId });
        res.status(204).send(); 
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.put('/update-task/:taskId', async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const { content } = req.body;
        const updatedTask = await TaskModel.findByIdAndUpdate(taskId, { content, edited: true }, { new: true });
        if (!updatedTask) {
            return res.status(404).send('Task not found');
        }

        res.status(200).json({ message: 'Task updated successfully', task: updatedTask });
       
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/count-pending-requests/:classCode', async (req, res) => {
    const { classCode } = req.params;

    try {
        const pendingRequestsCount = await SignUpModel.countDocuments({ classCode: classCode, status: 'pending' });

        res.json({ count: pendingRequestsCount });
    } catch (error) {
        console.error('Error counting pending requests:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/denied-signups/:classCode', async (req, res) => {
    const classCode = req.params.classCode;

    try {

        const deniedSignups = await SignUpModel.find({ status: 'denied', classCode: classCode });

        const pendingSignupsCount = await SignUpModel.countDocuments({ status: 'pending', classCode: classCode });

        res.render('denied-signups', { signups: deniedSignups, pendingSignupsCount: pendingSignupsCount, classCode: classCode });
    } catch (err) {

        console.error('Error fetching denied signups:', err);
        res.status(500).send('Error fetching denied signups');
    }
});




app.get("/view-userinfo/:userId", async (req, res) => {
    try {
        const user = await SignUpModel.findOne({ userId: req.params.userId });
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.render("view-userinfo", { user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


app.post('/post-task', async (req, res) => {
    const { content, classCode, postTitle } = req.body;

    try {
        const existingTasksCount = await TaskModel.countDocuments({ classCode });
        const taskNumber = existingTasksCount + 1;

        const newTask = new TaskModel({
            content,
            classCode,
            createdAt: new Date(),
            taskNumber,
            postTitle
        });

        const savedTask = await newTask.save();

        res.status(201).json({ message: 'Task posted successfully', task: savedTask });
    } catch (error) {
        console.error('Error posting task:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.get('/user-taskboard', async (req, res) => {
    try {
        const { userId, classCode } = req.query;
        console.log('Fetching tasks for userId:', userId, 'and classCode:', classCode);
        
        const tasks = await TaskModel.find({ classCode: classCode }).sort({ createdAt: -1 });
        console.log('Fetched tasks:', tasks);

        res.render('user-taskboard', { userId: userId, classCode: classCode, tasks: tasks });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/post-comment/:taskNumber', async (req, res) => {
    const { userId, classCode, taskNumber, content } = req.body;
    const taskId = req.params.taskNumber; 

    try {
        if (!userId || !classCode || !taskNumber || !content) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

      
       
        const user = await SignUpModel.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

     
        const { Gfirstname, Glastname, guardianPicture, } = user;

        
        const newComment = new CommentModel({
            userId,
            classCode,
            taskNumber,
            content,
            Gfirstname,
            Glastname,
            guardianPicture,
         
            createdAt: new Date()
        });

        const savedComment = await newComment.save();

        res.status(201).json({ message: 'Comment posted successfully', comment: savedComment });
    } catch (error) {
        console.error('Error posting comment:', error);
        res.status(500).json({ message: 'Failed to post comment. Please try again.' });
    }
});



app.get('/user-comment-section/:userId/:classCode/:taskNumber', async (req, res) => {
    const { userId, classCode, taskNumber } = req.params;
    try {
        // Fetch comments related to classCode and taskNumber
        const comments = await CommentModel.find({ classCode, taskNumber }).sort({ createdAt: -1 });

        // Fetch task details based on taskNumber
        const task = await TaskModel.findOne({ taskNumber });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const taskContent = task.content;
        const postTitle = task.postTitle;
        const createdAt = task.createdAt;
       
        // Fetch all users associated with classCode from Classroom
        const usersFromClassroom = await Classroom.find({ classCode });

        // Fetch user details from SignUpModel for each comment
        const commentsWithUserDetails = await Promise.all(comments.map(async (comment) => {
            let user;

            // Check if the user is from Classroom
            const classroomUser = usersFromClassroom.find(user => user.userId === comment.userId);
            if (classroomUser) {
                user = {
                    Glastname: classroomUser.Glastname || "Unknown",
                    Gfirstname: classroomUser.Gfirstname || "Unknown",
                    guardianImage: classroomUser.guardianPicture || null,
                    isClassroomUser: true // Flag to identify Classroom user
                };
            } else {
                // Otherwise, fetch from SignUpModel
                const signUpUser = await SignUpModel.findOne({ userId: comment.userId });
                if (signUpUser) {
                    user = {
                        Glastname: signUpUser.Glastname || "Unknown",
                        Gfirstname: signUpUser.Gfirstname || "Unknown",
                        guardianImage: null, // Assuming guardianImage is not available in SignUpModel
                        isClassroomUser: false // Flag to identify SignUpModel user
                    };
                } else {
                    user = {
                        Glastname: "Unknown",
                        Gfirstname: "Unknown",
                        guardianImage: null,
                        isClassroomUser: false
                    };
                }
            }

            return {
                ...comment.toObject(),
                Glastname: user.Glastname,
                Gfirstname: user.Gfirstname,
                guardianImage: user.guardianImage,
                isClassroomUser: user.isClassroomUser // Include the flag in the comment object
            };
        }));

        
        res.render('user-comment-section', {
            classCode,
            taskNumber,
            comments: commentsWithUserDetails,
            userId,
            taskContent,
            postTitle,
            createdAt,
            classroomUserStyle: true // Flag to indicate Classroom users
        });

    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.get('/teacher-comment-section/:userId/:classCode/:taskNumber', async (req, res) => {
    const { userId, classCode, taskNumber } = req.params;
    try {
        // Fetch comments related to classCode and taskNumber
        const comments = await CommentModel.find({ classCode, taskNumber }).sort({ createdAt: -1 });

        // Fetch task details based on taskNumber
        const task = await TaskModel.findOne({ taskNumber });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const taskContent = task.content;
        const postTitle = task.postTitle;
        const createdAt = task.createdAt;
       
        // Fetch all users associated with classCode from Classroom
        const usersFromClassroom = await Classroom.find({ classCode });

        // Fetch user details from SignUpModel for each comment
        const commentsWithUserDetails = await Promise.all(comments.map(async (comment) => {
            let user;

            // Check if the user is from Classroom
            const classroomUser = usersFromClassroom.find(user => user.userId === comment.userId);
            if (classroomUser) {
                user = {
                    Glastname: classroomUser.Glastname || "Unknown",
                    Gfirstname: classroomUser.Gfirstname || "Unknown",
                    guardianImage: classroomUser.guardianPicture || null,
                    isClassroomUser: true // Flag to identify Classroom user
                };
            } else {
                // Otherwise, fetch from SignUpModel
                const signUpUser = await SignUpModel.findOne({ userId: comment.userId });
                if (signUpUser) {
                    user = {
                        Glastname: signUpUser.Glastname || "Unknown",
                        Gfirstname: signUpUser.Gfirstname || "Unknown",
                        guardianImage: null, // Assuming guardianImage is not available in SignUpModel
                        isClassroomUser: false // Flag to identify SignUpModel user
                    };
                } else {
                    user = {
                        Glastname: "Unknown",
                        Gfirstname: "Unknown",
                        guardianImage: null,
                        isClassroomUser: false
                    };
                }
            }

            return {
                ...comment.toObject(),
                Glastname: user.Glastname,
                Gfirstname: user.Gfirstname,
                guardianImage: user.guardianImage,
                isClassroomUser: user.isClassroomUser // Include the flag in the comment object
            };
        }));

        
        res.render('teacher-comment-section', {
            classCode,
            taskNumber,
            comments: commentsWithUserDetails,
            userId,
            taskContent,
            postTitle,
            createdAt,
            classroomUserStyle: true // Flag to indicate Classroom users
        });

    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/teacher-post-comment/:taskNumber', async (req, res) => {
    const { userId, classCode, taskNumber, content } = req.body;
    const taskId = req.params.taskNumber; 

    try {
        if (!userId || !classCode || !taskNumber || !content) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

      
       
        const user = await Classroom.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

     
        const { Gfirstname, Glastname, guardianPicture, } = user;

        
        const newComment = new CommentModel({
            userId,
            classCode,
            taskNumber,
            content,
            Gfirstname,
            Glastname,
            guardianPicture,
         
            createdAt: new Date()
        });

        const savedComment = await newComment.save();

        res.status(201).json({ message: 'Comment posted successfully', comment: savedComment });
    } catch (error) {
        console.error('Error posting comment:', error);
        res.status(500).json({ message: 'Failed to post comment. Please try again.' });
    }
});




app.delete('/delete-comment/:commentId', async (req, res) => {
    const { commentId } = req.params;

    try {
        const deletedComment = await CommentModel.findByIdAndDelete(commentId);

        if (!deletedComment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        res.status(200).json({ message: 'Comment deleted successfully' });
        
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});











app.get('/mark-attendance/:classCode', async (req, res) => {
    const { classCode } = req.params; // Retrieve classCode from route parameters
    res.render('mark-attendance', { classCode }); // Pass classCode to the template
});


app.get('/trigger-cam/:classCode', async (req, res) => {
    res.render("trigger-cam");
});



// helper function to format date to folder name (YYYY-MM-DD)
function formatDateToFolderName(date) {
    const year = date.getFullYear();
    let month = date.getMonth() + 1; // mMonth is zero-indexed
    month = month < 10 ? `0${month}` : `${month}`;
    let day = date.getDate();
    day = day < 10 ? `0${day}` : `${day}`;
    return `${year}-${month}-${day}`;
}

app.get('/calendar/settings/:classCode', async (req, res) => {
    try {
        const { classCode } = req.params;
        const settings = await CalendarSettings.findOne({ classCode });
        res.json(settings);
    } catch (err) {
        console.error('Error fetching calendar settings:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/teacher-attendance/:classCode', async (req, res) => {
    try {
        const { classCode } = req.params;
        if (!classCode) {
            return res.status(400).send('Class code is required');
        }

        const today = new Date();
        const year = today.getFullYear();
        let month = String(today.getMonth() + 1).padStart(2, '0'); // Month is zero-indexed
        let day = String(today.getDate()).padStart(2, '0');
        const folderName = `${year}-${month}-${day}`;

        // fetch students who have accepted the classCode
        const acceptedStudents = await SignUpModel.find({ classCode: classCode, status: 'accepted' });
        const acceptedUserIds = acceptedStudents.map(student => student.userId);

        // fetch attendance records for today
        const attendanceRecords = await Attendance.find({
            classCode: classCode,
            attendanceStatus: 'present',
            folder: folderName
        });

        
        const presentUserIds = attendanceRecords.map(record => record.userId);

        // filter accepted students who are not yet marked as present today
        const studentsNotMarkedPresent = acceptedStudents.filter(student => !presentUserIds.includes(student.userId));

        res.render('teacher-attendance', { classCode, studentsNotMarkedPresent, attendanceRecords });

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/submit-attendance', async (req, res) => {
    try {
        const { userId, Slastname, Sfirstname, classCode, attendanceStatus } = req.body;
        const folder = formatDateToFolderName(new Date()); // ggenerate folder name 

    
        const newAttendance = new Attendance({
            userId,
            Slastname,
            Sfirstname,
            classCode,
            attendanceStatus,
            folder,
        });

        const savedAttendance = await newAttendance.save();
        console.log('Attendance saved:', savedAttendance);

        res.status(201).send('Attendance recorded successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/add-attendance/:classCode', async (req, res) => {
    try {
        const { classCode } = req.params;

        res.render('add-attendance', { classCode });
    } catch (error) {
        console.error('Error handling add attendance:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/api/calendar/settings/:classCode', async (req, res) => {
    const { classCode } = req.params;
    const { startYear, startMonth, startDay, endYear, endMonth, endDay } = req.body;

    try {
        // find the classroom information
        const classroomInfo = await Classroom.findOne({ classCode });
        if (!classroomInfo) {
            return res.status(404).send('Classroom not found.');
        }

     
        let calendarSettings = await CalendarSettings.findOne({ classCode });

        if (!calendarSettings) {
            calendarSettings = new CalendarSettings({
                classCode,
               
                Glastname: classroomInfo.Glastname,
                Gfirstname: classroomInfo.Gfirstname,
                schoolName: classroomInfo.schoolName,
            });
        }

      
        calendarSettings.startYear = startYear;
        calendarSettings.startMonth = startMonth;
        calendarSettings.startDay = startDay;
        calendarSettings.endYear = endYear;
        calendarSettings.endMonth = endMonth;
        calendarSettings.endDay = endDay;

    
        await calendarSettings.save();
        
        res.status(200).json({
            calendarSettings,
        });
        
    } catch (error) {
        console.error('Error saving calendar settings:', error);
        res.status(500).send('Failed to save calendar settings.');
    }
});



app.get('/api/calendar/settings/:classCode', async (req, res) => {
    const { classCode } = req.params;

    try {
        const calendarSettings = await CalendarSettings.findOne({ classCode });

        if (!calendarSettings) {
            return res.status(404).json({ message: 'Calendar settings not found' });
        }
        
        res.status(200).json(calendarSettings);
    } catch (error) {
        console.error('Error fetching calendar settings:', error);
        res.status(500).send('Failed to fetch calendar settings.');
    }
});

app.get('/teacher-calendar/:classCode', async (req, res) => {
    const { classCode } = req.params;

    try {
      
        const calendarSettings = await CalendarSettings.findOne({ classCode });

        if (!calendarSettings) {
            return res.render('teacher-calendar', { classCode, calendarSettingsJSON: null });
        }

        const calendarSettingsJSON = JSON.stringify(calendarSettings);

        res.render('teacher-calendar', { classCode, calendarSettingsJSON });
    } catch (error) {
        console.error('Error fetching calendar settings:', error);
        res.status(500).send('Failed to fetch calendar settings.');
    }
});

// Example Express route for /view-attendance/:classCode
app.get('/view-attendance/:classCode', async (req, res) => {
    const { classCode } = req.params;
    const { day, month, year } = req.query;

    // Parse day, month, year to create a Date object for comparison
    const targetDate = new Date(`${month} ${day} ${year}`);

    try {
        // Query Attendance records matching classCode and createdAt date
        const attendanceData = await Attendance.find({
            classCode,
            createdAt: {
                $gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
                $lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
            }
        });

        // Render view-attendance.hbs template with the retrieved data
        res.render('view-attendance', {
            classCode,
            day: targetDate.getDate(),
            month: targetDate.toLocaleString('en-US', { month: 'long' }),
            year: targetDate.getFullYear(),
            attendanceData
        });
    } catch (error) {
        console.error('Error fetching attendance data:', error);
        res.status(500).send('Error fetching attendance data');
    }
});




app.get("/welcome", (req, res) => {
    res.render("welcome");
});

app.get("/todd-signup", (req, res) => {
    res.render("todd-signup");
});



app.get("/todd-signin", (req, res) => {
    res.render("todd-signin");
});

app.post("/todd-signin", async (req, res) => {
    const { teacher_username, teacher_password } = req.body;

   // check if username or password is blank
   if (!teacher_username || !teacher_password) {
    console.log("Blank fields detected");
    return res.render("todd-signin", { blankFields: true });
}

    console.log("Attempting login with username:", teacher_username);

    try {
        // find teacher in Classroom collection by username
       const classroom = await Classroom.findOne({ teacher_username: teacher_username, teacher_password: teacher_password });

        if (!classroom) {
            // if no user found with the given username
            console.log("User not found with username:", teacher_username);
            return res.render("todd-signin", { noUser: true });
        }


        if (classroom.teacher_password !== teacher_password) {
            console.log("Wrong password", teacher_username);

            return res.render("todd-signin", { wrongPass: true });
        }


        // if username and password match, redirect to classroom page
        res.redirect(`/todd-home/${classroom.classCode}`);
        
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).send("Internal Server Error");
    }
});



app.get("/todd-home/:classCode", async(req, res) => {
    try {
        const classCode = req.params.classCode;
        const classroom = await Classroom.findOne({ classCode: classCode });
      
  if (!classroom) {
            return res.status(404).send("Classroom not found");
        }

        const today = new Date();
        const year = today.getFullYear();
        let month = String(today.getMonth() + 1).padStart(2, '0'); 
        let day = String(today.getDate()).padStart(2, '0');
        const folderName = `${year}-${month}-${day}`;

        // fetch students who have accepted the classCode
        const acceptedStudents = await SignUpModel.find({ classCode: classCode, status: 'accepted' });
        const acceptedUserIds = acceptedStudents.map(student => student.userId);

        // fetch attendance records for today
        const attendanceRecords = await Attendance.find({
            classCode: classCode,
            attendanceStatus: 'present',
            folder: folderName
        });

        const presentCount = attendanceRecords.length;
        const studentsCount = acceptedStudents.length;
        const presentUserIds = attendanceRecords.map(record => record.userId);
        
        const absents = studentsCount-presentCount;
        // filter accepted students who are not yet marked as present today
        const studentsNotMarkedPresent = acceptedStudents.filter(student => !presentUserIds.includes(student.userId));



        const pendingSignups = await SignUpModel.find({ classCode: classCode, status: 'pending' });
        const pendingSignupsCount = await SignUpModel.countDocuments({ classCode: classCode, status: 'pending' });
       
        res.render("todd-home", { classroom: classroom, pendingSignups: pendingSignups, pendingSignupsCount: pendingSignupsCount,
studentsNotMarkedPresent, attendanceRecords, presentCount, studentsCount,absents });
    
} catch (error) {
        console.error("Error fetching classroom details:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/edit-home/:classCode", async(req, res) => {
    try {
        const classCode = req.params.classCode;
        const classroom = await Classroom.findOne({ classCode: classCode });
      
  if (!classroom) {
            return res.status(404).send("Classroom not found");
        }

        const today = new Date();
        const year = today.getFullYear();
        let month = String(today.getMonth() + 1).padStart(2, '0'); // Month is zero-indexed
        let day = String(today.getDate()).padStart(2, '0');
        const folderName = `${year}-${month}-${day}`;

        // fetch students who have accepted the classCode
        const acceptedStudents = await SignUpModel.find({ classCode: classCode, status: 'accepted' });
        const acceptedUserIds = acceptedStudents.map(student => student.userId);

        // fetch attendance records for today
        const attendanceRecords = await Attendance.find({
            classCode: classCode,
            attendanceStatus: 'present',
            folder: folderName
        });

        const presentCount = attendanceRecords.length;
        const studentsCount = acceptedStudents.length;
        const presentUserIds = attendanceRecords.map(record => record.userId);
        
        const absents = studentsCount-presentCount;
        // filter accepted students who are not yet marked as present today
        const studentsNotMarkedPresent = acceptedStudents.filter(student => !presentUserIds.includes(student.userId));



        const pendingSignups = await SignUpModel.find({ classCode: classCode, status: 'pending' });
        const pendingSignupsCount = await SignUpModel.countDocuments({ classCode: classCode, status: 'pending' });
       
        res.render("edit-home", { classroom: classroom, pendingSignups: pendingSignups, pendingSignupsCount: pendingSignupsCount,
studentsNotMarkedPresent, attendanceRecords, presentCount, studentsCount,absents });
    
} catch (error) {
        console.error("Error fetching classroom details:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/todd-userinfo/:userId", async (req, res) => {
    try {
        const user = await SignUpModel.findOne({ userId: req.params.userId });
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.render("todd-userinfo", { user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});




const attendanceImagesPath = path.join(__dirname, 'uploads/attendance-images');

const attendanceStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, attendanceImagesPath);
    },
    filename: function (req, file, cb) {
        const { classCode, userId } = req.body;
        if (!classCode || !userId) {
            return cb(new Error('classCode or userId is not provided'));
        }

        const currentDate = new Date();
        const formattedDate = `${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}`;
        const formattedTime = `${String(currentDate.getHours()).padStart(2, '0')}${String(currentDate.getMinutes()).padStart(2, '0')}${String(currentDate.getSeconds()).padStart(2, '0')}`;

        const uniqueFilename = `${classCode}_${userId}_${formattedDate}_${formattedTime}${path.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
});

const attendanceUpload = multer({ storage: attendanceStorage });

app.get("/todd-markAttendance/:classCode", async(req, res) => {
    const classCode = req.params.classCode;
    res.render("todd-markAttendance", { classCode });
    
});

app.post('/todd-markAttendance', async (req, res) => {
    const { passCode, classCode } = req.body;



    
    try {

        const user = await SignUpModel.findOne({ passCode });

        if (!user) {
            console.error('PassCode is wrong, Please try again');
            return res.render('todd-markAttendance', {
                classCode,
                error: 'PassCode is wrong, Please try again'
            });
        }

        

        res.redirect(`/todd-pictureTaking/${classCode}/${user.userId}`);
    } catch (error) {
        console.error('Error validating passcode:', error);
        res.status(500).json({ error: 'Failed to validate passcode' });
    }
});

app.get('/todd-pictureTaking/:classCode/:userId', async (req, res) => {
    const { classCode, userId } = req.params;
    try {
        // Fetch user details based on userId
        const user = await SignUpModel.findOne({ userId });
        if (!user) {
            console.error('User not found');
            return res.status(404).json({ error: 'User not found' });
        }
        // Render pictureTaking view with classCode and user details
        res.render('todd-pictureTaking', { classCode, user });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});
app.post('/todd-pictureTaking', attendanceUpload.single('imageData'), async (req, res) => {
    const { classCode, userId, Slastname, Sfirstname, passCode } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!classCode || !userId || !Slastname || !Sfirstname || !passCode) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

     
        let attendance = await Attendance.findOne({
            userId,
            classCode,
            createdAt: { $gte: today } 
        });

        if (attendance) {
         
            attendance.imagePath = req.file.path;
            attendance = await attendance.save(); 
        } else {
           
            attendance = new Attendance({
                userId,
                Slastname,
                Sfirstname,
                classCode,
                passCode,
                attendanceStatus: 'present',
                folder: formatDateToFolderName(today), 
                createdAt: today,
                imagePath: req.file.path 
            });

            await attendance.save(); 
        }

        console.log('Attendance record processed successfully:', attendance);
        res.status(200).json({ message: 'Attendance picture saved/updated successfully', attendance });
    } catch (error) {
        console.error('Error processing attendance picture:', error);
        res.status(500).json({ error: 'Failed to process attendance picture' });
    }
});





app.post("/todd-classroom-calendar", (req, res) => {
    res.redirect("/todd-classroom-calendar/:classCode");
});

app.get('/todd-classroom-calendar/:classCode', async (req, res) => {
    const { classCode } = req.params;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
      
        const events = await Event.find({
          classCode: classCode,
          $or: [
            { startDate: { $gte: today } },
            { endDate: { $gte: today } },
            { startDate: { $lte: today }, endDate: { $gte: today } }
          ]
        });



        const user = await Classroom.findOne({ classCode: classCode }).lean();
        const calendarSettings = await CalendarSettings.findOne({ classCode }).lean();
      
        if (!user) {
          return res.status(404).send("Classroom not found");
        }
      
        const calendarSettingsJSON = calendarSettings ? JSON.stringify(calendarSettings) : null;

        res.render('todd-classroom-calendar', {
          classCode,
          user,
          events,
          calendarSettingsJSON
        });
    } catch (error) {
        console.error('Error fetching calendar data:', error);
        res.status(500).send('Failed to fetch calendar data.');
    }
});



app.post('/addEvents', async (req, res) => {
    // log the raw body
    console.log('Request Body:', req.body);

    const { title, startDate, endDate, description, color, classCode, endTime, startTime } = req.body;

    try {
        console.log('Received data:', {
            title,
            startDate,
            endDate,
            description,
            color,
            classCode,
            endTime,
            startTime
        });

        if (!title || !startDate || !endDate || !description || !color || !classCode) {
            return res.status(400).send('All fields are required.');
        }

        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(`${endDate}T${endTime}`);


        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).send('Invalid date format.');
        }

        const newEvent = new Event({
            title,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            description,
            color,
            startTime,
            endTime,
            classCode
        });

        await newEvent.save();

        res.redirect(`/todd-classroom-calendar/${classCode}`);
    } catch (error) {
        console.error('Error saving event:', error);
        res.status(500).send('An error occurred while saving the event.');
    }
});





app.post("/todd-view-events", (req, res) => {
    const {  classCode } = req.body;

    res.redirect("/todd-view-events/:classCode");
});

app.get('/todd-view-events/:classCode', async (req, res) => {
    const { classCode, objectId } = req.params;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
      
        
        const events = await Event.find({ classCode: classCode }).sort({ createdAt: -1 });
      



      

        const event = await Event.find({
            classCode: classCode,
            $or: [
                { startDate: { $gte: today } },
                { endDate: { $gte: today } },
                { startDate: { $lte: today }, endDate: { $gte: today } }
            ]
        }).limit(1);

          
          const latestNote = await Notes.findOne({ objectId: objectId })
          .sort({ createdAt: -1 }) 
          .limit(1);
          const notes = await Notes.find({ objectId: objectId }).sort({ createdAt: -1 });

        // Fetch classroom and calendar settings
        const user = await Classroom.findOne({ classCode: classCode }).lean();
      
        if (!user) {
          return res.status(404).send("Classroom not found");
        }
      
        // Render the Handlebars template with data
        res.render('todd-view-events', {
          classCode,
          user,
          events,
          event,
          notes,
          latestNote
         
        });
    } catch (error) {
        console.error('Error fetching calendasr data:', error);
        res.status(500).send('Failed to fetch calendar data.');
    }
});




app.get('/getEvent/:objectId', async (req, res) => {
    const { objectId } = req.params;
    try {
        const event = await Event.findById(objectId);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // convert dates to 'YYYY-MM-DD' format for input fields
        const formatDate = (date) => {
            if (!date) return '';
            return date.toISOString().slice(0, 10); // convert to 'YYYY-MM-DD'
        };

        event.startDate = formatDate(event.startDate);
        event.endDate = formatDate(event.endDate);

        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


app.post('/updateEvent', async (req, res) => {
    
    const { classCode, _id, title, startDate, endDate, startTime, endTime, description, color } = req.body;
    
    const updateEvent = await Event.findByIdAndUpdate(_id,{
        title,
        startDate,
        endDate,
        startTime,
        endTime,
        description,
        color
    }, { upsert: true });
    if (!updateEvent) {
        return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({ message: 'Event deleted successfully' });
        res.redirect(`/todd-view-events/${classCode}`);
   
});

app.delete('/delete-event/:_id', async (req, res) => {
    const { _id } = req.params;

    try {
        const deleteEvent = await Event.findByIdAndDelete(_id);

        if (!deleteEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ message: 'Event deleted successfully' });
        
    } catch (error) {
        console.error('Error deleting Event:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.post('/updateEvent', async (req, res) => {
    
    const { classCode, _id, title, startDate, endDate, startTime, endTime, description, color } = req.body;
    
    const updateEvent = await Event.findByIdAndUpdate(_id,{
        title,
        startDate,
        endDate,
        startTime,
        endTime,
        description,
        color
    }, { upsert: true });
    if (!updateEvent) {
        return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({ message: 'Event deleted successfully' });
        res.redirect(`/todd-view-events/${classCode}`);
   
});

app.post('/addNote', async (req, res) => {
    const { classCode, noteTitle, noteText } = req.body;
  
    try {
   
        const existingNoteCount = await Notes.countDocuments({ classCode: classCode });
      const noteNumber = existingNoteCount + 1;
      const newNote = new Notes({
        classCode,
        noteTitle,
        noteText,
        noteNumber
      });
  
      await newNote.save();
      res.redirect(`/todd-view-events/${classCode}`);
    } catch (error) {
      console.error('Error saving note:', error);
      res.status(500).send('An error occurred while saving the note.');
    }
  });

  app.get('/getNote/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const note = await Notes.findById(id);

        res.json(note);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/todd-view-notes/:classCode/:_id', async (req, res) => {
    const { classCode, objectId } = req.params;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

          
          const latestNote = await Notes.findOne({ objectId: objectId })
          .sort({ createdAt: -1 }) 
          .limit(1);
          const notes = await Notes.find({ objectId: objectId }).sort({ createdAt: -1 });
  
        res.render('todd-view-notes', {
          classCode,
          objectId,
          notes,
          latestNote
         
        });

});

app.get('/todd-view-notes/:classCode', async (req, res) => {
    const { classCode } = req.params;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

          
          const latestNote = await Notes.findOne({ classCode:classCode })
          .sort({ createdAt: -1 }) 
          .limit(1);
          const notes = await Notes.find({ classCode:classCode}).sort({ createdAt: -1 });
  
        res.render('todd-view-notes', {
          classCode,
          notes,
          latestNote
         
        });

});




app.get('/picked-list/:classCode/:year/:month', async (req, res) => {
    try {
        const { classCode, year, month } = req.params;
        const searchQuery = req.query.search || '';

        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);

        if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).send('Invalid month or year');
        }

        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 1); 

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).send('Invalid date range');
        }

        const attendanceRecords = await Attendance.find({
            classCode,
            createdAt: {
                $gte: startDate,
                $lt: endDate
            }
        });

        const students = await SignUpModel.find({ 
            classCode: classCode, 
            status: "accepted",
            $or: [
                { Sfirstname: { $regex: searchQuery, $options: 'i' } },
                { Slastname: { $regex: searchQuery, $options: 'i' } }
            ]
        }).sort({ Slastname: 1, Sfirstname: 1 });

        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

        const studentsWithAttendance = students.map(student => {
            const studentAttendance = attendanceRecords.filter(record => 
                record.userId === student.userId
            );
        
            let attendanceForDays = Array.from({ length: daysInMonth }, (_, i) => {
                const date = new Date(yearNum, monthNum - 1, i + 1);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const record = studentAttendance.find(r => new Date(r.createdAt).getDate() === i + 1);
                return {
                    status: record ? (record.attendanceStatus === 'present' ? '/' : '') : '',
                    isWeekend,
                    date: `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
                };
            });
        
            return {
                userId: student.userId,
                passCode: student.passCode,
                studentName: `${student.Sfirstname} ${student.Slastname}`,
                attendanceForDays
            };
        });
        
        

        res.render('picked-list', { 
            studentsWithAttendance,
            classCode,
            year: yearNum,
            month: monthNum,
            monthName: new Date(yearNum, monthNum - 1).toLocaleString('default', { month: 'long' }),
            daysInMonth
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.post('/update-attendance', async (req, res) => {
    try {
        const { studentId, date, classCode, status } = req.body;

        if (!studentId || !date || !classCode || !status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        const folderName = formatDateToFolderName(dateObj);

        const result = await Attendance.findOneAndUpdate(
            { userId: studentId, createdAt: { $gte: dateObj, $lt: new Date(dateObj.getTime() + 24*60*60*1000) }, classCode },
            { 
                attendanceStatus: status,
                createdAt: dateObj,
                folder: folderName
            },
            { new: true, upsert: true }
        );

        res.status(200).json(result);
    } catch (err) {
        console.error('Error updating attendance:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




app.delete('/remove-attendance/:studentId/:date', async (req, res) => {
    try {
        const { studentId, date } = req.params;

        const attendanceRecord = await Attendance.findOneAndRemove({
            userId: studentId,
            createdAt: { $gte: new Date(date) },
        });

        if (attendanceRecord) {
            res.send('Attendance removed successfully');
        } else {
            res.status(404).send('Attendance record not found');
        }
    } catch (error) {
        console.error('Error removing attendance:', error);
        res.status(500).send('Server Error');
    }
});

app.get('/todd-calendar-list/:classCode?', async (req, res) => {
    try {
        const { classCode } = req.params;
        const searchQuery = req.query.search || ''; 

        
        const attendanceRecords = await Attendance.find({ classCode }).sort({ createdAt: -1 });
        const calendarSettings = await CalendarSettings.findOne({ classCode });

        let months = [];
        let students = [];
        if (calendarSettings) {
            const { startYear, startMonth, endYear, endMonth } = calendarSettings;

            let currentYear = startYear;
            let currentMonth = startMonth;

            while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
                months.push({
                    year: currentYear,
                    month: currentMonth,
                    monthName: new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' }),
                    days: new Date(currentYear, currentMonth, 0).getDate()
                });

                if (currentMonth === 12) {
                    currentMonth = 1;
                    currentYear++;
                } else {
                    currentMonth++;
                }
            }

            // Fetch students and filter based on search query
            students = await SignUpModel.find({ 
                classCode: classCode, 
                status: "accepted",
                $or: [
                    { Sfirstname: { $regex: searchQuery, $options: 'i' } },
                    { Slastname: { $regex: searchQuery, $options: 'i' } }
                ]
            }).sort({ Slastname: 1, Sfirstname: 1 });

            const currentYearNum = new Date().getFullYear();
            const currentMonthNum = new Date().getMonth() + 1;

            // Filter to get only the current month
            const currentMonthData = months.find(monthData => monthData.year === currentYearNum && monthData.month === currentMonthNum);

            // Generate data for current month and other months
            const attendanceByMonth = {
                currentMonth: currentMonthData ? {
                    monthName: currentMonthData.monthName,
                    year: currentMonthData.year,
                    days: currentMonthData.days,
                    students: students.map(student => {
                        const studentAttendance = attendanceRecords.filter(record => 
                            record.userId === student.userId &&
                            new Date(record.createdAt).getFullYear() === currentMonthData.year &&
                            new Date(record.createdAt).getMonth() + 1 === currentMonthData.month
                        );

                        let attendanceForDays = Array.from({ length: currentMonthData.days }, (_, i) => {
                            const date = new Date(currentMonthData.year, currentMonthData.month - 1, i + 1);
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday is 0, Saturday is 6
                            const record = studentAttendance.find(r => new Date(r.createdAt).getDate() === i + 1);
                            return {
                                status: record ? (record.attendanceStatus === 'present' ? '/' : '') : '',
                                isWeekend
                            };
                        });

                        return {
                            studentName: `${student.Sfirstname} ${student.Slastname}`,
                            passCode: student.passCode,
                            attendanceForDays
                        };
                    })
                } : null,
                otherMonths: months.filter(monthData => !(monthData.year === currentYearNum && monthData.month === currentMonthNum))
            };

            res.render('todd-calendar-list', { 
                attendanceByMonth,
                classCode,
                searchQuery
            });
        } else {
            res.render('todd-calendar-list', { 
                attendanceByMonth: {
                    currentMonth: null,
                    otherMonths: [],
                },
                classCode,
                searchQuery
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


app.get('/todd-calendar-list/:classCode?/:year?/:month?', async (req, res) => {
    try {
        const { classCode, year, month } = req.params;

        // Fetch attendance records by classCode
        const attendanceRecords = await Attendance.find({ classCode }).sort({ createdAt: -1 });

        // Fetch calendar settings by classCode
        const calendarSettings = await CalendarSettings.findOne({ classCode });

        let months = [];
        let students = [];
        if (calendarSettings) {
            const { startYear, startMonth, endYear, endMonth } = calendarSettings;

            let currentYear = startYear;
            let currentMonth = startMonth;

            while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
                months.push({
                    year: currentYear,
                    month: currentMonth,
                    monthName: new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' }),
                    days: new Date(currentYear, currentMonth, 0).getDate()
                });

                if (currentMonth === 12) {
                    currentMonth = 1;
                    currentYear++;
                } else {
                    currentMonth++;
                }
            }

            students = await SignUpModel.find({ 
                classCode: classCode, 
                status: "accepted" 
            }).sort({ Slastname: 1, Sfirstname: 1 });

            const currentYearNum = year ? parseInt(year, 10) : new Date().getFullYear();
            const currentMonthNum = month ? parseInt(month, 10) : new Date().getMonth() + 1;

            const attendanceByMonth = months.map(monthData => {
                const isCurrentMonth = monthData.year === currentYearNum && monthData.month === currentMonthNum;
                return {
                    monthName: monthData.monthName,
                    year: monthData.year,
                    days: monthData.days,
                    isCurrentMonth,
                    students: students.map(student => {
                        const studentAttendance = attendanceRecords.filter(record => 
                            record.userId === student.userId &&
                            new Date(record.createdAt).getFullYear() === monthData.year &&
                            new Date(record.createdAt).getMonth() + 1 === monthData.month
                        );
            
                        let attendanceForDays = Array.from({ length: monthData.days }, (_, i) => {
                            const date = new Date(monthData.year, monthData.month - 1, i + 1);
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday is 0, Saturday is 6
                            const record = studentAttendance.find(r => new Date(r.createdAt).getDate() === i + 1);
                            return {
                                status: record ? (record.attendanceStatus === 'present' ? '/' : '') : '',
                                isWeekend
                            };
                        });
            
                        return {
                            studentName: `${student.Sfirstname} ${student.Slastname}`,
                            passCode: student.passCode,
                            attendanceForDays
                        };
                    })
                };
            });

            console.log('Attendance By Month:', attendanceByMonth); // Debug log

            res.render('todd-calendar-list', { 
                attendanceByMonth,
                classCode
            });
        } else {
            console.log('No calendar settings found'); // Debug log
            res.render('todd-calendar-list', { 
                attendanceByMonth: [],
                classCode
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


app.get("/todd-students-list/:classCode", async (req, res) => {
    try {
        const classCode = req.params.classCode;
        if (!classCode) {
            return res.status(400).send("Class code is required");
        }
        const classroom = await Classroom.findOne({ classCode: classCode });
        const users = await SignUpModel.find({ classCode: classCode, status: 'accepted' });

        const today = new Date();
        const year = today.getFullYear();
        let month = String(today.getMonth() + 1).padStart(2, '0'); // Month is zero-indexed
        let day = String(today.getDate()).padStart(2, '0');
        const folderName = `${year}-${month}-${day}`;

        // fetch students who have accepted the classCode
        const acceptedStudents = await SignUpModel.find({ classCode: classCode, status: 'accepted' });
        const acceptedUserIds = acceptedStudents.map(student => student.userId);

        // fetch attendance records for today
        const attendanceRecords = await Attendance.find({
            classCode: classCode,
            attendanceStatus: 'present',
            folder: folderName
        });
        

        const presentCount = attendanceRecords.length;
        const studentsCount = acceptedStudents.length;
        const presentUserIds = attendanceRecords.map(record => record.userId);
        
        const absents = studentsCount-presentCount;
        const studentsNotMarkedPresent = acceptedStudents.filter(student => !presentUserIds.includes(student.userId));



        const pendingSignups = await SignUpModel.find({ classCode: classCode, status: 'pending' });
        const pendingSignupsCount = await SignUpModel.countDocuments({ classCode: classCode, status: 'pending' });
       
        
        const usersWithAttendanceStatus = users.map(user => {
            return {
                ...user.toObject(),
                attendanceStatus: presentUserIds.includes(user.userId) ? 'present' : 'absent'
            };
        });

        res.render("todd-students-list", { classCode, users,  users: usersWithAttendanceStatus,pendingSignupsCount: pendingSignupsCount, classroom: classroom, pendingSignups: pendingSignups, 
            studentsNotMarkedPresent, attendanceRecords, presentCount, studentsCount,absents}); 
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});



app.get("/todd-pending-signups/:classCode", async (req, res) => {
    try {
        const classCode = req.params.classCode;
        if (!classCode) {
            return res.status(400).send("Class code is required");
        }
        const deniedSignups = await SignUpModel.find({ status: 'denied', classCode: classCode });
        const classroom = await Classroom.findOne({ classCode: classCode });

        const pendingSignups = await SignUpModel.find({ classCode: classCode, status: 'pending' });
        const pendingSignupsCount = await SignUpModel.countDocuments({ classCode: classCode, status: 'pending' });
        
        res.render("todd-pending-signups", { signups:pendingSignups ,classroom: classroom,deniedSignups, classCode: classCode, pendingSignupsCount: pendingSignupsCount });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


app.post('/todd-mark-attendance', async (req, res) => {
    const { passCode, classCode } = req.body;
    try{
    const user = await SignUpModel.findOne({ passCode });

   

    const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to the beginning of today
        const existingAttendance = await Attendance.findOne({
            userId: user.userId,
            createdAt: { $gte: today } // Check if attendance is marked today or later
        });



    const pendingSignupsCount = await SignUpModel.countDocuments({ classCode: classCode, status: 'pending' });
    const classroom = await Classroom.findOne({ classCode: classCode });


    const acceptedStudents = await SignUpModel.find({ classCode: classCode, status: 'accepted' });
    const acceptedUserIds = acceptedStudents.map(student => student.userId);
    
    const year = today.getFullYear();
    let month = String(today.getMonth() + 1).padStart(2, '0'); // Month is zero-indexed
    let day = String(today.getDate()).padStart(2, '0');
    const folderName = `${year}-${month}-${day}`;

    const attendanceRecords = await Attendance.find({
        classCode: classCode,
        attendanceStatus: 'present',
        folder: folderName
    });

    const presentCount = attendanceRecords.length;
    const studentsCount = acceptedStudents.length;
    const presentUserIds = attendanceRecords.map(record => record.userId);
    
    const absents = studentsCount-presentCount;
    const studentsNotMarkedPresent = acceptedStudents.filter(student => !presentUserIds.includes(student.userId));

    if (!user) {
        console.error('PassCode is wrong, Please try again');
        return res.render('todd-mark-attendance', {
            error: 'PassCode is wrong, Please try again',
            pendingSignupsCount: pendingSignupsCount ,
            classroom: classroom,
                studentsNotMarkedPresent,
                 attendanceRecords,
                 presentCount,
                  studentsCount,
                  absents
        });
    }

    if (existingAttendance) {
        console.error('Already marked as present');
        return res.render('todd-mark-attendance', {
            classCode: classCode,
            error: 'Already marked as present',
            pendingSignupsCount: pendingSignupsCount ,
            classroom: classroom,
                studentsNotMarkedPresent,
                 attendanceRecords,
                 presentCount,
                  studentsCount,
                  absents
        });
    }

        res.redirect(`/todd-picture-taking/${classCode}/${user.userId}`);
    } catch (error) {
        console.error('Error validating passcode:', error);
        res.status(500).json({ error: 'Failed to validate passcode' });
    }
});


app.get("/todd-mark-attendance/:classCode", async(req, res) => {
    const classCode = req.params.classCode;
    const { passCode } = req.body;


    const user = await SignUpModel.findOne({ passCode });

    if (!user) {
        console.error('PassCode is wrong, Please try again');
        return res.render('todd-mark-attendance', {
            error: 'PassCode is wrong, Please try again',
            pendingSignupsCount: pendingSignupsCount ,
            classroom: classroom,
                studentsNotMarkedPresent,
                 attendanceRecords,
                 presentCount,
                  studentsCount,
                  absents
        });
    }

    const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const existingAttendance = await Attendance.findOne({
            userId: user.userId,
            createdAt: { $gte: today } 
        });

        if (existingAttendance) {
            console.error('Already marked as present');
            return res.render('todd-mark-attendance', {
                classCode: classCode,
                error: 'Already marked as present',
                pendingSignupsCount: pendingSignupsCount ,
                classroom: classroom,
                    studentsNotMarkedPresent,
                     attendanceRecords,
                     presentCount,
                      studentsCount,
                      absents
            });
        }

    const pendingSignupsCount = await SignUpModel.countDocuments({ classCode: classCode, status: 'pending' });
    const classroom = await Classroom.findOne({ classCode: classCode });


    const acceptedStudents = await SignUpModel.find({ classCode: classCode, status: 'accepted' });
    const acceptedUserIds = acceptedStudents.map(student => student.userId);
    
    const year = today.getFullYear();
    let month = String(today.getMonth() + 1).padStart(2, '0'); 
    let day = String(today.getDate()).padStart(2, '0');
    const folderName = `${year}-${month}-${day}`;

    const attendanceRecords = await Attendance.find({
        classCode: classCode,
        attendanceStatus: 'present',
        folder: folderName
    });

    const presentCount = attendanceRecords.length;
    const studentsCount = acceptedStudents.length;
    const presentUserIds = attendanceRecords.map(record => record.userId);
    
    const absents = studentsCount-presentCount;
    const studentsNotMarkedPresent = acceptedStudents.filter(student => !presentUserIds.includes(student.userId));



    res.render("todd-mark-attendance", { 
        classCode,  
        pendingSignupsCount: pendingSignupsCount ,
        classroom: classroom,
            studentsNotMarkedPresent,
             attendanceRecords,
             presentCount,
              studentsCount,
              absents
    
    });
    
});



app.get('/todd-picture-taking/:classCode/:userId', async (req, res) => {
    const { classCode, userId } = req.params;
    try {
        const user = await SignUpModel.findOne({ userId });
        if (!user) {
            console.error('User not found');
            return res.status(404).json({ error: 'User not found' });
        }
        res.render('todd-picture-taking', { classCode, user });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

app.post('/todd-picture-taking', attendanceUpload.single('imageData'), async (req, res) => {
    const { classCode, userId, Slastname, Sfirstname, passCode } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!classCode || !userId || !Slastname || !Sfirstname || !passCode) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

     
        let attendance = await Attendance.findOne({
            userId,
            classCode,
            createdAt: { $gte: today } 
        });

        if (attendance) {
         
            attendance.imagePath = req.file.path;
            attendance = await attendance.save(); 
        } else {
           
            attendance = new Attendance({
                userId,
                Slastname,
                Sfirstname,
                classCode,
                passCode,
                attendanceStatus: 'present',
                folder: formatDateToFolderName(today), 
                createdAt: today,
                imagePath: req.file.path 
            });

            await attendance.save(); 
        }

        console.log('Attendance record processed successfully:', attendance);
        res.status(200).json({ message: 'Attendance picture saved/updated successfully', attendance });
    } catch (error) {
        console.error('Error processing attendance picture:', error);
        res.status(500).json({ error: 'Failed to process attendance picture' });
    }
});




app.delete('/removeRequest/:id', async (req, res) => {
    try {
        const { classCode} = req.body;
        const id = req.params.id;
        const user = await SignUpModel.findOne({ _id: id });
        
        const guardianImagePath = path.join(__dirname, `//uploads//images/${user.Glastname}_guardian_${user.userId}.jpg`);
        const studentImagePath = path.join(__dirname, `//uploads//images/${user.Slastname}_student_${user.userId}.jpg`);
           
        fs.unlink(guardianImagePath, (err) => {
            if (err) {
                console.error("Error deleting guardian image:", err);
            } else {
                console.log("Guardian image deleted successfully");
            }
        });
        
        fs.unlink(studentImagePath, (err) => {
            if (err) {
                console.error("Error deleting student image:", err);
            } else {
                console.log("Student image deleted successfully");
            }
        });

        await SignUpModel.deleteOne({ _id: id });

        res.redirect(`/todd-pending-signups/${classCode}`)
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/todd-teacher-profile/:classCode", async (req, res) => {
    try {
        const { classCode, userId } = req.params;

        if (!classCode) {
            return res.status(400).send("Class code is required");
        }

        const pickedUser = await SignUpModel.findOne({ classCode: classCode, userId: userId });
        const classroom = await Classroom.findOne({ classCode: classCode });
        const pendingSignupsCount = await SignUpModel.countDocuments({ classCode: classCode, status: 'pending' });
        const mostRecentChat = await Chats.findOne({ classCode: classCode }).sort({ createdAt: -1 });
        const users = await SignUpModel.find({ classCode: classCode, status: 'accepted' });

        const unreadCounts = await Chats.aggregate([
            { $match: { classCode: classCode, isRead: false } },
            { $group: { _id: "$userId", count: { $sum: 1 } } }
        ]);

        const today = moment().startOf('day');
        const startOfWeek = moment().startOf('week').startOf('day');

        const formatDate = (date) => {
            const chatDate = moment(date);
            const isToday = chatDate.isSame(today, 'day');
            const isSameWeek = chatDate.isSame(startOfWeek, 'week');

            if (isToday) {
                return chatDate.format('h:mm A');
            } else if (isSameWeek) {
                return chatDate.format('dddd, h:mm A');
            } else {
                return chatDate.format('MMMM D, YYYY, h:mm A');
            }
        };

        const unreadCountMap = unreadCounts.reduce((acc, { _id, count }) => {
            acc[_id] = count;
            return acc;
        }, {});

        const latestMessages = await Chats.aggregate([
            { $sort: { createdAt: -1 } },
            { $group: { _id: "$userId", latestMessage: { $first: "$message" }, latestMessageTime: { $first: "$createdAt" } } }
        ]);

        const latestMessageMap = latestMessages.reduce((acc, { _id, latestMessage, latestMessageTime }) => {
            acc[_id] = { message: latestMessage, time: formatDate(latestMessageTime) };
            return acc;
        }, {});

        const sentChats = await Chats.find({ classCode: classCode, roomId: userId }).sort({ createdAt: 1 });



        const formattedChats = sentChats.map(chat => ({
            ...chat.toObject(),
            createdAt: formatDate(chat.createdAt),
            isToday: moment(chat.createdAt).isSame(today, 'day'),
            isSameWeek: moment(chat.createdAt).isSame(startOfWeek, 'week'),
        }));

        const usersWithCountsAndMessages = users.map(user => ({
            ...user.toObject(),
            unreadCount: unreadCountMap[user.userId] || 0,
            latestMessage: latestMessageMap[user.userId]?.message || 'No messages',
            latestMessageTime: latestMessageMap[user.userId]?.time || null 
        }));

        const sortedUsers = usersWithCountsAndMessages.sort((a, b) => {
            if (!a.latestMessageTime && b.latestMessageTime) return 1; 
            if (a.latestMessageTime && !b.latestMessageTime) return -1; 

            const timeA = a.latestMessageTime ? moment(a.latestMessageTime, 'MMMM D, YYYY, h:mm A') : null;
            const timeB = b.latestMessageTime ? moment(b.latestMessageTime, 'MMMM D, YYYY, h:mm A') : null;

            return (timeB ? timeB.diff(timeA) : 0); 
        });

        res.render("todd-teacher-profile", { classCode, users: sortedUsers, pickedUser, sentChats: formattedChats, pendingSignupsCount, classroom, mostRecentChat });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});



app.get("/todd-teacher-chat/:classCode/:userId", async (req, res) => {
    try {
        const { classCode, userId } = req.params;

        if (!classCode) {
            return res.status(400).send("Class code is required");
        }

        const pickedUser = await SignUpModel.findOne({ classCode: classCode, userId: userId });
        const classroom = await Classroom.findOne({ classCode: classCode });
        const pendingSignupsCount = await SignUpModel.countDocuments({ classCode: classCode, status: 'pending' });
        const mostRecentChat = await Chats.findOne({ classCode: classCode }).sort({ createdAt: -1 });
        const users = await SignUpModel.find({ classCode: classCode, status: 'accepted' });

        const unreadCounts = await Chats.aggregate([
            { $match: { classCode: classCode, isRead: false } },
            { $group: { _id: "$userId", count: { $sum: 1 } } }
        ]);

        const today = moment().startOf('day');
        const startOfWeek = moment().startOf('week').startOf('day');

        const formatDate = (date) => {
            const chatDate = moment(date);
            const isToday = chatDate.isSame(today, 'day');
            const isSameWeek = chatDate.isSame(startOfWeek, 'week');

            if (isToday) {
                return chatDate.format('h:mm A');
            } else if (isSameWeek) {
                return chatDate.format('dddd, h:mm A');
            } else {
                return chatDate.format('MMMM D, YYYY, h:mm A');
            }
        };

        const unreadCountMap = unreadCounts.reduce((acc, { _id, count }) => {
            acc[_id] = count;
            return acc;
        }, {});

        const latestMessages = await Chats.aggregate([
            { $sort: { createdAt: -1 } },
            { $group: { _id: "$userId", latestMessage: { $first: "$message" }, latestMessageTime: { $first: "$createdAt" } } }
        ]);

        const latestMessageMap = latestMessages.reduce((acc, { _id, latestMessage, latestMessageTime }) => {
            acc[_id] = { message: latestMessage, time: formatDate(latestMessageTime) };
            return acc;
        }, {});

        const sentChats = await Chats.find({ classCode: classCode, roomId: userId }).sort({ createdAt: 1 });



        const formattedChats = sentChats.map(chat => ({
            ...chat.toObject(),
            createdAt: formatDate(chat.createdAt),
            isToday: moment(chat.createdAt).isSame(today, 'day'),
            isSameWeek: moment(chat.createdAt).isSame(startOfWeek, 'week'),
        }));

        const usersWithCountsAndMessages = users.map(user => ({
            ...user.toObject(),
            unreadCount: unreadCountMap[user.userId] || 0,
            latestMessage: latestMessageMap[user.userId]?.message || 'No messages',
            latestMessageTime: latestMessageMap[user.userId]?.time || null 
        }));

        const sortedUsers = usersWithCountsAndMessages.sort((a, b) => {
            if (!a.latestMessageTime && b.latestMessageTime) return 1; 
            if (a.latestMessageTime && !b.latestMessageTime) return -1; 

            const timeA = a.latestMessageTime ? moment(a.latestMessageTime, 'MMMM D, YYYY, h:mm A') : null;
            const timeB = b.latestMessageTime ? moment(b.latestMessageTime, 'MMMM D, YYYY, h:mm A') : null;

            return (timeB ? timeB.diff(timeA) : 0); 
        });

        res.render("todd-teacher-chat", { classCode, users: sortedUsers, pickedUser, sentChats: formattedChats, pendingSignupsCount, classroom, mostRecentChat });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


// s

// app.get("/todd-class-folder-gallery/:classCode/:userId", async (req, res) => {
//     try {
//         const { classCode, userId} = req.params;
        
//         const student = await SignUpModel.findOne({ classCode: classCode, userId: userId});
//         const classroom = await Classroom.findOne({classCode});
//         const studentImages = await Attendance.find({ classCode, userId });

//         const imagesData = studentImages.map(image => {
//             const currentDate = new Date();
//             const formattedDate = `${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}`;
//             const formattedTime = `${String(currentDate.getHours()).padStart(2, '0')}${String(currentDate.getMinutes()).padStart(2, '0')}${String(currentDate.getSeconds()).padStart(2, '0')}`;

//             const imagePath = `${classCode}_${userId}_${formattedDate}_${formattedTime}${path.extname(image.imageUrl)}`;
            
//             return {
//                 imagePath
//             };
//         });    

//         res.render("todd-class-folder-gallery", { classCode, studentImages: imagesData, student, classroom});
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Internal Server Error");
//     }
// })



app.post('/mark-all-as-read', async (req, res) => {
  const { classCode, userId } = req.body;
  try {
    await Chats.updateMany(
      { classCode: classCode, roomId: userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.sendStatus(200);
  } catch (error) {
    console.error('Error marking chats as read:', error);
    res.status(500).send('An error occurred while marking chats as read.');
  }
});


//hen user chats teacher
app.post('/chat-teacher', async (req, res) => {
    
    const { classCode, userId, message, roomId, subject, Glastname } = req.body;
  
    try { 
      const existingChatCount = await Chats.countDocuments({ classCode: classCode });
      const chatNumber = existingChatCount + 1;

      const newChatRecord = new Chats({
        classCode,
        userId,
        message,
        from: "guardians",
        subject,
        chatNumber,
        roomId,
        Glastname,
        isRead: false
      });
  
      await newChatRecord.save();

      res.redirect(`/home/${userId}`);
    } catch (error) {
      console.error('Error saving note:', error);
      res.status(500).send('An error occurred while saving the note.');
    }
  });


  
  app.post('/chat-users', async (req, res) => {
    const { classCode, message, subject, roomId, Glastname, userId } = req.body;
  
    try {
      const existingChatCount = await Chats.countDocuments({ classCode: classCode });
      const chatNumber = existingChatCount + 1;

      const newChatRecord = new Chats({
        classCode,
        roomId,  
        from: "Teacher",
        message,
        subject,
        chatNumber,
        Glastname,
        userId,
        isRead: false

    });
  
      await newChatRecord.save();

      res.redirect(`/todd-teacher-chat/${classCode}/${roomId}`);
    } catch (error) {
      console.error('Error saving note:', error);
      res.status(500).send('An error occurred while saving the note.');
    }
  });



 

  const moment = require('moment');
const addStar = require("./addStar");


  app.get("/home/:userId" , isAuthenticated, async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await SignUpModel.findOne({ userId: userId });

        const sentChats = await Chats.find({ userId: userId }).sort({ createdAt: 1 });

        if (!user) {
            return res.status(404).send("User not found");
        }

        const today = moment().startOf('day');
        const startOfWeek = moment().startOf('week').startOf('day');
        const attendance = await Attendance.findOne({
            userId: userId,
            createdAt: { $gte: today.toDate() }
        }).sort({ createdAt: -1 });

        // Function to format the date and time
        const formatDate = (date) => {
            const chatDate = moment(date);
            const isToday = chatDate.isSame(today, 'day');
            const isSameWeek = chatDate.isSame(startOfWeek, 'week');

            if (isToday) {
                return chatDate.format('h:mm A');
            } else if (isSameWeek) {
                return chatDate.format('dddd, h:mm A');
            } else {
                return chatDate.format('MMMM D, YYYY, h:mm A');
            }
        };

        // Format each chat message's timestamp and add relevant flags
        const formattedChats = sentChats.map(chat => ({
            ...chat.toObject(),
            createdAt: formatDate(chat.createdAt),
            isToday: moment(chat.createdAt).isSame(today, 'day'),
            isSameWeek: moment(chat.createdAt).isSame(startOfWeek, 'week')
        }));

        res.render("home", {
            user: user.toObject(),
            sentChats: formattedChats,
            attendance: attendance ? attendance.toObject() : null
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


app.delete('/removeChat/:id', async (req, res) => {
    try {
      const chat = await Chats.findByIdAndDelete(req.params.id);
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }
      res.json({ message: 'Chat deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }  });



app.get('/todd-see-attendance/:classCode', async (req, res) => {
    try {
        const { classCode } = req.params;
        if (!classCode) {
            return res.status(400).send('Class code is required');
        }

        const today = new Date();
        const year = today.getFullYear();
        let month = String(today.getMonth() + 1).padStart(2, '0'); 
        let day = String(today.getDate()).padStart(2, '0');
        const folderName = `${year}-${month}-${day}`;

        const classroom = await Classroom.findOne({classCode});
        const pendingSignupsCount = await SignUpModel.countDocuments({ classCode: classCode, status: 'pending' });

        const acceptedStudents = await SignUpModel.find({ classCode: classCode, status: 'accepted' });
        const acceptedUserIds = acceptedStudents.map(student => student.userId);

        const attendanceRecords = await Attendance.find({
            classCode: classCode,
            attendanceStatus: 'present',
            folder: folderName
        });

        
        const presentUserIds = attendanceRecords.map(record => record.userId);

        const studentsNotMarkedPresent = acceptedStudents.filter(student => !presentUserIds.includes(student.userId));

        res.render('todd-see-attendance', { classCode, studentsNotMarkedPresent, attendanceRecords, classroom, pendingSignupsCount });

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// app.post('/action-notify', async (req, res) => {
    
//     const { classCode, userId, message, roomId, subject, Glastname } = req.body;
  
//     try { 
//       const existingChatCount = await Chats.countDocuments({ classCode: classCode });
//       const chatNumber = existingChatCount + 1;

//       const newChatRecord = new Chats({
//         classCode,
//         userId,
//         message,
//         from: "guardians",
//         subject,
//         chatNumber,
//         roomId,
//         Glastname,
//         isRead: false
//       });
  
//       await newChatRecord.save();

//       res.redirect(`/home/${userId}`);
//     } catch (error) {
//       console.error('Error saving note:', error);
//       res.status(500).send('An error occurred while saving the note.');
//     }
//   });

//   app.get('/example', async (req, res) => {
//     try {
//         // Fetch all users
//         const users = await SignUpModel.find({}, 'userId');

//         // Fetch unread message counts
//         const unreadCounts = await Chats.aggregate([
//             { $match: { isRead: false } },
//             { $group: { _id: "$userId", count: { $sum: 1 } } }
//         ]);

//         // Fetch the latest message for each user
//         const latestMessages = await Chats.aggregate([
//             { $sort: { createdAt: -1 } }, // Assuming `createdAt` field exists
//             { $group: { _id: "$userId", latestMessage: { $first: "$message" }, latestMessageTime: { $first: "$createdAt" } } }
//         ]);

//         // Format date function
//         const today = moment().startOf('day');
//         const startOfWeek = moment().startOf('week').startOf('day');

//         const formatDate = (date) => {
//             const chatDate = moment(date);
//             const isToday = chatDate.isSame(today, 'day');
//             const isYesterday = chatDate.isSame(today.clone().subtract(1, 'day'), 'day');
//             const isSameWeek = chatDate.isSame(startOfWeek, 'week');

//             if (isToday) {
//                 return chatDate.format('h:mm A');
//             } else if (isYesterday) {
//                 return chatDate.format('dddd');
//             } else if (isSameWeek) {
//                 return chatDate.format('dddd, h:mm A');
//             } else {
//                 return chatDate.format('MMMM D, YYYY, h:mm A');
//             }
//         };

//         // Convert the arrays of unread counts and latest messages to objects for easier lookup
//         const unreadCountMap = unreadCounts.reduce((acc, { _id, count }) => {
//             acc[_id] = count;
//             return acc;
//         }, {});

//         const latestMessageMap = latestMessages.reduce((acc, { _id, latestMessage, latestMessageTime }) => {
//             acc[_id] = { message: latestMessage, time: formatDate(latestMessageTime) };
//             return acc;
//         }, {});

//         // Add unread counts and latest messages to the users data
//         const usersWithCountsAndMessages = users.map(user => ({
//             ...user.toObject(),
//             unreadCount: unreadCountMap[user.userId] || 0,
//             latestMessage: latestMessageMap[user.userId]?.message || 'No messages',
//             latestMessageTime: latestMessageMap[user.userId]?.time || null // Use null for no messages
//         }));

//         // Sort users: latest messages first, users with no messages last
//         const sortedUsers = usersWithCountsAndMessages.sort((a, b) => {
//             // Handle users with no messages
//             if (!a.latestMessageTime && b.latestMessageTime) return 1; // a should come after b
//             if (a.latestMessageTime && !b.latestMessageTime) return -1; // b should come after a

//             // Convert latestMessageTime to moment objects for comparison
//             const timeA = a.latestMessageTime ? moment(a.latestMessageTime, 'MMMM D, YYYY, h:mm A') : null;
//             const timeB = b.latestMessageTime ? moment(b.latestMessageTime, 'MMMM D, YYYY, h:mm A') : null;

//             return (timeB ? timeB.diff(timeA) : 0); // Sort by latest message time in descending order
//         });

//         // Render the view with user data, unread counts, and latest messages
//         res.render('practiceTemplate', { users: sortedUsers });
//     } catch (err) {
//         console.error('Error fetching users and chats:', err);
//         res.status(500).send('Internal Server Error');
//     }
// });
  

app.get("/todd-home1/:classCode", async(req, res) => {
    try {
        const classCode = req.params.classCode;
        const classroom = await Classroom.findOne({ classCode: classCode });
      
  if (!classroom) {
            return res.status(404).send("Classroom not found");
        }

        const today = new Date();
        const year = today.getFullYear();
        let month = String(today.getMonth() + 1).padStart(2, '0'); 
        let day = String(today.getDate()).padStart(2, '0');
        const folderName = `${year}-${month}-${day}`;

        // fetch students who have accepted the classCode
        const acceptedStudents = await SignUpModel.find({ classCode: classCode, status: 'accepted' });
        const acceptedUserIds = acceptedStudents.map(student => student.userId);

        // fetch attendance records for today
        const attendanceRecords = await Attendance.find({
            classCode: classCode,
            attendanceStatus: 'present',
            folder: folderName
        });

        const presentCount = attendanceRecords.length;
        const studentsCount = acceptedStudents.length;
        const presentUserIds = attendanceRecords.map(record => record.userId);
        
        const absents = studentsCount-presentCount;
        // filter accepted students who are not yet marked as present today
        const studentsNotMarkedPresent = acceptedStudents.filter(student => !presentUserIds.includes(student.userId));



        const pendingSignups = await SignUpModel.find({ classCode: classCode, status: 'pending' });
        const pendingSignupsCount = await SignUpModel.countDocuments({ classCode: classCode, status: 'pending' });
       
        res.render("todd-home1", { classroom: classroom, pendingSignups: pendingSignups, pendingSignupsCount: pendingSignupsCount,
studentsNotMarkedPresent, attendanceRecords, presentCount, studentsCount,absents });
    
} catch (error) {
        console.error("Error fetching classroom details:", error);
        res.status(500).send("Internal Server Error");
    }
});


// app.get("/todd-grading-section/:classCode", async(req, res) => {
//     try {
//         const classCode = req.params.classCode;
//         const classroom = await Classroom.findOne({ classCode});
//         const students = await SignUpModel.find({ classCode});
//         const stars = await Star.countDocuments({classCode});
//         const chatsCount = await Chats.countDocuments({ classCode: classCode, isRead: false });

//         const today = new Date();
//         today.setHours(0, 0, 0, 0);       
//         // const startOfWeek = new Date(today);
//         // startOfWeek.setDate(today.getDate() - today.getDay());        
//         // const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        
//         const starCounts = await Promise.all(students.map(async (student) => {
//             const userId = student.userId;
                
//             const starCountToday = await Star.countDocuments({
//                 classCode,
//                 userId,
//                 createdAt: { $gte: today }
//             });        
//             // const starCountThisWeek = await Star.countDocuments({
//             //     classCode,
//             //     userId,
//             //     createdAt: { $gte: startOfWeek }
//             // });
        
//             // const starCountThisMonth = await Star.countDocuments({
//             //     classCode,
//             //     userId,
//             //     createdAt: { $gte: startOfMonth }
//             // });
        
//             // const starCountOverall = await Star.countDocuments({
//             //     classCode,
//             //     userId
//             // });
        
//             return {
//                 student,
//                 starCountToday,
//                 // starCountThisWeek,
//                 // starCountThisMonth,
//                 // starCountOverall
//             };
//         }));
        

//         res.render("todd-grading-section", { classroom: classroom, chatsCount: chatsCount,  students: starCounts});
    
//     } catch (error) {
//         console.error("Error fetching classroom details:", error);
//         res.status(500).send("Internal Server Error");
//             }
//     });

    // app.post('/addStar', async (req, res) => {
    //     const { classCode, userId} = req.body;
      
    //     try {
    //       const newStar = new Star({
    //         classCode,
    //         userId,
    //         starCount: 1     
    //       });
      
    //       await newStar.save();
    //       res.redirect(`/todd-grading-section/${classCode}`);
    //     } catch (error) {
    //       console.error('Error saving note:', error);
    //       res.status(500).send('An error occurred while saving the note.');
    //     }
    //   });

    //   app.post("/removeStar", async (req, res) => {
    //     try {
    //         const { userId, classCode } = req.body;
    
    //         await Star.findOneAndUpdate(
    //             { userId, classCode },
    //             { $inc: { starCount: -1 } },
    //             { new: true }
    //         );
    
    //         res.redirect(`/todd-grading-section/${classCode}`);
    //     } catch (error) {
    //         console.error("Error updating star count:", error);
    //         res.status(500).send("Internal Server Error");
    //     }
    // });
    
    app.get("/todd-grading-section/:classCode", async(req, res) => {
        try {
            const classCode = req.params.classCode;
            const classroom = await Classroom.findOne({ classCode});
            const students = await SignUpModel.find({ classCode});
            const stars = await Star.countDocuments({classCode});
            const chatsCount = await Chats.countDocuments({ classCode: classCode, isRead: false });
    
            const today = new Date();
            today.setHours(0, 0, 0, 0);       
            // const startOfWeek = new Date(today);
            // startOfWeek.setDate(today.getDate() - today.getDay());        
            // const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            
            
            const starCounts = await Promise.all(students.map(async (student) => {
                const userId = student.userId;
                    
                const starCountToday = await Star.countDocuments({
                    classCode,
                    userId,
                    createdAt: { $gte: today }
                });        
                // const starCountThisWeek = await Star.countDocuments({
                //     classCode,
                //     userId,
                //     createdAt: { $gte: startOfWeek }
                // });
            
                // const starCountThisMonth = await Star.countDocuments({
                //     classCode,
                //     userId,
                //     createdAt: { $gte: startOfMonth }
                // });
            
                // const starCountOverall = await Star.countDocuments({
                //     classCode,
                //     userId
                // });
            
                return {
                    student,
                    starCountToday,
                    // starCountThisWeek,
                    // starCountThisMonth,
                    // starCountOverall
                };
            }));
            
    
            res.render("todd-grading-section", { classroom: classroom, chatsCount: chatsCount,  students: starCounts});
        
        } catch (error) {
            console.error("Error fetching classroom details:", error);
            res.status(500).send("Internal Server Error");
                }
        });

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.status(500).send("Failed to logout");
        }
        res.redirect('/');
    });
});

app.get('/check-username', async (req, res) => {
    const username = req.query.teacher_username;
    
    if (!username) {
        return res.status(400).json({ available: false, message: 'Username is required' });
    }
 
    try {
        const teacher = await Classroom.findOne({ teacher_username: username });
        res.json({ available: !teacher });
    } catch (err) {
        res.status(500).json({ available: false, message: 'Error checking username' });
    }
});



app.get("/todd-create-classroom", (req, res) => {
    const userId = generateRandomId();
    res.render("todd-create-classroom",{ userId: userId });
});

function generateRandomId() {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let userId = '';
    for (let i = 0; i < 10; i++) {
        userId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return userId;
}

app.post("/todd-create-classroom", upload.single('guardianPicture'), async (req, res) => {
    const { className, section, schoolName, Glastname, Gfirstname, Gmiddleinitial, year, fullname, contactNumber, email, age, teacher_username, teacher_password } = req.body;
    
    try {
        const userId = req.body.userId; 
        if (!userId) {
            return res.status(400).send("userId is required.");
        }

        const classCode = generateRandomId(); 

        let guardianPicturePath = '';

        if (req.file) {
            guardianPicturePath = req.file.path; 
        } else {
            return res.status(400).send("Guardian picture is required.");
        }

        const newClass = new Classroom({
            className: className,
            section: section,
            schoolName: schoolName,
            Glastname: Glastname,
            Gfirstname: Gfirstname,
            Gmiddleinitial: Gmiddleinitial,
            year: year,
            contactNumber: contactNumber,
            email: email,
            age: age,
            userId: userId, 
            guardianPicture: guardianPicturePath, 
            role: "teacher",
            classCode: classCode,
            teacher_username: teacher_username,
            teacher_password: teacher_password
        });

        const savedClass = await newClass.save();
        console.log("Classroom created:", savedClass);
        res.redirect(`/todd-creating-classroom-loader/${classCode}`);
    } catch (error) {
        console.error("Error creating classroom:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/todd-creating-classroom-loader/:classCode", async (req, res) => {
    try {
        const classCode = req.params.classCode;
        const classroom = await Classroom.findOne({ classCode: classCode });

        res.render("todd-creating-classroom-loader", { classCode});
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/todd-classroom-login", async (req, res) => {
   
        res.render("todd-classroom-login");

});


app.get("/todd-edit", async (req, res) => {
   
    res.render("todd-edit");

});

app.get("/todd-backupRecovery", async (req, res) => {
   
    res.render("todd-backupRecovery");

});



function generateUniqueTicketId() {
    const timestamp = new Date().getTime();
    const randomNum = Math.floor(Math.random() * 10000);
    return `${timestamp}${randomNum}`;
}

app.post('/report', async (req, res) => {

    const { classCode, reportTitle, reportMessage } = req.body;

    const newReport = new Report({
        classCode: classCode,
        reportTitle: reportTitle,
        ticketId: generateUniqueTicketId(),
        reportMessage: reportMessage
    });

    try {
        await newReport.save(); 
        console.log("Report submitted:", newReport);
        res.redirect(`/todd-report/${classCode}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving the report');
    }
});


app.get("/todd-report/:classCode", async (req, res) => {
    try {
        const classCode = req.params.classCode;
        const classroom = await Classroom.findOne({ classCode: classCode });
        const sentReports = await Report.find({classCode: classCode});


        const today = moment().startOf('day');
        const startOfWeek = moment().startOf('week');

        const formatDate = (date) => {
            const chatDate = moment(date);
            const isToday = chatDate.isSame(today, 'day');
            const isSameWeek = chatDate.isSame(startOfWeek, 'week');

            if (isToday) {
                return chatDate.format('h:mm A');
            } else if (isSameWeek) {
                return chatDate.format('dddd, h:mm A');
            } else {
                return chatDate.format('MMMM D, YYYY, h:mm A');
            }
        };

        const formattedReports = sentReports.map(report => ({
            ...report.toObject(),
            formattedDate: formatDate(report.createdAt)
        }));
 

        res.render("todd-report", { classCode, classroom, sentReports:formattedReports});
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});



app.listen(3000, () => {
    console.log("Server started on port 3000");
});


