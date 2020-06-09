import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from "../models/TodoItem"
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'

const logger = createLogger('CreateTodo')
const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);
const urlExpiration = process.env.SIGNED_URL_EXPIRATION
const s3 = new XAWS.S3({
    signatureVersion: 'v4'
})

export class TodosAccess 
{
  constructor(
      private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
      private readonly todosTable = process.env.TODOS_TABLE,
      private readonly indexName = process.env.TODOS_INDEX_NAME,
      private readonly bucketName = process.env.S3_BUCKET

  ) {}

  async createTodo(todoItem: TodoItem): Promise<TodoItem> 
  {
      
    await this.docClient.put({
          TableName: this.todosTable,
          Item: todoItem
      }).promise();
    
    return todoItem;
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> 
  {
      const result = await this.docClient.query({
          TableName: this.todosTable,
          IndexName: this.indexName,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: 
          {
              ':userId': userId
          }
      }).promise();

      return result.Items as TodoItem[];
  }

  async getTodo(id: string): Promise<TodoItem>
  {
    const result = await this.docClient.query({
        TableName: this.todosTable,
        KeyConditionExpression: 'todoId = :todoId',
        ExpressionAttributeValues:{
            ':todoId': id
        }
    }).promise()

    const item = result.Items[0];
    return item as TodoItem;
}

async deleteTodo(todoId: string): Promise<void> 
{
    this.docClient
        .delete({
            TableName: this.todosTable,
            Key: {
                todoId
            },
        })
        .promise();
}

async updateTodo(todoId:string, updatedTodo:UpdateTodoRequest)
{
    await this.docClient.update({
        TableName: this.todosTable,
        Key:{
            'todoId':todoId
        },
        UpdateExpression: 'set #namefield = :n, dueDate = :d, done = :done',
        ExpressionAttributeValues: 
        {
            ':n' : updatedTodo.name,
            ':d' : updatedTodo.dueDate,
            ':done' : updatedTodo.done
        },    
        ExpressionAttributeNames:
        {
            "#namefield": "name"
        }
      }).promise()
}

public async setAttachmentUrl(
    todoId: string,
    attachmentUrl: string,
): Promise<void> 
{
    this.docClient
        .update({
            TableName: this.todosTable,
            Key: {
                todoId
            },
            UpdateExpression: 'set attachmentUrl = :attachmentUrl',
            ExpressionAttributeValues: {
                ':attachmentUrl': attachmentUrl,
            },
            ReturnValues: 'UPDATED_NEW',
        })
        .promise();
}

async generateUploadUrl(userId: string, todoId: string): Promise<String> {
        const url = getUploadUrl(todoId, this.bucketName)

        const attachmentUrl: string = 'https://' + this.bucketName + '.s3.amazonaws.com/' + todoId

        const options = {
            TableName: this.todosTable,
            Key: {
                userId: userId,
                todoId: todoId
            },
            UpdateExpression: "set attachmentUrl = :r",
            ExpressionAttributeValues: {
                ":r": attachmentUrl
            },
            ReturnValues: "UPDATED_NEW"
        };

        await this.docClient.update(options).promise()
        logger.info("Presigned url generated : ", url)

        return url;
    }
}

function getUploadUrl(todoId: string, bucketName: string): string {
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: todoId,
        Expires: parseInt(urlExpiration)
    })
}
