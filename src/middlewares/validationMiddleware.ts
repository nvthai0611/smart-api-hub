import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// Thay AnyZodObject bằng ZodSchema để linh hoạt và chính xác hơn
export const validate = (schema: ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        // Dùng error.issues thay vì error.errors để lấy danh sách lỗi chính xác nhất
        details: error.issues.map((e) => ({ 
          path: e.path, 
          message: e.message 
        })),
      });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};