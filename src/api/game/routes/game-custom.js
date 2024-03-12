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
    {
      method: "GET",
      path: "/games/accept/:game_id/:player_id",
      handler: "game-custom.acceptPlayer",
    },
    {
      method: "GET",
      path: "/games/remove/:game_id/:player_id",
      handler: "game-custom.removePlayer",
    },
    {
      method: "GET",
      path: "/games/get-games",
      handler: "game-custom.getGames",
    },
    {
      method: "GET",
      path: "/games/get-games-dm",
      handler: "game-custom.getGamesDM",
    },
  ],
};
