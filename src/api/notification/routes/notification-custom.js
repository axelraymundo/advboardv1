module.exports = {
  routes: [
    {
      method: "GET",
      path: "/notifications/get-notifications",
      handler: "notification-custom.getNotifications",
    },
    {
      method: "GET",
      path: "/notifications/get-unread-notifications",
      handler: "notification-custom.getUnreadNotifications",
    },
    {
      method: "GET",
      path: "/notifications/read-notification/:notification_id",
      handler: "notification-custom.readNotification",
    },
  ],
};
