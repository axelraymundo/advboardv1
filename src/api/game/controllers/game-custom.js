"use strict";

/**
 * A set of functions called "actions" for `game-custom`
 */

module.exports = {
  async getBoard(ctx) {
    const { search, sort, page, pageSize } = ctx.query;

    let filters = {};

    if (search) {
      filters = {
        $or: [
          {
            title: {
              $containsi: search,
            },
          },
        ],
      };
    }

    let sortObject = { id: "desc" };
    if (sort) {
      if (!(sort === "desc" || sort === "asc")) {
        return ctx.badRequest("sort must be asc or desc");
      }
      sortObject = { schedule: sort };
    }

    const entries = await strapi.entityService.findPage("api::game.game", {
      filters,
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
};
