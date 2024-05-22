/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 */

const session = require("express-session");
const bodyParser = require("body-parser");
const multer = require("multer");
const upload = multer({ dest: "images/" });

// ExpressJS App
const express = require("express");
const app = express();

// Setup Mongoose database
const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const async = require("async");

// Load the Mongoose schema for User, Photo, and SchemaInfo
const User = require("./schema/user.js");
const Photo = require("./schema/photo.js");
const SchemaInfo = require("./schema/schemaInfo.js");

// Connect to the MongoDB instance
mongoose.connect("mongodb://127.0.0.1/cs142project7", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.static(__dirname));

app.use(
  session({ secret: "secretKey", resave: false, saveUninitialized: false })
);
app.use(bodyParser.json());

app.post("/admin/login", async (req, res) => {
  const { login_name, password } = req.body;
  const user = await User.findOne({ login_name });
  if (!user || user.password !== password) {
    return res.status(400).send("Invalid login name or password");
  }
  req.session.user = user;
  res.send({ _id: user._id, first_name: user.first_name });
});

app.post("/admin/logout", (req, res) => {
  if (!req.session.user) {
    return res.status(400).send("No user currently logged in");
  }
  req.session.destroy();
  res.sendStatus(200);
});

function hasSessionRecord(request, response, next) {
  if (request.session.userIdRecord) {
    console.log("Session: detect current user");
    next(); // continue to next step
  } else {
    console.log("Session: NO active user!");
    response.status(401).json({ message: "Unauthorized" });
  }
}

app.post("/commentsOfPhoto/:photo_id", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).send("Unauthorized");
    }

    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).send("Comment cannot be empty");
    }

    const photoId = req.params.photo_id;
    const userId = req.session.user._id;

    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).send("Photo not found");
    }

    const newComment = {
      comment: comment.trim(),
      user_id: userId,
      date_time: new Date(),
    };

    photo.comments.push(newComment);
    await photo.save();

    res.status(200).send(photo);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).send("Internal server error");
  }
});

app.post("/photos/new", upload.single("photo"), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("Unauthorized");
  }

  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const photo = new Photo({
    file_name: req.file.filename,
    date_time: new Date(),
    user_id: req.session.user._id,
  });

  try {
    await photo.save();
    res.status(200).send(photo);
  } catch (error) {
    console.error("Error saving photo:", error);
    res.status(500).send("Internal server error");
  }
});

app.post("/user", (request, response) => {
  console.log("Server's request body");
  console.log(request.body);
  const newUser = request.body;

  // Check: the first_name, last_name, and password must be non-empty strings
  if (!(newUser.first_name && newUser.last_name && newUser.password)) {
    response.status(400).json({
      message:
        "The first_name, last_name, and password must be non-empty strings",
    });
    return;
  }

  // only create a new user if it have not existed
  User.findOne({ login_name: newUser.login_name })
    .then((user) => {
      if (!user) {
        // user not exists yet
        console.log("User not found");
        // create the user in the DB
        User.create(newUser)
          .then(() => console.log("New User created in the DB"))
          .catch((e) => console.log("Error creating new user ", e));
        response.status(200).json({ message: "User created successfully!" });
      } else {
        // user exists already
        console.log("User already exists!");
        console.log(user);
        response.status(400).json({
          message:
            "The login name already exists, please choose a different login name",
        });
      }
    })
    .catch((error) => {
      console.log("Error: user found user error", error);
      response.status(400).json({ message: "Other error occured: " });
    });
});

app.get("/", function (request, response) {
  console.log("Simple web server of files from " + __dirname);
  response.send("Simple web server of files from " + __dirname);
});

