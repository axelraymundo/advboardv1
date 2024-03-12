module.exports = {
  routes: [
    {
      method: "GET",
      path: "/games/get-board",
      handler: "game-custom.getBoard",
    },
  ],
};
