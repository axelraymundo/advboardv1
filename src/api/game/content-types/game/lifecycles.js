module.exports = {
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
