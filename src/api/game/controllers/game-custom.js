"use strict";

/**
 * A set of functions called "actions" for `game-custom`
 */

module.exports = {
  async getBoard(ctx) {
    const { search, sort, from, to, page, pageSize } = ctx.query;

    let filters = {};

    //sample to and from
    // new Date("2022-03-24 05:00").toISOString();

    if (search) {
      filters["$or"] = [
        {
          title: {
            $containsi: search,
          },
        },
      ];
    }

    filters["$and"] = [
      {
        schedule: {
          $gte: from,
        },
      },
      {
        schedule: {
          $lte: to,
        },
      },
    ];

    let sortObject = { id: "asc" };
    if (sort) {
      if (!(sort === "desc" || sort === "asc")) {
        return ctx.badRequest("sort must be asc or desc");
      }
      sortObject = { schedule: sort };
    }

    const entries = await strapi.entityService.findPage("api::game.game", {
      filters,
      page,
      pageSize,
      sort: sortObject,
      fields: [
        "id",
        "title",
        "schedule",
        "type",
        "notes",
        "createdAt",
        "updatedAt",
      ],
      populate: {
        dungeon_master: {
          fields: ["id", "dm_name"],
        },
        players: {
          fields: ["id", "full_name", "nickname"],
        },
        other_players: true,
      },
    });

    return entries;
  },

  async signUpGame(ctx) {
    const user = ctx.state.user;
    const { game_id } = ctx.params;

    // if (!game_id) return ctx.badRequest("Invalid game id");

    //check if game exists
    const game = await strapi.entityService.findOne("api::game.game", game_id, {
      populate: {
        players_pending: true,
        players: true,
      },
    });

    if (!game) ctx.badRequest("Invalid game id");

    //check if player is already on the wait list
    if (
      game.players_pending &&
      game.players_pending.map((p) => p.id).includes(user.id)
    ) {
      ctx.badRequest("You have already signed up for this game");
    }

    //check if player is already on the player list
    if (game.players && game.players.map((p) => p.id).includes(user.id)) {
      ctx.badRequest("You have already been added to this game");
    }

    //add player to the wait list
    if (!game.players_pending) game.players_pending = [];
    game.players_pending.push(user.id);

    //update player logs
    if (!game.player_logs) game.player_logs = [];

    game.player_logs.push({
      message: `Player ${user.full_name} (${user.nickname}) wants to join your game`,
      user_id: user.id,
      log_date: new Date().toISOString(),
    });

    //update game details
    const entry = await strapi.entityService.update("api::game.game", game_id, {
      data: {
        players_pending: game.players_pending,
        player_logs: game.player_logs,
      },
      populate: {
        players_pending: true,
        players: true,
      },
    });

    if (entry) {
      return { success: true };
    }
  },

  async leaveGame(ctx) {
    const user = ctx.state.user;
    const { game_id } = ctx.params;

    // if (!game_id) return ctx.badRequest("Invalid game id");

    //check if game exists
    const game = await strapi.entityService.findOne("api::game.game", game_id, {
      populate: {
        players_pending: true,
        players: true,
      },
    });

    if (!game) ctx.badRequest("Invalid game id");

    let notPending = false;
    let notPlayer = false;

    //check if player is already on the wait list
    if (game.players_pending) {
      const players_pending = game.players_pending.map((p) => p.id);
      const index = players_pending.indexOf(user.id);
      if (index >= 0) {
        game.players_pending.splice(index, 1);
      } else {
        notPending = true;
      }
    }

    //check if player is already on the player list
    if (game.players) {
      const players = game.players_pending.map((p) => p.id);
      const index = players.indexOf(user.id);
      if (index >= 0) {
        game.players.splice(index, 1);
      } else {
        notPlayer = true;
      }
    }

    if (notPending && notPlayer) {
      return ctx.badRequest("You have not signed up or joined this game");
    }

    game.player_logs.push({
      message: `Player ${user.full_name} (${user.nickname}) has withdrawn from your game`,
      user_id: user.id,
      log_date: new Date().toISOString(),
    });

    //update game details
    const entry = await strapi.entityService.update("api::game.game", game_id, {
      data: {
        players_pending: game.players_pending,
        players: game.players,
        player_logs: game.player_logs,
      },
      populate: {
        players_pending: true,
        players: true,
      },
    });

    if (entry) {
      return { success: true };
    }
  },
};
