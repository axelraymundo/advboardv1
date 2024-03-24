module.exports = {
  afterCreate(event) {
    const { result, params } = event;

    console.log("PARAMS?", params);

    strapi.emitToUser(params.data.user, {
      action: "notification_received",
      data: result,
    });
  },
};
