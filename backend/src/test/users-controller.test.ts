import { describe, it, expect, vi } from 'vitest';
import { getAllUsers } from '../controllers/users-controller.js';
import { db } from '../db/index.js';
import type { Context } from 'hono';

// Mock the database module
vi.mock('../db/index.js', () => ({
  db: {
    query: {
      User: {
        findMany: vi.fn()
      }
    }
  }
}));

describe('Users Controller', () => {
  describe('getAllUsers', () => {
    it('should return all users successfully', async () => {
      // Mock data
      const mockUsers = [
        {
          id: 1,
          name: 'User 1',
          email: 'user1@example.com',
          avatar: 'https://example.com/avatar1.jpg',
          role: 'User',
          status: 'Active',
          lastLogin: new Date(),
          createdAt: new Date()
        },
        {
          id: 2,
          name: 'User 2',
          email: 'user2@example.com',
          avatar: 'https://example.com/avatar2.jpg',
          role: 'Admin',
          status: 'Active',
          lastLogin: null,
          createdAt: new Date()
        }
      ];

      // Setup mock implementation
      vi.mocked(db.query.User.findMany).mockResolvedValue(mockUsers);

      // Mock Hono context
      const mockContext = {
        json: vi.fn().mockImplementation((data) => data),
        req: {} as any,
        env: {},
        finalized: false,
        error: null,
        set: vi.fn(),
        get: vi.fn(),
        header: vi.fn(),
        status: vi.fn().mockReturnThis()
      } as unknown as Context;

      // Call the controller
      const result = await getAllUsers(mockContext);

      // Assertions
      expect(result).toEqual({
        success: true,
        data: mockUsers
      });
      expect(db.query.User.findMany).toHaveBeenCalled();
      expect(mockContext.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsers
      });
    });

    it('should handle errors gracefully', async () => {
      // Setup mock to throw error
      vi.mocked(db.query.User.findMany).mockRejectedValue(new Error('Database error'));

      // Mock Hono context
      const mockContext = {
        json: vi.fn().mockImplementation((data, status) => ({ ...data, status })),
        req: {} as any,
        env: {},
        finalized: false,
        error: null,
        set: vi.fn(),
        get: vi.fn(),
        header: vi.fn(),
        status: vi.fn().mockReturnThis()
      } as unknown as Context;

      // Call the controller
      const result = await getAllUsers(mockContext);

      // Assertions
      expect(db.query.User.findMany).toHaveBeenCalled();
      expect(mockContext.json).toHaveBeenCalledWith(
        { success: false, error: 'Failed to fetch users' },
        500
      );
      expect(result).toEqual({
        success: false,
        error: 'Failed to fetch users',
        status: 500
      });
    });
  });
}); 