import { Request, Response, NextFunction } from 'express';
import db from '../config/database';
import fs from 'fs';
import path from 'path';
import * as cacheService from '../services/cacheService';
import { logAudit } from '../services/auditService';

// Đọc schema và ép kiểu để TypeScript không báo lỗi khi truy cập schema[resource]
const schemaPath = path.join(__dirname, '../../schema.json');
const schema: Record<string, any> = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const allowedTables = Object.keys(schema);

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  // 1. Ép kiểu resource chắc chắn là string
  const resource = req.params.resource as string;

  if (!allowedTables.includes(resource)) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  const cacheKey = `${resource}:${JSON.stringify(req.query)}`;
  const cachedData = cacheService.getCache(cacheKey);
  if (cachedData) return res.json(cachedData);

  const { _fields, _page, _limit, _sort, _order, _expand, _embed, q, ...filters } = req.query;
  
  // 2. Khởi tạo query với tên bảng đã được xác thực
  let query = db(resource);

  // Search
  if (q && typeof q === 'string') {
    const columns = Object.keys(schema[resource].columns);
    query = query.where((builder) => {
      columns.forEach((col) => {
        builder.orWhere(col, 'ilike', `%${q}%`);
      });
    });
  }

  // Filters
  for (const [key, value] of Object.entries(filters)) {
    const val = value as string;
    if (key.endsWith('_gte')) query = query.where(key.replace('_gte', ''), '>=', val);
    else if (key.endsWith('_lte')) query = query.where(key.replace('_lte', ''), '<=', val);
    else if (key.endsWith('_ne')) query = query.where(key.replace('_ne', ''), '!=', val);
    else if (key.endsWith('_like')) query = query.where(key.replace('_like', ''), 'ilike', `%${val}%`);
    else query = query.where(key, val);
  }

  // Fields selection
  if (_fields && typeof _fields === 'string') {
    const fields = _fields.split(',');
    query = query.select(fields);
  }

  // Sorting
  if (_sort && typeof _sort === 'string') {
    query = query.orderBy(_sort, (_order as string) || 'asc');
  }

  // Pagination
  // Lấy tổng số record (Ép kiểu resource để dùng trong query mới)
  const totalCountResult = await db(resource).count('id as count').first();
  const count = totalCountResult ? Number(totalCountResult.count) : 0;
  res.setHeader('X-Total-Count', count);

  if (_page && _limit) {
    const page = parseInt(_page as string);
    const limit = parseInt(_limit as string);
    query = query.limit(limit).offset((page - 1) * limit);
  }

  let data = await query;

  // Expand
  if (_expand && typeof _expand === 'string') {
    const parentTable = _expand;
    const parentField = `${parentTable.slice(0, -1)}_id`;
    const parentIds = [...new Set(data.map((item: any) => item[parentField]).filter(Boolean))];
    const parents = await db(parentTable).whereIn('id', parentIds as any[]);
    
    data = data.map((item: any) => ({
      ...item,
      [parentTable.slice(0, -1)]: parents.find((p: any) => p.id === item[parentField])
    }));
  }

  // Embed
  if (_embed && typeof _embed === 'string') {
    const childTable = _embed;
    const foreignKey = `${resource.slice(0, -1)}_id`;
    const ids = data.map((item: any) => item.id);
    const children = await db(childTable).whereIn(foreignKey, ids as any[]);
    
    data = data.map((item: any) => ({
      ...item,
      [childTable]: children.filter((c: any) => c[foreignKey] === item.id)
    }));
  }

  cacheService.setCache(cacheKey, data);
  res.json(data);
};

export const getOne = async (req: Request, res: Response) => {
  const resource = req.params.resource as string;
  const id = req.params.id as string;
  
  if (!allowedTables.includes(resource)) return res.status(404).json({ error: 'Resource not found' });
  
  const data = await db(resource).where({ id }).first();
  if (!data) return res.status(404).json({ error: 'Record not found' });
  res.json(data);
};

export const create = async (req: Request, res: Response) => {
  const resource = req.params.resource as string;
  if (!allowedTables.includes(resource)) return res.status(404).json({ error: 'Resource not found' });
  
  const [idResult] = await db(resource).insert(req.body).returning('id');
  const actualId = typeof idResult === 'object' ? idResult.id : idResult;
  const newData = await db(resource).where({ id: actualId }).first();

  cacheService.invalidateCache(resource);
  logAudit((req as any).user?.id || null, 'CREATE', resource, actualId);

  res.status(201).json(newData);
};

export const update = async (req: Request, res: Response) => {
  const resource = req.params.resource as string;
  const id = req.params.id as string;
  
  if (!allowedTables.includes(resource)) return res.status(404).json({ error: 'Resource not found' });
  
  const updateData = { ...req.body, updated_at: db.fn.now() };
  const updated = await db(resource).where({ id }).update(updateData);
  
  if (!updated) return res.status(404).json({ error: 'Record not found' });
  const data = await db(resource).where({ id }).first();

  cacheService.invalidateCache(resource);
  logAudit((req as any).user?.id || null, 'UPDATE', resource, id);

  res.json(data);
};

export const patch = async (req: Request, res: Response) => {
  const resource = req.params.resource as string;
  const id = req.params.id as string;

  if (!allowedTables.includes(resource)) return res.status(404).json({ error: 'Resource not found' });
  
  const updateData = { ...req.body, updated_at: db.fn.now() };
  const updated = await db(resource).where({ id }).update(updateData);
  
  if (!updated) return res.status(404).json({ error: 'Record not found' });
  const data = await db(resource).where({ id }).first();

  cacheService.invalidateCache(resource);
  logAudit((req as any).user?.id || null, 'PATCH', resource, id);

  res.json(data);
};

export const remove = async (req: Request, res: Response) => {
  const resource = req.params.resource as string;
  const id = req.params.id as string;

  if (!allowedTables.includes(resource)) return res.status(404).json({ error: 'Resource not found' });
  
  const deleted = await db(resource).where({ id }).del();
  if (!deleted) return res.status(404).json({ error: 'Record not found' });

  cacheService.invalidateCache(resource);
  logAudit((req as any).user?.id || null, 'DELETE', resource, id);

  res.status(204).send();
};