# Serverless backend for IoT project

This project contains source code and supporting files for a serverless application that you can deploy with the serverless framework. It includes the following files and folders:

- `resources` - AWS Infrastructure yaml files.
- `src` - Code for the application's Lambda function.
- `__tests__` - Unit tests for the application code. 
- `serverless.yml` - A template that defines the serverless project resources.

Resources for this project are defined in the `serverless.yml` file in this project. You can update the template to add AWS resources through the same deployment process that updates your application code.


## Development

### Running Locally

Install dependencies with:

```
npm install
```

Run backend server with:

```
npm start
```

This runs the serverless function locally using `serverless-offline` plugin.

### Running Tests
```
npm test
```


## Deployment

```
serverless deploy
```
