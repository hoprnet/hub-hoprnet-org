## Available Scripts

In the project directory, you can run:

### `yarn`

Install all the dependencies.

### `yarn dev`

Runs the app in the development mode.\
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn build-hub`

Builds the Staking Hub.
Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.


### Safe infrastructre endpoints used:
- `/api/v1/owners/<OWNER>/safes/` GET
- `/api/v1/safes/<SAFE>/` GET
- `/api/v1/safes/<SAFE>/all-transactions/` GET
- `/api/v1/safes/<SAFE>/multisig-transactions/`  GET
- `/api/v1/delegates/?safe=<SAFE>`  GET
-