app.get("/test/:p1", function (request, response) {
  console.log("/test called with param1 = ", request.params.p1);

  const param = request.params.p1 || "info";

  if (param === "info") {
    SchemaInfo.find({}, function (err, info) {
      if (err) {
        console.error("Doing /user/info error:", err);
        response.status(500).send(JSON.stringify(err));
        return;
      }
      if (info.length === 0) {
        response.status(500).send("Missing SchemaInfo");
        return;
      }

      console.log("SchemaInfo", info[0]);
      response.end(JSON.stringify(info[0]));
    });
  } else if (param === "counts") {
    const collections = [
      { name: "user", collection: User },
      { name: "photo", collection: Photo },
      { name: "schemaInfo", collection: SchemaInfo },
    ];
    async.each(
      collections,
      function (col, done_callback) {
        col.collection.countDocuments({}, function (err, count) {
          col.count = count;
          done_callback(err);
        });
      },
      function (err) {
        if (err) {
          response.status(500).send(JSON.stringify(err));
        } else {
          var obj = {};
          for (var i = 0; i < collections.length; i++) {
            obj[collections[i].name] = collections[i].count;
          }
          response.end(JSON.stringify(obj));
        }
      }
    );
  } else {
    response.status(400).send("Bad param " + param);
  }
});

app.get("/user/list", function (request, response) {
  User.find({}, function (err, users) {
    if (err) {
      console.log("** Get user list: Error! **");
      response.status(500).send(JSON.stringify(err));
    } else {
      console.log("** Read server path /user/list Success! **");
      const userList = JSON.parse(JSON.stringify(users)); // convert Mongoose data to Javascript obj

      /**
       * * non-async method
       * Get only wanted user proeprties from Database's model,
       * and construct a new users obj to response.
       */
      const newUsers = userList.map((user) => {
        const { first_name, last_name, _id } = user;
        return { first_name, last_name, _id };
      });

      // Send response to client
      response.json(newUsers);
    }
  });
});

app.get("/user/:id", function (request, response) {
  const id = request.params.id;

  User.findOne({ _id: id }, function (err, user) {
    if (err) {
      console.log(`** User ${id}: Not Found! **`);
      response.status(400).send(JSON.stringify(err));
    } else {
      console.log(`** Read server path /user/${id} Success! **`);
      const userObj = JSON.parse(JSON.stringify(user));
      delete userObj.__v; // remove unnecessary property
      response.json(userObj);
    }
  });
});

app.get("/photosOfUser/:id", function (request, response) {
  const id = request.params.id;

  Photo.find({ user_id: id }, (err, photos) => {
    if (err) {
      console.log(`** Photos for user with id ${id}: Not Found! *`);
      response
        .status(400)
        .send(JSON.stringify(`** Photos for user with id ${id}: Not Found **`));
    } else {
      console.log(`** Read server path /photosOfUser/${id} Success! **`);
      let count = 0;
      const photoList = JSON.parse(JSON.stringify(photos));

      // For each photo in photos list:
      photoList.forEach((photo) => {
        delete photo.__v;

        async.eachOf(
          photo.comments,
          (comment, index, callback) => {
            User.findOne({ _id: comment.user_id }, (error, user) => {
              if (error) {
                console.error(
                  `Error fetching user for comment ${comment._id}:`,
                  error
                );
                return callback(error);
              }
              if (!user) {
                console.error(`User not found for comment ${comment._id}`);
              }

              const userObj = JSON.parse(JSON.stringify(user));
              const { location, description, occupation, __v, ...rest } =
                userObj;
              photo.comments[index].user = rest;
              delete photo.comments[index].user_id;

              callback();
            });
          },
          (error) => {
            if (error) {
              console.error("Error processing comments:", error);
              response.status(500).send("Error processing comments");
            } else {
              count += 1;
              if (count === photoList.length) {
                console.log("Done all async() processing");
                response.json(photoList);
              }
            }
          }
        );
      });
    }
  });
});

var server = app.listen(3000, function () {
  const port = server.address().port;
  console.log(
    "Listening at http://localhost:" +
      port +
      " exporting the directory " +
      __dirname
  );
});
