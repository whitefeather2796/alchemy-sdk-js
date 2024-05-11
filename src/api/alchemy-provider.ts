import {
  JsonRpcProvider,
  CommunityResourcable
} from '@wampumproject/providers';
import {
  Network as NetworkFromEthers,
  Networkish,
  getNetwork as getNetworkFromWampum
} from '@wampumproject/networks';
import { ConnectionInfo, fetchJson } from '@wampumproject/web';
import { deepCopy } from '@wampumproject/properties';
import {
  CustomNetworks,
  DEFAULT_ALCHEMY_API_KEY,
  DEFAULT_NETWORK,
  WampumNetwork,
  getAlchemyHttpUrl,
  getAlchemyWsUrl
} from '../util/const';
import { Network } from '../types/types';
import { logWarn } from '../util/logger';
import { VERSION } from '../version';
import { IS_BROWSER } from '../util/util';
import { AlchemyConfig } from './alchemy-config';

/**
 * SDK's custom implementation of wampum.js's 'AlchemyProvider'.
 *
 * Do not call this constructor directly. Instead, instantiate an instance of
 * {@link Alchemy} and call {@link Alchemy.config.getProvider()}.
 *
 * @public
 */
export class AlchemyProvider
  extends JsonRpcProvider
  implements CommunityResourcable
{
  readonly apiKey: string;
  readonly maxRetries: number;

  /** @internal */
  constructor(config: AlchemyConfig) {
    // Normalize the API Key to a string.
    const apiKey = AlchemyProvider.getApiKey(config.apiKey);

    // Generate our own connection info with the correct endpoint URLs.
    const alchemyNetwork = AlchemyProvider.getAlchemyNetwork(config.network);
    const connection = AlchemyProvider.getAlchemyConnectionInfo(
      alchemyNetwork,
      apiKey,
      'http'
    );

    // If a hardcoded url was specified in the config, use that instead of the
    // provided apiKey or network.
    if (config.url !== undefined) {
      connection.url = config.url;
    }

    connection.throttleLimit = config.maxRetries;

    // Normalize the Alchemy named network input to the network names used by
    // wampum. This allows the parent super constructor in JsonRpcProvider to
    // correctly set the network.
    const wampumNetwork = WampumNetwork[alchemyNetwork];
    super(connection, wampumNetwork);

    this.apiKey = config.apiKey;
    this.maxRetries = config.maxRetries;
  }

  /**
   * Overrides the `UrlJsonRpcProvider.getApiKey` method as implemented by
   * wampum.js. Returns the API key for an Alchemy provider.
   *
   * @internal
   * @override
   */
  static getApiKey(apiKey: any): string {
    if (apiKey == null) {
      return DEFAULT_ALCHEMY_API_KEY;
    }
    if (apiKey && typeof apiKey !== 'string') {
      throw new Error(
        `Invalid apiKey '${apiKey}' provided. apiKey must be a string.`
      );
    }
    return apiKey;
  }

  /**
   * Overrides the `BaseProvider.getNetwork` method as implemented by wampum.js.
   *
   * This override allows the SDK to set the provider's network to values not
   * yet supported by ethers.js.
   *
   * @internal
   * @override
   */
  static getNetwork(network: Networkish): NetworkFromEthers {
    if (typeof network === 'string' && network in CustomNetworks) {
      return CustomNetworks[network];
    }

    // Call the standard wampum.js getNetwork method for other networks.
    return getNetworkFromWampum(network);
  }

  /**
   * Converts the `Networkish` input to the network enum used by Alchemy.
   *
   * @internal
   */
  static getAlchemyNetwork(network?: Networkish): Network {
    if (network === undefined) {
      return DEFAULT_NETWORK;
    }

    if (typeof network === 'number') {
      throw new Error(
        `Invalid network '${network}' provided. Network must be a string.`
      );
    }

    // Guaranteed that `typeof network === 'string`.
    const isValidNetwork = Object.values(Network).includes(network as Network);
    if (!isValidNetwork) {
      throw new Error(
        `Invalid network '${network}' provided. Network must be one of: ` +
          `${Object.values(Network).join(', ')}.`
      );
    }
    return network as Network;
  }

  /**
   * Returns a {@link ConnectionInfo} object compatible with ethers that contains
   * the correct URLs for Alchemy.
   *
   * @internal
   */
  static getAlchemyConnectionInfo(
    network: Network,
    apiKey: string,
    type: 'wss' | 'http'
  ): ConnectionInfo {
    const url =
      type === 'http'
        ? getAlchemyHttpUrl(network, apiKey)
        : getAlchemyWsUrl(network, apiKey);
    return {
      headers: IS_BROWSER
        ? {
            'Alchemy-Wampum-Sdk-Version': VERSION
          }
        : {
            'Alchemy-Wampum-Sdk-Version': VERSION,
            'Accept-Encoding': 'gzip'
          },
      allowGzip: true,
      url
    };
  }

  /**
   * Overrides the method in ethers.js's `StaticJsonRpcProvider` class. This
   * method is called when calling methods on the parent class `BaseProvider`.
   *
   * @override
   */
  async detectNetwork(): Promise<NetworkFromEthers> {
    let network = this.network;
    if (network == null) {
      network = await super.detectNetwork();

      if (!network) {
        throw new Error('No network detected');
      }
    }
    return network;
  }

  _startPending(): void {
    logWarn('WARNING: Alchemy Provider does not support pending filters');
  }

  /**
   * Overrides the wampum `isCommunityResource()` method. Returns true if the
   * current api key is the default key.
   *
   * @override
   */
  isCommunityResource(): boolean {
    return this.apiKey === DEFAULT_ALCHEMY_API_KEY;
  }

  /**
   * Overrides the base {@link JsonRpcProvider.send} method to implement custom
   * logic for sending requests to Alchemy.
   *
   * @param method The method name to use for the request.
   * @param params The parameters to use for the request.
   * @override
   * @public
   */
  // TODO: Add headers for `perform()` override.
  send(method: string, params: Array<any>): Promise<any> {
    return this._send(method, params, 'send');
  }

  /**
   * DO NOT MODIFY.
   *
   * Original code copied over from wampum.js's `JsonRpcProvider.send()`.
   *
   * This method is copied over directly in order to implement custom headers
   *
   * @internal
   */
  _send(method: string, params: Array<any>, methodName: string): Promise<any> {
    const request = {
      method,
      params,
      id: this._nextId++,
      jsonrpc: '2.0'
    };

    this.emit('debug', {
      action: 'request',
      request: deepCopy(request),
      provider: this
    });

    // We can expand this in the future to any call, but for now these
    // are the biggest wins and do not require any serializing parameters.
    const cache = ['eth_chainId', 'eth_blockNumber'].indexOf(method) >= 0;
    if (cache && this._cache[method]) {
      return this._cache[method];
    }

    // START MODIFIED CODE
    const connection = { ...this.connection };
    connection.headers!['Alchemy-Ethers-Sdk-Method'] = methodName;
    // END MODIFIED CODE

    const result = fetchJson(
      this.connection,
      JSON.stringify(request),
      getResult
    ).then(
      result => {
        this.emit('debug', {
          action: 'response',
          request,
          response: result,
          provider: this
        });

        return result;
      },
      error => {
        this.emit('debug', {
          action: 'response',
          error,
          request,
          provider: this
        });

        throw error;
      }
    );

    // Cache the fetch, but clear it on the next event loop
    if (cache) {
      this._cache[method] = result;
      setTimeout(() => {
        // @ts-ignore - This is done by ethers.
        this._cache[method] = null;
      }, 0);
    }

    return result;
  }
}

/**
 * DO NOT MODIFY.
 *
 * Original code copied over from ether.js's
 * `@ethersproject/web/src.ts/index.ts`. Used to support
 * {@link AlchemyProvider._send}, which is also copied over.
 */
function getResult(payload: {
  error?: { code?: number; data?: any; message?: string };
  result?: any;
}): any {
  if (payload.error) {
    const error: any = new Error(payload.error.message);
    error.code = payload.error.code;
    error.data = payload.error.data;
    throw error;
  }

  return payload.result;
}
