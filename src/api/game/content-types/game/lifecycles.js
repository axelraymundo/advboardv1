module.exports = {
  async beforeCreate(event) {
    const { data, where, select, populate } = event.params;

    if (data.updatedBy) {
      if (JSON.stringify(data.place).includes("id")) {
        //place was changed
        if (data.place.connect.length > 0) {
          const place = await strapi.entityService.findOne(
            "api::location.location",
            data.place.connect[0].id,
            {}
          );

          event.params.data.location = place.name;
        } else {
          event.params.data.location = "Not Available";
        }
      }
    } else {
      //normal
      const place = await strapi.entityService.findOne(
        "api::location.location",
        data.place,
        {}
      );

      event.params.data.location = place.name;
    }
  },

  async beforeUpdate(event) {
    const { data, where, select, populate } = event.params;

    if (data.updatedBy) {
      if (JSON.stringify(data.place).includes("id")) {
        //place was changed
        if (data.place.connect.length > 0) {
          const place = await strapi.entityService.findOne(
            "api::location.location",
            data.place.connect[0].id,
            {}
          );

          event.params.data.location = place.name;
        } else {
          event.params.data.location = "Not Available";
        }
      }
    } else {
      //normal
      const place = await strapi.entityService.findOne(
        "api::location.location",
        data.place,
        {}
      );

      event.params.data.location = place.name;
    }
  },

  afterUpdate(event) {
    const { data, where, select, populate } = event.params;

    strapi.emitToAll("update_board", { action: "board_updated" });
  },

  afterCreate(event) {
    const { result, params } = event;

    // do something to the result;
    strapi.emitToAll("update_board", { action: "board_created" });
  },
};
