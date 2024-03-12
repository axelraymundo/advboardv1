"use strict";

/**
 * A set of functions called "actions" for `game-custom`
 */

module.exports = {
  async getBoard(ctx) {
    const { search, sort, from, to, page, pageSize } = ctx.query;

    let filters = {};

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
};
