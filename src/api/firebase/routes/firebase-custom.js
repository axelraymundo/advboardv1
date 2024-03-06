module.exports = {
  routes: [
    {
      method: "POST",
      path: "/firebase/auth",
      handler: "firebase.auth",
    },
    {
      method: "POST",
      path: "/firebase/testnotif",
      handler: "firebase.pushNotification",
    },
    {
      method: "POST",
      path: "/firebase/saveFCMToken",
      handler: "firebase.saveFCMToken",
    },
    {
      method: "DELETE",
      path: "/firebase/deleteFCMToken/:id",
      handler: "firebase.deleteFCMToken",
    },
  ],
};
