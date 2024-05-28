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
// app.post("/photosOfUser/mentions", function (request, response) {
//   var mentionedUsersIdArr = request.body.user_id_arr;
//   var photoId = request.body.photoId;
//   Photo.findOne({ _id: photoId }, function (err, photoInfo) {
//     if (err) {
//       console.error("Doing /photosOfUser/mentions error: ", err);
//       response.status(400).send(JSON.stringify(err));
//       return;
//     }
//     if (photoInfo === null || photoInfo === undefined) {
//       console.log("Photos not found.");
//       response.status(400).send("Not found");
//       return;
//     }

//     for (var i = 0; i < mentionedUsersIdArr.length; i++) {
//       if (!photoInfo.mentions.includes(mentionedUsersIdArr[i])) {
//         photoInfo.mentions.push(mentionedUsersIdArr[i]);
//       }
//     }
//     Photo.findOneAndUpdate(
//       { _id: photoId },
//       { mentions: photoInfo.mentions },
//       { new: true },
//       function (error) {
//         if (error) {
//           console.error("Adding mentions error: ", error);
//           response.status(400).send(JSON.stringify(error));
//           return;
//         }
//         response.status(200).send("Mention successfully registered.");
//       }
//     );
//   });
// });
// app.get("/userMentions/:id", function (request, response) {
//   var user_id = request.params.id;
//   Photo.find({}, function (err, photoInfo) {
//     if (err) {
//       console.error("Doing /userMentions/:id error: ", err);
//       response.status(400).send(JSON.stringify(err));
//       return;
//     }
//     if (photoInfo === null || photoInfo === undefined) {
//       console.log("Photos not found.");
//       response.status(400).send("Not found");
//       return;
//     }
//     let mentionedPhotos = [];
//     for (var i = 0; i < photoInfo.length; i++) {
//       if (photoInfo[i].mentions.includes(user_id)) {
//         mentionedPhotos.push({
//           file_name: photoInfo[i].file_name,
//           owner_id: photoInfo[i].user_id,
//         });
//       }
//     }
//     async.each(mentionedPhotos, addOwnersName, allDone);

//     function addOwnersName(mentionedPhotosFile, callback) {
//       var ownerId = mentionedPhotosFile.owner_id;
//       User.findOne({ _id: ownerId }, function (error, ownerInfo) {
//         if (!error) {
//           var ownerFirstName = ownerInfo.first_name;
//           var ownerLastName = ownerInfo.last_name;
//           mentionedPhotosFile.owner_name = ownerFirstName + " " + ownerLastName;
//         }
//         callback(error);
//       });
//     }

//     function allDone(error) {
//       if (error) {
//         response.status(500).send(error);
//       } else {
//         response.status(200).send(mentionedPhotos);
//       }
//     }
//   });
// });
app.get("/user2/:id", hasSessionRecord, async function (request, response) {
  const userID = request.params.id;

  try {
    /**
     * * Noted: By using await, subsequent lines of code
     * * after the await expression will not execute
     * * until the awaited promise resolves or rejects.
     */
    const user = await User.findOne({ _id: userID });

    // handle not user found
    if (!user) {
      console.log(`** User of ${userID}: Not Found! **`);
      return response.status(404).json({ message: `User not found` });
    }

    // handle found user
    const userObj = JSON.parse(JSON.stringify(user)); // Convert Mongoose object to a plain JavaScript object
    delete userObj.__v; // remove unnecessary property
    userObj.logged_user_first_name = request.session.sessionUserFirstName; // save logged user first name for TopBar
    userObj.logged_user_last_name = request.session.sessionUserLastName;
    userObj.logged_user_id = request.session.sessionUserID;
    console.log(
      `** Server: login user: ${userObj.logged_user_first_name} found! **`
    );

    // Get most recent photo and most commented photo
    const photosData = await Photo.find({ user_id: userID });

    // handle not photo found (user has not posted any photos yet)
    if (photosData.length === 0) {
      console.log(`** User has not posted any photos yet **`);
      return response.status(200).json(userObj);
    }

    // handle found photo
    const photos = JSON.parse(JSON.stringify(photosData)); // get data from server and convert to JS data

    // get the most recent uploaded photo
    photos.sort(
      (a, b) =>
        new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
    ); // sort photos in a descending order by date
    if (photos.length > 0) {
      userObj.mostRecentPhotoName = photos[0].file_name;
      userObj.mostRecentPhotoDate = formatDateTime(photos[0].date_time);
    }

    // get the most commented photo
    photos.sort((a, b) => b.comments.length - a.comments.length);
    if (photos.length > 0) {
      userObj.mostCommentedPhotoName = photos[0].file_name;
      userObj.commentsCount = photos[0].comments.length;
    }

    // response the data back to the frontend browser
    return response.status(200).json(userObj); // retuen user detail INCLUDING recent photo and most commented photo
  } catch (error) {
    console.log(`** From "/user/:id": User ${userID}: Not Found! **`);
    console.log("Error: ", error.message);
    return response.status(500).json({ message: "Internal Server Error" });
  }
});
/**
 * Constructing a photo's like object
 * @param {Object} photos
 * @param {Object} response
 * Used by app.get('/photosOfUser/:id')
 * */
