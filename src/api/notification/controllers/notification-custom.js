"use strict";

/**
 * A set of functions called "actions" for `game-custom`
 */

module.exports = {
  async getNotifications(ctx) {
    const { page, pageSize } = ctx.query;

    const entries = await strapi.entityService.findPage(
      "api::notification.notification",
      {
        filters: {
          user: ctx.state.user.id,
        },
        page,
        pageSize,
        // populate: {
        //   user: {
        //     fields: ["id", "full_name", "nickname", "dm_name"],
        //   },
        // },
        sort: { id: "desc" },
      }
    );

    return entries;
  },

  async getUnreadNotifications(ctx) {
    const [entries, count] = await strapi.db
      .query("api::notification.notification")
      .findWithCount({
        select: ["id"],
        where: { user: ctx.state.user.id, is_read: false },
        orderBy: { id: "DESC" },
      });

    return { count };
  },

  async readNotification(ctx) {
    const { notification_id } = ctx.params;

    let entry = await strapi.entityService.findOne(
      "api::notification.notification",
      notification_id,
      {
        populate: { user: true },
      }
    );

    if (entry.user.id !== ctx.state.user.id) {
      return ctx.badRequest("You don't own this notification");
    }

    entry = await strapi.entityService.update(
      "api::notification.notification",
      notification_id,
      {
        data: {
          is_read: true,
        },
        fields: ["id", "is_read"],
      }
    );

    return entry;
  },
};
