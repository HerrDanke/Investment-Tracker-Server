import type { FastifyInstance } from 'fastify';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import type { User, RegisterRequest, LoginRequest, AuthResponse, UserInfo } from '../types';

export default async function authRoutes(app: FastifyInstance) {
  const db = app.db;

  // POST /api/auth/register
  app.post<{ Body: RegisterRequest; Reply: AuthResponse | { error: string } }>(
    '/auth/register',
    async (request, reply) => {
      const { username, password, password_confirm } = request.body;

      // Validation
      if (!username || username.length < 3) {
        return reply.code(400).send({ error: '用户名至少3个字符' });
      }
      if (!password || password.length < 6) {
        return reply.code(400).send({ error: '密码至少6个字符' });
      }
      if (password !== password_confirm) {
        return reply.code(400).send({ error: '两次密码输入不一致' });
      }

      // Check if username exists
      const users = db.getUsers();
      if (users.some((u) => u.username === username)) {
        return reply.code(400).send({ error: '用户名已存在' });
      }

      // Create user
      const userId = uuidv4();
      const passwordHash = await argon2.hash(password);
      const createdAt = new Date().toISOString();

      const user: User = {
        id: userId,
        username,
        password_hash: passwordHash,
        created_at: createdAt,
      };

      users.push(user);
      await db.updateUsers(users);

      // Generate token
      const token = app.jwt.sign({ sub: userId, username });

      const response: AuthResponse = {
        token,
        user: { id: userId, username } as UserInfo,
      };

      return reply.code(201).send(response);
    }
  );

  // POST /api/auth/login
  app.post<{ Body: LoginRequest; Reply: AuthResponse | { error: string } }>(
    '/auth/login',
    async (request, reply) => {
      const { username, password } = request.body;

      if (!username || !password) {
        return reply.code(400).send({ error: '用户名和密码不能为空' });
      }

      const users = db.getUsers();
      const user = users.find((u) => u.username === username);

      if (!user) {
        return reply.code(401).send({ error: '用户名或密码错误' });
      }

      const isValid = await argon2.verify(user.password_hash, password);
      if (!isValid) {
        return reply.code(401).send({ error: '用户名或密码错误' });
      }

      // Generate token
      const token = app.jwt.sign({ sub: user.id, username: user.username });

      const response: AuthResponse = {
        token,
        user: { id: user.id, username: user.username },
      };

      return reply.send(response);
    }
  );
}
