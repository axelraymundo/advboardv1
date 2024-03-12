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
        fields: ["id", "full_name", "nickname", "dm_name"],
      }
    );
    return entry;
  },
  async updateMe(ctx) {
    const entry = await strapi.entityService.update(
      "plugin::users-permissions.user",
      ctx.state.user.id,
      {
        fields: ["id", "full_name", "nickname", "dm_name"],
        data: ctx.request.body,
      }
    );

    return entry;
  },
};
