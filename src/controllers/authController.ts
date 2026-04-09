import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import { logAudit } from '../services/auditService';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const register = async (req: Request, res: Response) => {
  const { email, password, full_name } = req.body;
  const existingUser = await db('users').where({ email }).first();
  if (existingUser) return res.status(400).json({ error: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const [idResult] = await db('users').insert({
    email,
    password: hashedPassword,
    full_name,
    role: 'user'
  }).returning('id');

  const actualId = typeof idResult === 'object' ? idResult.id : idResult;
  logAudit(actualId, 'CREATE', 'users', actualId);

  res.status(201).json({ id: actualId, email, message: 'User registered successfully' });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await db('users').where({ email }).first();
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
};
