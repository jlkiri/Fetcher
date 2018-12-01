import React, { Component } from 'react';

class Fetcher extends Component {

  constructor(props) {
    super(props);
    this.state = {
      data: null,
      isLoading: true,
      error: null,
    };
  }

  async requestData(options, ...args) {
    const URLToPromise = unary(partial(fetchWithRetry, options));
    const URLArray = args.flat();
    const numberOfURLs = URLArray.length;
    const requests = URLArray.map(URLToPromise);
    try {
      const responses = await Promise.all(requests);
      const values = await Promise.all(responses.map(parseResponse));
      this.setState({
        data: numberOfURLs > 1 ? values : values[0],
        isLoading: false,
        error: null
      });
    } catch(error) {
      this.setState({ error: error, isLoading: false });
    }
  }

  componentDidMount() {
    if (this.props.requestsPerHour) {
      const frequency = 1000 * 3600 / this.props.requestsPerHour;
      this.repeater = setInterval(() => {
        this.requestData(this.props.options, this.props.url)
      }, frequency);
    }
    this.requestData(this.props.options, this.props.url);
  }

  componentWillUnmount() {
    clearInterval(this.repeater);
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
    return this.props.render(this.state);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function partial(fn, ...args) {
  return function _partial(...nextArgs) {
    return fn(...nextArgs, ...args);
  }
}

function unary(fn) {
  return function _unary(arg) {
    return fn(arg);
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return await response.json();
  }
  return await response.text();
}

function fetchWithRetry (url, options, timeout = 5000, retryCount = 3) {
  return fetch(url, options).catch(function handleResponse(error) {
    if (retryCount === 0) throw error;
    return delay(timeout).then(again => {
      return fetchWithRetry(url, options, timeout * 3, retryCount - 1);
    });
  });
};

export default Fetcher;