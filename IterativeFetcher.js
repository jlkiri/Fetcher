import React, { Component } from 'react';
import * as R from "ramda";
import { map } from './streamHelpers';

class IterativeFetcher extends Component {

  constructor(props) {
    super(props);
    this.state = {
      data: null,
      delay: 0,
      isLoading: true,
      continue: true,
      error: null,
    };
  }

  async * generateResponses(options, iterable) {
    while(this.state.continue) {
      const next = iterable.next().value;
      const response = await fetchWithRetry(next, options);
      const data = await parseResponse(response);
      yield data;      
    }
    return null;
  }

  async requestData() {
    const { delay } = this.state;
    const { url, options, parseFn, customIterable } = this.props;
    const parseData = parseFn ? parseFn : identity;
    const iterable = customIterable ? customIterable : infiniteArrayIterable(url);
    const responseIterable = this.generateResponses(options, iterable);
    const responseStream = R.pipe(
      map(parseData),
      delayStreamBy(delay)
    )(responseIterable);
    for await (const data of responseStream) {
      this.setState({ data, isLoading: false });
    }
  }

  stopRequests() {
    this.setState({ continue: false });
  }

  resumeRequests() {
    this.setState({ continue: true }, this.requestData);
  }

  componentDidMount() {
    if (this.props.delay) {
      this.setState({ delay: this.props.delay }, this.requestData);
    }
    else this.requestData();
  }

  render() {
    const { isLoading, error, data } = this.state;
    if (isLoading) {
      return <div>LOADING...</div>;
    }
    if (error) {
      return <div>{error}</div>;
    }
    if (!data) {
      return <div>NO DATA!</div>;
    }
    return this.props.render({
      data,
      stopRequests: this.stopRequests.bind(this),
      resumeRequests: this.resumeRequests.bind(this)
    });
  }
}

function identity(v) {
  return v;
}

function* infiniteArrayIterable(arr) {
  let index = 0;
  while (index <= arr.length - 1) {
    yield arr[index];
    index = (index >= arr.length - 1) ? 0 : index += 1;
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return await response.json();
  }
  return await response.text();
}

function fetchWithRetry (url, options = undefined, timeout = 5000, retryCount = 3) {
  return fetch(url, options).catch(function handleResponse(error) {
    if (retryCount === 0) throw error;
    return delay(timeout).then(again => {
      return fetchWithRetry(url, options, timeout * 3, retryCount - 1);
    });
  });
};

function delay(sec) {
  return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

function delayStreamBy(seconds) {
  return map(async item => await delay(seconds) || item);
}

export default IterativeFetcher;