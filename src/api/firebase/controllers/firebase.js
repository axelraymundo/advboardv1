"use strict";

/**
 *  firebase controller
 */

const utils = require("@strapi/utils");
const { sanitize } = utils;

const sanitizeOutput = (user, ctx) => {
  const schema = strapi.getModel("plugin::users-permissions.user");
  const { auth } = ctx.state;

  return sanitize.contentAPI.output(user, schema, { auth });
};

const getService = (name) => {
  return strapi.plugin("users-permissions").service(name);
};

const genUsername = require("unique-username-generator");

module.exports = {
  async auth(ctx) {
    try {
      const idToken = ctx.request.body.token;
      const decodedToken = await strapi.firebase.auth().verifyIdToken(idToken);

      // console.log(decodedToken);

      if (decodedToken.email) {
        let jwt;
        let user = await strapi.db
          .query("plugin::users-permissions.user")
          .findOne({
            where: {
              email: decodedToken.email,
            },
          });
        if (user) {
          //remove username
          const userData = await sanitizeOutput(user, ctx);
          delete userData.username;

          ctx.send({
            jwt: getService("jwt").issue({
              id: user.id,
            }),
            user: userData,
          });
        } else {
          const pluginStore = await strapi.store({
            type: "plugin",
            name: "users-permissions",
          });

          const settings = await pluginStore.get({
            key: "advanced",
          });

          const role = await strapi
            .query("plugin::users-permissions.role")
            .findOne({ where: { type: settings.default_role } });

          const data = {};
          data.role = role.id;
          data.email = decodedToken.email;
          data.full_name = decodedToken.name;
          data.username = genUsername.generateUsername("-", 4);
          data.nickname = data.username;
          //   data.username = `${decodedToken.firebase.sign_in_provider}_${decodedToken.email}`;
          data.confirmed = true;
          data.signin_provider = decodedToken.firebase.sign_in_provider;

          let user = await strapi.db
            .query("plugin::users-permissions.user")
            .create({
              data,
            });

          if (user) {
            user = await sanitizeOutput(user, ctx);
            jwt = getService("jwt").issue({
              id: user.id,
            });

            delete user.username;

            ctx.body = {
              user,
              jwt,
            };
          } else {
            return ctx.badRequest(null, [
              { messages: [{ id: "user is empty" }] },
            ]);
          }
        }
      } else {
        return ctx.badRequest(null, [
          { messages: [{ id: "email is missing" }] },
        ]);
      }
    } catch (error) {
      console.log(error);
      return ctx.badRequest(null, [{ messages: [{ id: "unauthorized" }] }]);
    }
  },

  async pushNotification(ctx) {
    const registrationTokens = [...ctx.request.body.tokens];

    // process the tokens
    const message = {
      data: { title: "Testing", body: "Test" },
      tokens: registrationTokens,
    };

    return await strapi.pushNotification(message);
  },

  async saveFCMToken(ctx) {
    const token = ctx.request.body.token;

    //check if valid token
    const validateToken = await strapi.validateFCMToken(token);
    if (!validateToken) return ctx.badRequest("Invalid FCM Token");

    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: ctx.state.user.id },
        populate: {
          device_tokens: true,
        },
      });

    //check if token exists on user's devices
    const found = user.device_tokens.find((t) => t.token === token);

    if (!found) {
      //save
      const newToken = await strapi.db
        .query("api::device-token.device-token")
        .create({
          data: {
            token,
            user: user.id,
            description: ctx.request.header["user-agent"],
          },
        });
      return newToken;
    }

    return { message: "Token is saved under user" };
  },

  async deleteFCMToken(ctx) {
    const { id } = ctx.params;

    const status = await strapi.db
      .query("api::device-token.device-token")
      .delete({
        where: {
          $and: [
            {
              id: id,
            },
            {
              user: ctx.state.user.id,
            },
          ],
        },
      });

    return status
      ? { message: "token deleted" }
      : { message: "invalid request" };
  },
};
