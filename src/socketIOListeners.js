module.exports = async (strapi) => {
  //Array of objects for active users;
  strapi.activeUsers = [];

  console.log("Loading up socket.io...");

  //socket io instance
  let origin =
    process.env.NODE_ENV === "production"
      ? "https://api.fort7.net"
      : "http://localhost:3000";

  console.log("SOCKET ORIGIN", origin);

  const io = require("socket.io")(strapi.server.httpServer, {
    cors: {
      origin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  //socket connection listener
  io.on("connection", async (socket) => {
    console.log(`User socketID: ${socket.id} connected`);

    socket.on("login", async function (jwt, callBack) {
      console.log("on user login!", jwt);

      try {
        const tokenPayload = await strapi
          .service("plugin::users-permissions.jwt")
          .verify(jwt);

        console.log("is jwt legit?", tokenPayload);

        //if jwt is legit, get user data and store to active users along with the socket id
        if (tokenPayload && tokenPayload.id) {
          // const user = await strapi.entityService.findOne(
          //   "plugin::users-permissions.user",
          //   tokenPayload.id
          // );

          // console.log("SOCKET USER!", user);

          //check if socket id and user id is already in the active user array
          const existing = strapi.activeUsers.find(
            (user) =>
              user.user_id === tokenPayload.id && socket.id === user.socket_id
          );

          if (!existing) {
            strapi.activeUsers.push({
              user_id: tokenPayload.id,
              socket_id: socket.id,
              createdAt: new Date(),
            });
            console.log("active users", strapi.activeUsers);

            //set last online status
            await strapi.entityService.update(
              "plugin::users-permissions.user",
              tokenPayload.id,
              {
                data: {
                  last_online: new Date(),
                },
              }
            );

            callBack({ active_users: strapi.activeUsers });

            // console.log(
            //   "all",
            //   strapi.activeUsers.filter((au) => au.id === tokenPayload.id)
            // );
          } else {
            console.log("existing!", existing);
          }
        }
      } catch (e) {
        console.log("error socket login", e);
        callBack({ error: e });
      }
    });

    socket.on("disconnect", () => {
      console.log(`user disconnected ${socket.id}`);
      // Remove the user from the "activeUsers" after disconnected

      var userDisconnected = strapi.activeUsers.findIndex(
        (i) => i.socket_id === socket.id
      );

      console.log("discon index", userDisconnected);

      if (userDisconnected >= 0) {
        console.log(
          "user",
          strapi.activeUsers[userDisconnected],
          "has been disconnected"
        );
        strapi.activeUsers.splice(userDisconnected, 1);
      }
    });
  });

  //strapi global functions

  //check if online and on how many devices
  strapi.checkIfOnline = (user_id) => {
    return strapi.activeUsers.filter((u) => u.user_id === user_id).length;
  };

  //emit to user based on user id
  strapi.emitToUser = (user_id, data) => {
    const userDevices = strapi.activeUsers.filter((u) => u.user_id === user_id);
    userDevices.map((user) => {
      io.to(user.socket_id).emit("update", data);
    });
  };
};
