"use strict";

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
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
  },
};
