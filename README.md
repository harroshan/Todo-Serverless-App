# Serverless TODO

[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)
This project is part of the Cloud Developer Nanodegree. The goal is to implement a simple TODO application using AWS Lambda and Serverless framework.

# TODO items
The application store TODO items, and each TODO item contains the following fields:

 - todoId (string) - a unique id for an item
 - userId (string) - the user id that created this todo item
 - createdAt (string) - date and time when an item was created
 - name (string) - name of a TODO item (e.g. "Change a light bulb")
 - dueDate (string) - date and time by which an item should be completed
 - done (boolean) - true if an item was completed, false otherwise
 - attachmentUrl (string) (optional) - a URL pointing to an image attached to a TODO item

# How to run the application
# Prerequisite
1. Install serverless npm install -g serverless
2. Set up a new user in IAM named "serverless" with Programmatic access and with AdministratorAccess policy attached and save the access key and secret key.
3. Configure serverless to use the AWS credentials you just set up: sls config credentials --provider aws --key YOUR_ACCESS_KEY --secret YOUR_SECRET_KEY --profile serverless

# Backend
> To deploy this application, use the following commands: sls deploy -v

# Frontend
To have the application running on your local machine, run the following commands:

> cd client
> npm install
> npm run start
