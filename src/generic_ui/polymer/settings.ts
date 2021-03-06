/// <reference path='./context.d.ts' />
/// <reference path='../../../../third_party/polymer/polymer.d.ts' />

var ui = ui_context.ui;
var core = ui_context.core;
var model = ui_context.model;

import _ = require('lodash');
import user_interface = require('../scripts/ui');

Polymer({
  accountChooserOpen: false,
  connectedNetworks: '',
  logOut: function() {
    // logout all networks asynchronously
    for (var i in model.onlineNetworks) {
      ui.logout({
        name: model.onlineNetworks[i].name,
        userId: model.onlineNetworks[i].userId
      }).catch((e :Error) => {
        console.error('logout returned error: ', e);
      });
    }
  },
  restart: function() {
    core.restart();
  },
  openFeedbackForm: function() {
    this.fire('core-signal', {name: 'open-feedback'});
  },
  openAdvancedSettingsForm: function() {
    this.fire('core-signal', {name: 'open-advanced-settings'});
  },
  networksChanged: function() {
    if (!model.onlineNetworks) {
      return;
    }

    if (model.onlineNetworks.length === 1) {
      this.connectedNetworks = ui.i18n_t('connectedWith', {network: model.onlineNetworks[0].name});
    } else {
      this.connectedNetworks = ui.i18n_t('connectedWithNumber', {number: model.onlineNetworks.length});
    }
  },
  toggleAccountChooser: function() {
    this.accountChooserOpen = !this.accountChooserOpen;
  },
  ready: function() {
    this.ui = ui;
    this.model = model;
  },
  observe: {
    'model.onlineNetworks': 'networksChanged'
  }
});
