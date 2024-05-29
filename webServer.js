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
mongoose.connect("mongodb://127.0.0.1/cs142project8", {
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
//*********************project8***************************************** */
// app.post("/addMention/:photoId/:commentId", (req, res) => {
//   const { photoId, commentId } = req.params;
//   const { mentionedUserId } = req.body;

//   // Validate mentioned user ID
//   // You might want to check if the user exists in your database

//   // Update the comment with the mentioned user ID
//   Photo.findOneAndUpdate(
//     { _id: photoId, "comments._id": commentId },
//     {
//       $addToSet: {
//         "comments.$.mentions": { mentioned_user_id: mentionedUserId },
//       },
//     },
//     { new: true }
//   )
//     .then((photo) => {
//       if (!photo) {
//         return res.status(404).json({ error: "Photo or comment not found" });
//       }
//       res.json(photo);
//     })
//     .catch((error) => {
//       console.error("Error adding mention:", error);
//       res.status(500).json({ error: "Internal server error" });
//     });
// });
// app.get("/photosWithMentions/:userId", (req, res) => {
//   const { userId } = req.params;

//   // Query photos with mentions of the specified user
//   Photo.find({ "comments.mentions.mentioned_user_id": userId })
//     .then((photos) => {
//       res.json(photos);
//     })
//     .catch((error) => {
//       console.error("Error retrieving photos with mentions:", error);
//       res.status(500).json({ error: "Internal server error" });
//     });
// });

app.post("/like/:photo_id", (request, response) => {
  const photoID = request.params.photo_id;
  const userID = request.body.user_id; // Get the user ID from the request body

  if (!userID) {
    return response.status(400).json({ message: "User ID is required" });
  }

  Photo.findById(photoID)
    .then((photo) => {
      if (!photo) {
        return response.status(404).json({ message: "Photo not found" });
      }

      const userIndex = photo.likes.indexOf(userID);
      if (userIndex === -1) {
        // User has not liked the photo yet
        photo.likes.push(userID);
      } else {
        // User has already liked the photo
        photo.likes.splice(userIndex, 1);
      }

      return photo.save();
    })
    .then(() => {
      response.status(200).json({ message: "Like updated successfully" });
    })
    .catch((error) => {
      console.error("Error updating likes:", error);
      response.status(500).json({ message: "Internal server error" });
    });
});

/**
 * Function to delete the entire user account by the user id posted
 */
app.post("/deleteUser/:id", async (request, response) => {
  const userIdToRemove = request.params.id;
  console.log("User to remove: " + userIdToRemove);

  try {
    // Delete the [User]
    const result = await User.findByIdAndDelete(userIdToRemove);
    console.log("Deleted the User: ", result);

    // Delete all [Photos] posted by the user
    const userPhotos = await Photo.find({ user_id: userIdToRemove }); // all photos posted by the user
    const deletionPromises = userPhotos.map(async (photo) => {
      const deletedPhoto = await Photo.findByIdAndDelete(photo._id);
      console.log("Deleted Photo:", deletedPhoto);
    });

    /**
     * * Noted: In cases where you want multiple asynchronous operations to run concurrently.
     * * In such cases, you might use Promise.all() or other approaches.
     */
    await Promise.all(deletionPromises); // Await all deletion promises to complete

    // Delete all [Likes] and [Comments] by the user from all related photos
    let updatedPhoto;
    const allPhotos = await Photo.find(); // collect all the rest phots
    const updatePromises = allPhotos.map(async (photo) => {
      // delete all deleted user's likes in each photo
      if (photo.likes.includes(userIdToRemove)) {
        updatedPhoto = await Photo.finByIdAndUpdate(
          photo._id,
          { $pull: { likes: userIdToRemove } },
          { new: true }
        ); // To return the updated document
      }
      // delete all deleted user's comments in each photo
      // * Fixed bug: comment.user_id is new ObjectId type,
      // * and it is not the same as String type even they have the same value!!!!!
      const commentsToDelete = photo.comments.filter(
        (comment) => comment.user_id.toString() === userIdToRemove
      ); // see if any photo has comment by the deleted user
      const commentUpdatePromises = commentsToDelete.map(
        async (commentToDelete) => {
          updatedPhoto = await Photo.findByIdAndUpdate(
            photo._id,
            { $pull: { comments: commentToDelete } },
            { new: true }
          );
        }
      );
      // Combine all comment deletion promises for this photo
      const combinedPromises = updatedPhoto
        ? [updatedPhoto, ...commentUpdatePromises]
        : commentUpdatePromises;
      return combinedPromises;
    });

    // Await all deletion promises to complete and return to front-end
    const flattenedPromises = updatePromises.flat(); // Flatten the array of arrays into a single array of promises
    await Promise.all(flattenedPromises);
    response.status(200).json({ message: "User deleted successfully!" });
  } catch (error) {
    console.error("Error destroying User:", error.message);
    response.status(500).json({ message: "Internal server error" });
  }
});
/**
 * To delete a comment from the comment id and from a photo id.
 */
app.post("/deleteComment/:id", async (request, response) => {
  const commentIdToDelete = request.params.id; // comment id to remove
  const photoID = request.body.photo_id; // commented photo's ID

  try {
    // find comment obj by comment id
    const photo = await Photo.findById(photoID);
    if (!photo) {
      console.log("Photo not found");
      response.status(404).json({ message: "Photo not found" });
    }
    console.log("Photo found: ", photo);
    const commentToDelete = photo.comments.filter(
      (comment) => comment._id.toString() === commentIdToDelete
    );
    if (commentToDelete.length !== 1) {
      console.log("Comment not found");
      response.status(404).json({ message: "Comment not found" });
    }

    // remove the comment obj from the photo's comments list
    const updatedPhoto = await Photo.findByIdAndUpdate(
      photoID,
      { $pull: { comments: commentToDelete[0] } },
      { new: true }
    );
    if (updatedPhoto) {
      console.log("Updated photo: ", updatedPhoto);
      response.status(200).json({ message: "Comment deleted successfully!" });
    }
  } catch (error) {
    console.error("Error deleting comment:", error.message);
    response.status(500).json({ message: "Internal server error" });
  }
});

app.post("/deletePhoto/:id", async (request, response) => {
  const photoIdToDelete = request.params.id; // photo id to remove

  try {
    // find comment obj by comment id
    const deleted_photo = await Photo.findByIdAndDelete(photoIdToDelete);
    if (!deleted_photo) {
      console.log("Photo not found");
      response.status(404).json({ message: "Photo not found" });
    }
    response.status(200).json({ message: "Photo deleted successfully!" });
  } catch (error) {
    console.error("Error deleting comment:", error.message);
    response.status(500).json({ message: "Internal server error" });
  }
});

// app.post("/favorite/:photoId", hasSessionRecord, async (req, res) => {
//   try {
//     const user = await User.findById(req.session.userId);
//     if (!user.favorites.includes(req.params.photoId)) {
//       user.favorites.push(req.params.photoId);
//       await user.save();
//     }
//     res.status(200).send("Photo added to favorites");
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// });

// // Remove a photo from favorites
// app.post("/unfavorite/:photoId", hasSessionRecord, async (req, res) => {
//   try {
//     const user = await User.findById(req.session.userId);
//     user.favorites.pull(req.params.photoId);
//     await user.save();
//     res.status(200).send("Photo removed from favorites");
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// });

// // Get the list of favorited photos
// app.get("/favorites", hasSessionRecord, async (req, res) => {
//   try {
//     const user = await User.findById(req.session.userId).populate("favorites");
//     res.status(200).json(user.favorites);
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// });
var server = app.listen(3000, function () {
  const port = server.address().port;
  console.log(
    "Listening at http://localhost:" +
      port +
      " exporting the directory " +
      __dirname
  );
});
