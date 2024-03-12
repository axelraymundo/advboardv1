import type { Schema, Attribute } from '@strapi/strapi';

export interface OtherExtraPlayers extends Schema.Component {
  collectionName: 'components_other_extra_players';
  info: {
    displayName: 'extra_players';
    icon: 'user';
  };
  attributes: {
    name: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'other.extra-players': OtherExtraPlayers;
    }
  }
}
