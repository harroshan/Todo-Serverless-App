import * as uuid from 'uuid'
import { TodoItem } from '../models/TodoItem'
import { TodosAccess } from '../dataLayer/todosAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger';

const logger = createLogger('Todos');
const todoAccess = new TodosAccess()

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
  return todoAccess.getAllTodos(userId)
}

export async function createTodo(createTodoRequest: CreateTodoRequest, userId: string): Promise<TodoItem> {
  const itemId = uuid.v4()

  logger.info(`create Todo for ItemId ${itemId}`);

  return await todoAccess.createTodo({
        todoId: itemId,
        userId: userId,
        name: createTodoRequest.name,
        dueDate: createTodoRequest.dueDate,
        createdAt: new Date().toISOString(),
        done: false,
  })
}

export async function deleteTodo(todoId: string): Promise<void> {
  const todo = await todoAccess.getTodo(todoId);

  todoAccess.deleteTodo(todo.todoId);
}

export async function updateTodo(todoId: string,updateTodoRequest: UpdateTodoRequest): Promise<void> {
  const todo = await todoAccess.getTodo(todoId);

  todoAccess.updateTodo(todo.todoId, updateTodoRequest);
}

export async function generateUploadUrl(userId: string, todoId: string): Promise <String> {
  return todoAccess.generateUploadUrl(userId, todoId)
}


export async function setAttachmentUrl(todoId: string, attachmentUrl: string): Promise<void> {
  const todo = await todoAccess.getTodo(todoId);

  todoAccess.setAttachmentUrl(todo.todoId, attachmentUrl);
}