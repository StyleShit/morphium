# Morphium

Morphium is a framework-agnostic, type-safe, and mutable state management library. It aims to simplify the state mutations
compared to the existing immutable state management libraries like [Redux](https://redux.js.org) & [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction).

It is very similar to the existing [Valtio](https://valtio.pmnd.rs/) library, it uses
[Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) under the hood to
track the state changes and notify the subscribers, and it was basically created for learning purposes.

## Usage

In order to create a mutable state object, use the `morph` function:

```typescript
import { morph } from 'morphium';

const state = morph({
  firstName: 'John',
  lastName: 'Doe',
  age: 42,
  address: {
    city: 'New York',
    country: 'USA',
  },
});
```

Then, you can listen to state changes using the `subscribe` function. It accepts the mutable state instance,
and a subscriber function that will be called whenever the state changes. The subscriber function will receive
the path of the changed property as an array of strings:

```typescript
import { subscribe } from 'morphium';

const unsubscribe = subscribe(state, (path) => {
  console.log('state.' + path.join('.') + ' has changed');
});

state.address.city = 'Los Angeles'; // logs: 'state.address.city has changed'

unsubscribe();
```

For convenience, there is also a type-safe `get` function that lets you read from the morphed object based
on the path you get in the subscriber function:

```typescript
import { subscribe, get } from 'morphium';

subscribe(state, (path) => {
  const pathAsString = path.join('.');
  const value = get(state, path);

  console.log(`state.${pathAsString} has changed to ${value}`);
});
```

## Usage with React

In order to use Morphium with React, use the `useSnapshot` hook. This hook will subscribe only to the properties
that are accessed in the component, and it will re-render the component whenever those properties change:

```tsx
import { morph } from 'morphium';
import { useSnapshot } from 'morphium/react';

const state = morph({
  name: 'counter',
  count: 0,
});

function Counter() {
  const snapshot = useSnapshot(state);

  // Will re-render the `Counter` component.
  return <button onClick={() => state.count++}>{snapshot.count}</button>;
}

function OtherComponent() {
  // Will NOT re-render the `Counter` component.
  return (
    <button onClick={() => (state.name = 'new-counter')}>Change name</button>
  );
}
```
