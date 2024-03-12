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
    {
      method: "GET",
      path: "/users/get-users",
      handler: "user.getUsers",
    },
  ],
};
