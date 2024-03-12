module.exports = {
  routes: [
    {
      method: "GET",
      path: "/users/get-me",
      handler: "user.getMe",
    },
    {
      method: "PUT",
      path: "/users/update-me",
      handler: "user.updateMe",
    },
  ],
};
