module.exports = {
  async afterCreate(event) {
    const { result, params } = event;

    //socket notification
    strapi.emitToUser(params.data.user, {
      action: "notification_received",
      data: result,
    });

    //firebase notification
    const entries = await strapi.entityService.findPage(
      "api::device-token.device-token",
      {
        filters: {
          user: params.data.user,
        },
        page: 1,
        pageSize: 100,
      }
    );

    if (entries.results.length > 0) {
      // process the tokens
      const message = {
        data: { title: result.title, body: result.body },
        tokens: entries.results.map((r) => r.token),
      };

      await strapi.pushNotification(message);
    }
  },
};
