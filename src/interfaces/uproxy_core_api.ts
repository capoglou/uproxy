/// <reference path='../../../third_party/freedom-typings/rtcpeerconnection.d.ts' />

import loggingTypes = require('../../../third_party/uproxy-lib/loggingprovider/loggingprovider.types');
import net = require('../../../third_party/uproxy-lib/net/net.types');
import social = require('./social');
import ui = require('./ui');

// --- Core <--> UI Interfaces ---

export interface UserFeedback {
  email     :string;
  feedback  :string;
  logs      :boolean;
  browserInfo :string;
}

// Object containing description so it can be saved to storage.
export interface GlobalSettings {
  version          :number;
  description      :string;
  stunServers      :freedom_RTCPeerConnection.RTCIceServer[];
  hasSeenSharingEnabledScreen :boolean;
  hasSeenWelcome   :boolean;
  allowNonUnicast  :boolean;
  mode             :ui.Mode;
  statsReportingEnabled :boolean;
  consoleFilter    :loggingTypes.Level;
  language         :string;
}

export interface InitialState {
  networkNames :string[];
  globalSettings :GlobalSettings;
  onlineNetworks: social.NetworkState[];
}

export interface ConnectionState {
  localGettingFromRemote :social.GettingState;
  localSharingWithRemote :social.SharingState;
  bytesSent :number;
  bytesReceived :number;
}

// --- Communications ---

// Commands are sent from the UI to the Core due to a user interaction.
// This fully describes the set of commands that Core must respond to.
//
// Enum value names should be verb phrases that clearly describe the action
// being requested.
//
// TODO: Finalize which of these can be removed, then clean up accordingly.
export enum Command {
  GET_INITIAL_STATE_DEPRECATED_0_8_10 = 1000,
  RESTART = 1001,
  LOGIN = 1002,
  LOGOUT = 1003,
  SEND_INSTANCE_HANDSHAKE_MESSAGE = 1004,
  START_PROXYING = 1005,
  STOP_PROXYING = 1006,
  MODIFY_CONSENT = 1007, // TODO: make this work with the consent piece.
  START_PROXYING_COPYPASTE_GET = 1008,
  STOP_PROXYING_COPYPASTE_GET = 1009,
  START_PROXYING_COPYPASTE_SHARE = 1010,
  STOP_PROXYING_COPYPASTE_SHARE = 1011,
  COPYPASTE_SIGNALLING_MESSAGE = 1012,

  // Payload should be a HandleManualNetworkInboundMessageCommand.
  HANDLE_MANUAL_NETWORK_INBOUND_MESSAGE = 1013,
  SEND_CREDENTIALS = 1014,
  UPDATE_GLOBAL_SETTINGS = 1015,
  GET_LOGS = 1016,
  GET_NAT_TYPE = 1017,
  PING_UNTIL_ONLINE = 1018,
  GET_FULL_STATE = 1019
}

// Updates are sent from the Core to the UI, to update state that the UI must
// expose to the user.
export enum Update {
  INITIAL_STATE_DEPRECATED_0_8_10 = 2000,
  NETWORK = 2001,      // One particular network.
  USER_SELF = 2002,    // Local / myself on the network.
  USER_FRIEND = 2003,  // Remote friend on the roster.
  COMMAND_FULFILLED = 2005,
  COMMAND_REJECTED = 2006,
  START_GETTING_FROM_FRIEND = 2007,
  STOP_GETTING_FROM_FRIEND = 2008,
  START_GIVING_TO_FRIEND = 2009,
  STOP_GIVING_TO_FRIEND = 2010,
  // Payload should be a Message.
  MANUAL_NETWORK_OUTBOUND_MESSAGE = 2011,
  // TODO: "Get credentials" is a command, not an "update". Consider
  // renaming the "Update" enum.
  GET_CREDENTIALS = 2012,
  LAUNCH_UPROXY = 2013,

  SIGNALLING_MESSAGE = 2014, /* copypaste messages */
  START_GETTING = 2015,
  STOP_GETTING = 2016,
  START_GIVING = 2017,
  STOP_GIVING = 2018,
  STATE = 2019,
  FRIEND_FAILED_TO_GET = 2020,
  POST_TO_CLOUDFRONT = 2021
}

// Action taken by the user. These values are not on the wire. They are passed
// in messages from the UI to the core. They correspond to the different
// buttons that the user may be clicking on.
export enum ConsentUserAction {
  // Actions made by user w.r.t. remote as a proxy
  REQUEST = 5000, CANCEL_REQUEST, IGNORE_OFFER, UNIGNORE_OFFER,
  // Actions made by user w.r.t. remote as a client
  OFFER = 5100, CANCEL_OFFER, IGNORE_REQUEST, UNIGNORE_REQUEST,
}

/**
 * ConsentCommands are sent from the UI to the Core, to modify the consent of
 * a :RemoteInstance in the local client. (This is not sent on the wire to
 * the peer). This should only be passed along with a `Command.MODIFY_CONSENT`
 * command.
 */
export interface ConsentCommand {
  path    :social.UserPath;
  action  :ConsentUserAction;
}

export interface CloudfrontPostData {
  payload        :Object;
  cloudfrontPath :string;
}

export interface LoginArgs {
  network :string;
  reconnect :boolean;
}

/**
 * The primary interface to the uProxy Core.
 *
 * This will be enforced for both the actual core implementation, as well as
 * abstraction layers such as the Chrome Extension, so that all components
 * which speak to the core benefit from this consistency.
 */
// TODO: Rename CoreApi.
export interface CoreApi {
  // Send your own instanceId to target clientId.

  getFullState() :Promise<InitialState>;

  modifyConsent(command :ConsentCommand) :void;

  getLogs() :Promise<string>;

  // CopyPaste interactions

  /*
   * The promise fulfills with an endpoint that can be used to proxy through
   * if sucessfully started or rejects otherwise
   */
  startCopyPasteGet() :Promise<net.Endpoint>;

  /*
   * The promise fulfills when the connection is fully closed and state has
   * been cleaned up
   */
  stopCopyPasteGet() :Promise<void>;

  startCopyPasteShare() :void;

  /*
   * The promise fulfills when the connection is fully closed and state has
   * been cleaned up
   */
  stopCopyPasteShare() :Promise<void>;

  sendCopyPasteSignal(signal :social.PeerMessage) :void;

  // Using peer as a proxy.
  start(instancePath :social.InstancePath) : Promise<net.Endpoint>;
  stop () : void;

  updateGlobalSettings(newSettings :GlobalSettings) :void;
  // TODO: rename toggle-option and/or replace with real configuration system.
  // TODO: Implement this or remove it.
  // changeOption(option :string) : void;

  login(loginArgs :LoginArgs) : Promise<void>;
  logout(networkInfo :social.SocialNetworkInfo) : Promise<void>;

  // TODO: use Event instead of attaching manual handler. This allows event
  // removal, etc.
  onUpdate(update :Update, handler :Function) :void;

  pingUntilOnline(pingUrl :string) : Promise<void>;
}

