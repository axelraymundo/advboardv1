module.exports = async (strapi) => {
  const admin = require("firebase-admin");
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  strapi.firebase = admin;

  //create function, move this to firebase service later
  strapi.validateFCMToken = async (token) => {
    console.log(token, JSON.stringify(token) === "{}");

    if (token === undefined || JSON.stringify(token) === "{}") return false;

    return new Promise((resolve, reject) => {
      strapi.firebase
        .messaging()
        .send({ token })
        .then((response) => {
          // Response is a message ID string.
          console.log("Successfully sent message:", response);
          resolve(true);
        })
        .catch((error) => {
          console.log("Error sending message:", error);
          resolve(false);
        });
    });
  };

  strapi.pushNotification = async (message) => {
    console.log("pushing?", message);
    const msg = { ...message };

    msg.notification = {
      body: message.data.body,
      title: message.data.title,
    };
    msg.android = { priority: "high" };
    msg.priority = 10;

    const tokens = msg.tokens;

    return new Promise((resolve, reject) => {
      strapi.firebase
        .messaging()
        .sendMulticast(msg)
        .then(async function (response) {
          console.log("success?", JSON.stringify(response));

          let results = response.responses;
          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (!result.success) {
              console.log("DELETE ", i, tokens[i]);

              const toDelete = await strapi.db
                .query("api::device-token.device-token")
                .delete({
                  where: { token: tokens[i] },
                });
            }
          }

          resolve(response);
        })
        .catch(function (error) {
          console.log("error", error);
          reject(error);
        });
    });
  };
};