function processPhotoLike(photos, response) {
  let processedPhotos = 0; // reset processed photos count for like object

  photos.forEach((photo) => {
    async.eachOf(
      photo.likes,
      (liked_user_id, index, done_callback) => {
        // For each like in photo's lieks list, use liked_user_id property to find user object in Mongoose database
        User.findOne({ _id: liked_user_id }, (error, user) => {
          if (!error) {
            const userObj = JSON.parse(JSON.stringify(user)); // parse retrieved Mongoose user data
            const {
              location,
              description,
              occupation,
              __v,
              password_digest,
              salt,
              login_name,
              ...rest
            } = userObj; // only keep (_id, first_name, last_name) properties
            photo.likes[index] = rest; // update the user obj to each comment's user property.
          }
          done_callback(error); // this function will execute after all like items in likes list are processed (the third argument)
        });
      },
      (err) => {
        processedPhotos += 1; // the callback functon only get called once after all items have been processed.
        if (err) {
          response
            .status(400)
            .json({ message: "Error occured in finding likes under a photo" });
          return;
        }
        if (processedPhotos === photos.length) {
          // All photos comments and likes processed!
          response.status(200).json(photos); // Send the response only when all processing is done
        }
      }
    ); // end of "async.eachOf()"
  });
}

/**
 * Sort photo in descending order by likes votes first, then by date
 * Used by app.get('/photosOfUser/:id')
 * @param {Object} photos
 * @returns list of sorted photos
 */
function sortedPhotos(photos) {
  return photos.sort((a, b) => {
    // Sort by like count in descending order
    if (b.likes.length !== a.likes.length) {
      return b.likes.length - a.likes.length;
    }
    // If like counts are the same, sort by timestamp in descending order
    return new Date(b.date_time).getTime() - new Date(a.date_time).getTime();
  });
}

/**
 * * Jian Zhong
 * * URL /photosOfUser/:id - Return the Photos from User's id
 */
app.get("/photosOfUser/:id", hasSessionRecord, function (request, response) {
  const id = request.params.id;

  /**
   * Finding a single user's photos from the user's ID
   */
  Photo.find({ user_id: id }, (err, photosData) => {
    if (err) {
      console.log(`Photos with user id ${id}: Not Found`);
      response
        .status(400)
        .json({ message: `Photos with user id ${id}: Not Found` });
    }

    const photos = JSON.parse(JSON.stringify(photosData)); // get data from server and convert to JS data
    if (photos.length === 0) {
      console.log(`Sending photos of Null value to front-end: `, null);
      response.status(200).json(null); // ! but fixed by replacing 'photos' with 'null'
      // ! Bug1 fixed temperally: inifinte loops if refresh the user photos' page
      // ! when user has no photos posted yet
      // ! but refreshing the page works when user has one or more photos posted.
    }

    /**
     * * Start constructing each photo's comment object
     * * Since each photo has a list of comments with opeartions, so use async.eachOf()
     * * to do the operations for each comment asynchronously.
     * Since each commment under photo contains only user_id property,
     * so need to find comment text from user_id, and create each commment object
     */
    // For each photo in photos list:
    sortedPhotos(photos); // sort photo in descending order by likes votes first, then by date
    let processedPhotos = 0; // count the number of processed photos
    photos.forEach((photo) => {
      delete photo.__v; // remove the unnessary property before sending to client
      photo.date_time = formatDateTime(photo.date_time); // make date time of each photo more readable

      /**
       * * Start constructing each photo's comment object
       * * Since each photo has a list of comments with opeartions, so use async.eachOf()
       * * to do the operations for each comment asynchronously.
       * Since each commment under photo contains only user_id property,
       * so need to find comment text from user_id, and create each commment object
       */
      async.eachOf(
        photo.comments,
        (comment, index, done_callback) => {
          // For each comment in comments list, use user_id property to find user object in Mongoose database
          User.findOne({ _id: comment.user_id }, (error, user) => {
            if (!error) {
              const userObj = JSON.parse(JSON.stringify(user)); // parse retrieved Mongoose user data
              const { location, description, occupation, __v, ...rest } =
                userObj; // only keep (_id, first_name, last_name) properties
              photo.comments[index].user = rest; // update the user obj to each comment's user property.
              delete photo.comments[index].user_id; // remove unnessary property for each comment
            }
            done_callback(error);
          });
        },
        (err1) => {
          processedPhotos += 1; // count increases by 1 when each entire photo's likes list is all done.
          if (err1) {
            response.status(400).json({
              message: "Error occured in finding commments under a photo",
            });
            return;
          }
          if (processedPhotos === photos.length) {
            // when all photos' likes lists are done, response back to the server.
            processPhotoLike(photos, response);
          }
        }
      ); // end of "async.eachOf()"
    }); // end of "photoList.forEach()"
  });
});
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

var server = app.listen(3000, function () {
  const port = server.address().port;
  console.log(
    "Listening at http://localhost:" +
      port +
      " exporting the directory " +
      __dirname
  );
});
