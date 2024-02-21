'use strict';

import { baseConfig } from '../constants/constants.js';

class ApiGateway {
  baseUrl = baseConfig.endpoints.gateway;
  headers = {
    'Content-Type': 'application/json',
  };

  constructor(endpoint?: string) {
    if (endpoint) this.baseUrl = endpoint;
  }

  get(endpoint: string, params: Record<string, string> = {}) {
    const paramString = new URLSearchParams({
      ...params,
    }).toString();

    return fetch(`${this.baseUrl}/${endpoint}?${paramString}`)
      .then((response) => response.json())
      .then((data) => {
        return data;
      });
  }

  post(endpoint: string, body: string) {
    return fetch(`${this.baseUrl}/${endpoint}`, { method: 'POST', body })
      .then((response) => response.json())
      .then((data) => {
        return data;
      });
  }
}

export default ApiGateway;
