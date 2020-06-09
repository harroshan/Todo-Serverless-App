import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { parseUserId } from '../../auth/utils';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { createLogger } from '../../utils/logger';
import { deleteTodo } from "../../BusinessLogic/todos";

const logger = createLogger('deleteTodo');

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => 
{
    const todoId = event.pathParameters.todoId

    const authorization = event.headers.Authorization;
    const split = authorization.split(' ');
    const jwtToken = split[1];
    const userId = parseUserId(jwtToken);
  
     logger.info(`User ${userId} deletes ${todoId}`)
     
     await deleteTodo(todoId);
  
    return {
      statusCode: 204,
      headers :{
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
      },
     body: '',
};
})

handler.use(
    cors({
      credentials: true
    })
  )