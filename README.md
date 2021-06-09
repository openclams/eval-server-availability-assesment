# eval-server-availability-assesment
Recommend services with min cost for a given availability constraint

# Setup 

First, you need to compile the project. 

```
npm install
tsc
```

## Run the Azure Tests
You need to install and start the component registry server 
https://github.com/openclams/component-registry-server

You also need to load the Azure Clams components to the component registry server to run the tests.
https://github.com/openclams/azure-example-data
Afterward, you can run the tests cases:

```
node dist/index.js
```

## Run the Web Server

To use this application in combination with the [web app](https://github.com/openclams/web-app), you can run:

```
node dist/index.js web
```

