/**
 * firefox_browser_api.ts
 *
 * Firefox-specific implementation of the Browser API.
 * TODO(salomegeo): Figure out if it's possible to set proxy from content script.
 */

/// <reference path='../../../../../third_party/typings/firefox/firefox.d.ts' />

import browser_api =  require('../../../interfaces/browser_api');
import BrowserAPI = browser_api.BrowserAPI;
import user_interface = require('../../../generic_ui/scripts/ui');
import net = require('../../../../../third_party/uproxy-lib/net/net.types');
import port = require('./port');

interface FullfillAndReject {
  fulfill :Function;
  reject :Function;
}

class FirefoxBrowserApi implements BrowserAPI {

  public browserSpecificElement :string;
  public canProxy = true;

  // Global unique promise ID.
  private promiseId_ :number = 1;
  private mapPromiseIdToFulfillAndReject_ :{[id :number] :FullfillAndReject} =
      {};

  constructor() {
    port.on('emitFulfilled', this.handleEmitFulfilled_);
    port.on('emitRejected', this.handleEmitRejected_);
  }

  public setIcon = (iconFile :string) : void => {
    port.emit('setIcon',
        {
          "18": "./icons/19_" + iconFile,
          "36": "./icons/38_" + iconFile
        });
  }

  public openTab = (url :string) => {
    port.emit('openURL', url);
  }

  public launchTabIfNotOpen = (url :string) => {
    port.emit('launchTabIfNotOpen', url);
  }

  public startUsingProxy = (endpoint:net.Endpoint) => {
    port.emit('startUsingProxy', endpoint);
  }

  public stopUsingProxy = () => {
    port.emit('stopUsingProxy');
  }

  public bringUproxyToFront = () => {
    port.emit('showPanel');
  }

  public showNotification = (text :string, tag :string) => {
    port.emit('showNotification', { text: text, tag: tag });
  }

  public on = (name :string, callback :Function) => {
    port.on(name, callback);
  }

  public frontedPost = (data :any,
                        externalDomain :string,
                        cloudfrontDomain :string,
                        cloudfrontPath = "") : Promise<void> => {
    return this.promiseEmit('frontedPost', {
        data: data,
        externalDomain: externalDomain,
        cloudfrontDomain: cloudfrontDomain,
        cloudfrontPath: cloudfrontPath
      });
  }

  /**
   * Emit a message to the add-on that initiates asynchronous behaviour
   * in the add-on. Return a promise that fulfills/rejects upon the async
   * behaviour completing/failing.
   */
  public promiseEmit = (message :string, data ?:any) : Promise<any> => {
    var promiseId :number = ++(this.promiseId_);
    var payload = {
      data: data,
      promiseId: promiseId
    };
    console.log('Firefox expects promise fulfill/reject after emitting: ' + message,
        JSON.stringify(payload));

    // Create a new promise and store its fulfill and reject functions.
    var fulfillFunc :Function;
    var rejectFunc :Function;
    var promise :Promise<any> = new Promise<any>((F, R) => {
      fulfillFunc = F;
      rejectFunc = R;
    });
    // TODO: we may want to periodically remove garbage from this table,
    // or we we may want to reject promises after some timeout.
    this.mapPromiseIdToFulfillAndReject_[promiseId] = {
      fulfill: fulfillFunc,
      reject: rejectFunc
    };

    // Emit message to add-on environment (specifically to glue.js).
    port.emit(message, payload);
    return promise;
  }

  private handleEmitFulfilled_ = (data :any) => {
    var promiseId = data.promiseId;
    console.log('Firefox promise emit fulfilled ' + promiseId);
    if (this.mapPromiseIdToFulfillAndReject_[promiseId]) {
      this.mapPromiseIdToFulfillAndReject_[promiseId]
          .fulfill(data.argsForCallback);
      delete this.mapPromiseIdToFulfillAndReject_[promiseId];
    } else {
      console.warn('Firefox promise fulfill not found ' + promiseId);
    }
  }

  private handleEmitRejected_ = (data :any) => {
    var promiseId = data.promiseId;
    console.log('Firefox promise emit rejected ' + promiseId);
    if (this.mapPromiseIdToFulfillAndReject_[promiseId]) {
      this.mapPromiseIdToFulfillAndReject_[promiseId]
          .reject(data.errorForCallback);
      delete this.mapPromiseIdToFulfillAndReject_[promiseId];
    } else {
      console.warn('Firefox promise reject not found ' + promiseId);
    }
  }
}

export = FirefoxBrowserApi;
