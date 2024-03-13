"use strict";

/**
 * A set of functions called "actions" for `game-custom`
 */

module.exports = {
  async getBoard(ctx) {
    const { search, sort, from, to, page, pageSize } = ctx.query;

    let filters = {
      status: {
        $notNull: true,
      },
    };

    //sample to and from
    // new Date("2022-03-24 05:00").toISOString();

    if (search) {
      filters["$or"] = [
        {
          title: {
            $containsi: search,
          },
        },
        {
          type: {
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
        "location",
        "type",
        "notes",
        "status",
        "createdAt",
        "updatedAt",
      ],
      populate: {
        dungeon_master: {
          fields: ["id", "full_name", "nickname", "dm_name"],
        },
        players: {
          fields: ["id", "full_name", "nickname"],
        },
        other_players: true,
      },
    });

    return entries;
  },

  async getGame(ctx) {
    const { game_id } = ctx.params;

    const game = await strapi.entityService.findOne("api::game.game", game_id, {
      fields: [
        "id",
        "title",
        "schedule",
        "location",
        "type",
        "notes",
        "status",
        "createdAt",
        "updatedAt",
      ],
      populate: {
        dungeon_master: {
          fields: ["id", "full_name", "nickname", "dm_name"],
        },
        players: {
          fields: ["id", "full_name", "nickname"],
        },
        other_players: true,
      },
    });

    return game;
  },

  async signUpGame(ctx) {
    const user = ctx.state.user;
    const { game_id } = ctx.params;

    // if (!game_id) return ctx.badRequest("Invalid game id");

    //check if game exists
    const game = await strapi.entityService.findOne("api::game.game", game_id, {
      populate: {
        dungeon_master: true,
        players_pending: true,
        players: true,
      },
    });

    if (!game) return ctx.badRequest("Invalid game id");

    if (game.dungeon_master && game.dungeon_master.id === user.id)
      return ctx.badRequest("You cannot join your own game!");

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
      message: `Player ${user.full_name} (${user.nickname}) wants to join this game`,
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

    if (!game) return ctx.badRequest("Invalid game id");

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
      const players = game.players.map((p) => p.id);
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

    if (!game.player_logs) game.player_logs = [];
    game.player_logs.push({
      message: `Player ${user.full_name} (${user.nickname}) has withdrawn from this game`,
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

  async acceptPlayer(ctx) {
    const user = ctx.state.user;
    const { game_id, player_id } = ctx.params;

    //check if game exists
    const game = await strapi.entityService.findOne("api::game.game", game_id, {
      populate: {
        dungeon_master: true,
        players_pending: true,
        players: true,
      },
    });

    //check if player exists
    const player = await strapi.entityService.findOne(
      "plugin::users-permissions.user",
      player_id,
      {}
    );

    if (!game) return ctx.badRequest("Invalid game id");
    if (!player) return ctx.badRequest("Invalid player id");

    if (!game.dungeon_master || game.dungeon_master.id !== user.id)
      return ctx.badRequest("You are not the DM of this game");

    let notPending = false;
    let notPlayer = false;

    //check if player is already on the player list
    if (game.players) {
      const players = game.players.map((p) => p.id);
      const index = players.indexOf(player.id);
      if (index >= 0) {
        return ctx.badRequest("You have already accepted this player");
      }
    } else {
      game.players = [];
    }

    //check if player is already on the wait list
    if (game.players_pending) {
      const players_pending = game.players_pending.map((p) => p.id);
      const index = players_pending.indexOf(player.id);
      if (index >= 0) {
        game.players_pending.splice(index, 1);
        game.players.push(player_id);
      } else {
        notPending = true;
      }
    }

    if (notPending) {
      return ctx.badRequest("This player has not signed up to this game");
    }

    if (!game.player_logs) game.player_logs = [];
    game.player_logs.push({
      message: `Player ${player.full_name} (${player.nickname}) has been accepted to this game`,
      user_id: player.id,
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

  async addPlayer(ctx) {
    const user = ctx.state.user;
    const { game_id, player_id } = ctx.params;

    //check if game exists
    const game = await strapi.entityService.findOne("api::game.game", game_id, {
      populate: {
        dungeon_master: true,
        players_pending: true,
        players: true,
      },
    });

    //check if player exists
    const player = await strapi.entityService.findOne(
      "plugin::users-permissions.user",
      player_id,
      {}
    );

    if (!game) return ctx.badRequest("Invalid game id");
    if (!player) return ctx.badRequest("Invalid player id");

    if (!game.dungeon_master || game.dungeon_master.id !== user.id)
      return ctx.badRequest("You are not the DM of this game");

    if (game.dungeon_master && game.dungeon_master.id === player.id)
      return ctx.badRequest("You cannot join your own game!");

    //check if player is already on the player list
    if (game.players) {
      const players = game.players.map((p) => p.id);
      const index = players.indexOf(player.id);
      if (index >= 0) {
        return ctx.badRequest("You have already accepted this player");
      }
    } else {
      game.players = [];
    }

    game.players.push(player.id);

    if (!game.player_logs) game.player_logs = [];
    game.player_logs.push({
      message: `Player ${player.full_name} (${player.nickname}) has been added to this game`,
      user_id: player.id,
      log_date: new Date().toISOString(),
    });

    //update game details
    const entry = await strapi.entityService.update("api::game.game", game_id, {
      data: {
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

  async removePlayer(ctx) {
    const user = ctx.state.user;
    const { game_id, player_id } = ctx.params;

    //check if game exists
    const game = await strapi.entityService.findOne("api::game.game", game_id, {
      populate: {
        dungeon_master: true,
        players_pending: true,
        players: true,
      },
    });

    //check if player exists
    const player = await strapi.entityService.findOne(
      "plugin::users-permissions.user",
      player_id,
      {}
    );

    if (!game) return ctx.badRequest("Invalid game id");
    if (!player) return ctx.badRequest("Invalid player id");

    if (!game.dungeon_master || game.dungeon_master.id !== user.id)
      return ctx.badRequest("You are not the DM of this game");

    let notPending = false;
    let notPlayer = false;

    //check if player is already on the player list
    if (game.players) {
      const players = game.players.map((p) => p.id);
      const index = players.indexOf(player.id);
      if (index >= 0) {
        game.players.splice(index, 1);
      } else {
        notPlayer = true;
      }
    }

    if (notPlayer) {
      return ctx.badRequest("This player is not in this game");
    }

    if (!game.player_logs) game.player_logs = [];
    game.player_logs.push({
      message: `Player ${player.full_name} (${player.nickname}) has been removed from this game`,
      user_id: player.id,
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

  async getGames(ctx) {
    const user = ctx.state.user;
    const { status, search, sort, page, pageSize } = ctx.query;

    if (!status) {
      return ctx.badRequest("Please indicate status if pending or active ");
    }

    let where = {};
    if (status === "pending") {
      where["players_pending"] = {
        id: {
          $in: [user.id],
        },
      };
    } else if (status === "active") {
      where["players"] = {
        id: {
          $in: [user.id],
        },
      };
    }
    if (search) {
      where["title"] = {
        $contains: search,
      };
    }

    let offset = parseInt(page) === 1 ? 0 : parseInt(page) * parseInt(pageSize);

    const [entries, count] = await strapi.db
      .query("api::game.game")
      .findWithCount({
        where,
        select: [
          "id",
          "title",
          "schedule",
          "location",
          "type",
          "notes",
          "status",
          "createdAt",
          "updatedAt",
        ],
        orderBy: { schedule: "desc" },
        populate: {
          dungeon_master: {
            select: ["id", "full_name", "nickname", "dm_name"],
          },
          players: {
            select: ["id", "full_name", "nickname"],
          },
          other_players: true,
        },
        offset,
        limit: pageSize,
      });

    return {
      results: entries,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        pageCount: Math.ceil(count / parseInt(pageSize)),
        total: count,
      },
    };
  },

  async getGamesDM(ctx) {
    const user = ctx.state.user;
    const { search, sort, page, pageSize } = ctx.query;

    let where = {};
    where["dungeon_master"] = {
      id: user.id,
    };
    if (search) {
      where["title"] = {
        $contains: search,
      };
    }

    let offset = parseInt(page) === 1 ? 0 : parseInt(page) * parseInt(pageSize);

    const [entries, count] = await strapi.db
      .query("api::game.game")
      .findWithCount({
        where,
        select: [
          "id",
          "title",
          "schedule",
          "location",
          "type",
          "notes",
          "status",
          "createdAt",
          "updatedAt",
          "player_logs",
          "game_logs",
        ],
        orderBy: { id: "desc" },
        populate: {
          dungeon_master: {
            select: ["id", "full_name", "nickname", "dm_name"],
          },
          players_pending: {
            select: ["id", "full_name", "nickname"],
          },
          players: {
            select: ["id", "full_name", "nickname"],
          },
          other_players: true,
        },
        offset,
        limit: pageSize,
      });

    return {
      results: entries,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        pageCount: Math.ceil(count / parseInt(pageSize)),
        total: count,
      },
    };
  },

  async getGameDM(ctx) {
    const user = ctx.state.user;
    const { game_id } = ctx.params;

    const entry = await strapi.db.query("api::game.game").findOne({
      where: {
        $and: [
          {
            id: game_id,
          },
          {
            dungeon_master: {
              id: user.id,
            },
          },
        ],
      },
      select: [
        "id",
        "title",
        "schedule",
        "location",
        "type",
        "notes",
        "status",
        "createdAt",
        "updatedAt",
        "player_logs",
        "game_logs",
      ],
      populate: {
        dungeon_master: {
          select: ["id", "full_name", "nickname", "dm_name"],
        },
        players_pending: {
          select: ["id", "full_name", "nickname"],
        },
        players: {
          select: ["id", "full_name", "nickname"],
        },
        other_players: true,
      },
    });

    return entry;
  },

  async createGame(ctx) {
    const user = ctx.state.user;

    if (user.user_type !== "dm")
      return ctx.badRequest("Only DMs can create games");

    let data = ctx.request.body;

    if (data.title === "") ctx.badRequest("title cannot be blank");

    //allowed data
    Object.entries(data).forEach(([key, value]) => {
      if (!["title", "schedule", "location", "type", "notes"].includes(key))
        delete data[key];
    });

    data.dungeon_master = user.id;
    data.player_logs = [];
    data.game_logs = [];

    const entry = await strapi.entityService.create("api::game.game", {
      data,
      populate: {
        dungeon_master: {
          fields: ["id", "full_name", "nickname", "dm_name"],
        },
      },
    });

    return entry;
  },

  async updateGame(ctx) {
    const user = ctx.state.user;
    const { game_id } = ctx.params;

    if (user.user_type !== "dm")
      return ctx.badRequest("Only DMs can update games");

    const game = await strapi.entityService.findOne("api::game.game", game_id, {
      populate: {
        dungeon_master: true,
        players: true,
      },
    });

    if (!game.dungeon_master || game.dungeon_master.id !== user.id)
      return ctx.badRequest("You are not the DM of this game");

    let data = ctx.request.body;

    if (data.title === "") ctx.badRequest("title cannot be blank");

    //allowed data
    Object.entries(data).forEach(([key, value]) => {
      if (
        ![
          "title",
          "schedule",
          "location",
          "type",
          "notes",
          "status",
          "players",
          "other_players",
        ].includes(key)
      )
        delete data[key];
    });

    console.log(data);

    const entry = await strapi.entityService.update("api::game.game", game_id, {
      data,
      populate: {
        dungeon_master: {
          fields: ["id", "full_name", "nickname", "dm_name"],
        },
        players: {
          fields: ["id", "full_name", "nickname", "dm_name"],
        },
        other_players: true,
      },
    });

    return entry;
  },
};
