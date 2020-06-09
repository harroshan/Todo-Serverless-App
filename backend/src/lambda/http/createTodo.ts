import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { parseUserId } from '../../auth/utils';
import { createLogger } from '../../utils/logger';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { createTodo } from "../../BusinessLogic/todos";
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

const logger = createLogger('createTodo');

export const handler= middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body)
  
 const authorization = event.headers.Authorization;
 const split = authorization.split(' ');
 const jwtToken = split[1];
 const userId = parseUserId(jwtToken);

 const newItem = await createTodo(newTodo, userId);

 logger.info(`create Todo for user ${userId} with data ${newTodo}`);

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item :{
        ...newItem,
      }
    }),
};
})

handler.use(
  cors({
    credentials: true
  })
)