import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import dotenv from 'dotenv';
dotenv.config();
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Smart API Hub',
    version: '1.0.0',
    description: 'A dynamic REST API Platform built with Node.js and TypeScript',
  },
  servers: [
    {
      url: process.env.SWAGGER_SERVER_URL || 'http://103.245.237.237:3000',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Check system health',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                  full_name: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login and get JWT token',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/{resource}': {
      get: {
        summary: 'Get all items of a resource',
        parameters: [
          { name: 'resource', in: 'path', required: true, schema: { type: 'string' } },
          { name: '_fields', in: 'query', schema: { type: 'string' } },
          { name: '_page', in: 'query', schema: { type: 'integer' } },
          { name: '_limit', in: 'query', schema: { type: 'integer' } },
          { name: '_sort', in: 'query', schema: { type: 'string' } },
          { name: '_order', in: 'query', schema: { type: 'string' } },
          { name: '_expand', in: 'query', schema: { type: 'string' } },
          { name: '_embed', in: 'query', schema: { type: 'string' } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'OK' } },
      },
      post: {
        summary: 'Create a new item',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'resource', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/{resource}/{id}': {
      get: {
        summary: 'Get a specific item by ID',
        parameters: [
          { name: 'resource', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'OK' }, '404': { description: 'Not Found' } },
      },
      put: {
        summary: 'Fully update an item by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'resource', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'OK' }, '404': { description: 'Not Found' } },
      },
      patch: {
        summary: 'Partially update an item by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'resource', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'OK' }, '404': { description: 'Not Found' } },
      },
      delete: {
        summary: 'Delete an item by ID (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'resource', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '204': { description: 'No Content' }, '403': { description: 'Forbidden' } },
      },
    },
  },
};

export const setupSwagger = (app: Express) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
