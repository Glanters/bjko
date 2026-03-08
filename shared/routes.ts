import { z } from 'zod';
import { insertStaffSchema, staff, leaves, users } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  unauthorized: z.object({ message: z.string() }),
  forbidden: z.object({ message: z.string() }),
  notFound: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.object({ user: z.custom<typeof users.$inferSelect>() }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() })
      }
    }
  },
  staff: {
    list: {
      method: 'GET' as const,
      path: '/api/staff' as const,
      responses: {
        200: z.array(z.custom<typeof staff.$inferSelect>())
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/staff' as const,
      input: insertStaffSchema,
      responses: {
        201: z.custom<typeof staff.$inferSelect>(),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    }
  },
  leaves: {
    list: {
      method: 'GET' as const,
      path: '/api/leaves' as const,
      responses: {
        200: z.array(z.custom<typeof leaves.$inferSelect>())
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/leaves' as const,
      input: z.object({ staffId: z.number() }),
      responses: {
        201: z.custom<typeof leaves.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    }
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    },
    updateIp: {
      method: 'PATCH' as const,
      path: '/api/users/:id/ip' as const,
      input: z.object({ allowedIp: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
