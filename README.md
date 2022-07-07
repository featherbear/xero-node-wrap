# xero-node auth wrapper


Wrapper for Custom Connection / M2M requests that will automatically renew the `access_token` (30min expiry) if a refresh is required.  
Simultaneous requests that all require a new `access_token` will all await the same refresh request

# Usage

## With `XeroWrapper`

```ts
import { XeroWrapper } from 'xero-node-wrap'

const Xero = new XeroWrapper({
    clientId: '...',
    clientSecret: '...',
    loggerFunction(msg, level?: number) { ... }
})

/* OR 
// Init later, second parameter MUST be true-like
const Xero = new XeroWrapper(null, true);
Xero.init({
    clientId: '...',
    clientSecret: '...',
    loggerFunction(msg, level?: number) { ... }
})
*/

// /---- Returns the handler result as a Promise
await Xero.withXero((xero) => {
    // `xero` is the standard xero-node client object
    xero.doSomething()
    let someValue = ...
    xero.doSomethingElse()
    return someValue
})

```

## With `XeroClient` singleton

```ts
import withXero, { XeroClient } from 'xero-node-wrap'

XeroClient.init(...) // See above example

withXero((xero) => {...}) // See above example
// or
XeroClient.withXero((xero) => {...}) // See above example
```
