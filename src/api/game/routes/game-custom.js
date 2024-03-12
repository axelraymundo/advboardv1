module.exports = {
  routes: [
    {
      method: "GET",
      path: "/games/get-board",
      handler: "game-custom.getBoard",
    },
    {
      method: "GET",
      path: "/games/signup/:game_id",
      handler: "game-custom.signUpGame",
    },
    {
      method: "GET",
      path: "/games/leave/:game_id",
      handler: "game-custom.leaveGame",
    },
  ],
};
