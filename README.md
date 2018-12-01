# Fetcher
A React component that provides data fetching behaviour.

## Basic usage

```javascript
import React from 'react';
import Fetcher from './Fetcher';

const URL = "https://myservice.com/api";

function MyComponent() {
  return (
    <Fetcher 
      url={URL}
      render={({ data }) => <div>{data}</div>}
    />
  );
}
```

By sharing its internal state with you component, Fetcher allows you to simply specify the URL and just get the required data. It also:
1. Prevents your component from rendering if requested data is not yet ready.
2. Automatically parses a JSON response.
3. Allows to pass it an array of URLs, in which case the data returned to your component is an array of values.
4. Automatically retries fetching if an error occurs. Default number of retries is 3 (5 - 15 - 45 seconds).
5. Renders a text error message if an error occurs.
6. Renders a "NO DATA" message if requested data is null.

It also allows you to use data fetching behavious in simple functional components without need to use classes.

## Features
Fetcher allows you to optionally specify other information as props:
1. Options object that conforms to the Fetch API.
2. Number of requests per hour.
Example usage:
```javascript
function MyComponent() {
  return (
    <Fetcher 
      url={URL}
      options={{ method: 'GET' }}
      requestsPerHour={5}
      render={({ data }) => <div>{data}</div>}
    />
  );
}
```
