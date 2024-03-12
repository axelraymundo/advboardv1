"use strict";

/**
 * A set of functions called "actions" for `user`
 */

module.exports = {
  async getMe(ctx) {
    const entry = await strapi.entityService.findOne(
      "plugin::users-permissions.user",
      ctx.state.user.id,
      {
        fields: ["id", "full_name", "nickname", "dm_name", "user_type"],
      }
    );
    return entry;
  },
  async updateMe(ctx) {
    let data = ctx.request.body;

    //allowed data
    Object.entries(data).forEach(([key, value]) => {
      if (!["full_name", "nickname", "dm_name"].includes(key)) delete data[key];
    });

    const entry = await strapi.entityService.update(
      "plugin::users-permissions.user",
      ctx.state.user.id,
      {
        fields: ["id", "full_name", "nickname", "dm_name"],
        data,
      }
    );

    return entry;
  },

  async getUsers(ctx) {
    const { page, pageSize } = ctx.query;

    const entries = await strapi.entityService.findPage(
      "plugin::users-permissions.user",
      {
        fields: [
          "id",
          "full_name",
          "nickname",
          "dm_name",
          "user_type",
          "createdAt",
        ],
        page,
        pageSize,
      }
    );

    return entries;
  },
};
