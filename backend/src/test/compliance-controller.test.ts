import { describe, it, expect, vi } from 'vitest';
import { createCompliance, getAllCompliances } from '../controllers/compliance-controller.js';
import { db } from '../db/index.js';
import type { Context } from 'hono';

// Mock the database module
vi.mock('../db/index.js', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn()
      }))
    })),
    query: {
      Compliance: {
        findMany: vi.fn(),
      },
      ComplianceAccess: {
        findMany: vi.fn(),
      }
    }
  }
}));

// Mock the logger utility
vi.mock('../utils/logger-util.ts', () => ({
  logUserAction: vi.fn().mockResolvedValue(undefined),
}));

describe('Compliance Controller', () => {
  describe('createCompliance', () => {
    it('should create a compliance successfully', async () => {
      // Mock data
      const mockCompliance = {
        id: 1,
        name: 'Test Compliance',
        description: 'Test Description',
        created_at: new Date(),
        expiry_date: new Date('2024-12-31T00:00:00.000Z'),
      };

      // Setup mock implementation
      const mockReturning = vi.fn().mockResolvedValue([mockCompliance]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
      vi.mocked(db.insert).mockImplementation(mockInsert);

      // Mock request body
      const requestBody = {
        name: 'Test Compliance',
        description: 'Test Description',
        expiry_date: '2024-12-31T00:00:00.000Z',
      };

      // Mock Hono context
      const mockContext = {
        json: vi.fn().mockImplementation((data, status) => ({ ...data, status })),
        req: {
          json: vi.fn().mockResolvedValue(requestBody),
        },
        get: vi.fn().mockReturnValue({ id: 1, email: 'test@example.com' }),
      } as unknown as Context;

      // Call the controller
      const result = await createCompliance(mockContext);

      // Assertions
      expect(result).toEqual({
        message: 'Compliance created',
        data: mockCompliance,
        status: 201,
      });
    });

    it('should handle validation errors', async () => {
      // Mock request with invalid data
      const requestBody = {
        name: '', // Invalid: empty name
        description: 'Test Description',
        expiry_date: 'invalid-date', // Invalid date format
      };

      // Mock Hono context
      const mockContext = {
        json: vi.fn().mockImplementation((data, status) => ({ ...data, status })),
        req: {
          json: vi.fn().mockResolvedValue(requestBody),
        },
      } as unknown as Context;

      // Call the controller
      const result = await createCompliance(mockContext);

      // Assertions
      expect(result.status).toBe(400);
      expect(result).toHaveProperty('errors');
    });
  });

  describe('getAllCompliances', () => {
    it('should return all compliances for administrator', async () => {
      // Mock data
      const mockCompliances = [
        {
          id: 1,
          name: 'Compliance 1',
          description: 'Description 1',
          created_at: new Date(),
          expiry_date: null,
          criteria: [],
          accesses: [],
        },
        {
          id: 2,
          name: 'Compliance 2',
          description: 'Description 2',
          created_at: new Date(),
          expiry_date: null,
          criteria: [],
          accesses: [],
        },
      ];

      // Setup mock implementation for administrator
      vi.mocked(db.query.Compliance.findMany).mockResolvedValue(mockCompliances);

      // Mock Hono context for administrator
      const mockContext = {
        json: vi.fn().mockImplementation((data, status) => ({ ...data, status })),
        get: vi.fn().mockReturnValue({ id: 1, role: 'Administrator' }),
      } as unknown as Context;

      // Call the controller
      const result = await getAllCompliances(mockContext);

      // Assertions
      expect(result).toEqual({
        message: 'Compliances retrieved successfully',
        data: mockCompliances,
        status: 200,
      });
    });

    it('should return accessible compliances for auditor', async () => {
      // Mock data for auditor
      const mockAccessibleCompliances = [
        {
          id: 1,
          compliance_id: 1,
          auditor_id: 2,
          accessible: true,
          compliance: {
            id: 1,
            name: 'Compliance 1',
            description: 'Description 1',
            created_at: new Date(),
            expiry_date: null,
            criteria: [],
          },
        },
      ];

      // Setup mock implementation for auditor
      vi.mocked(db.query.ComplianceAccess.findMany).mockResolvedValue(mockAccessibleCompliances);

      // Mock Hono context for auditor
      const mockContext = {
        json: vi.fn().mockImplementation((data, status) => ({ ...data, status })),
        get: vi.fn().mockReturnValue({ id: 2, role: 'Auditor' }),
      } as unknown as Context;

      // Call the controller
      const result = await getAllCompliances(mockContext);

      // Assertions
      expect(result).toEqual({
        message: 'Compliances retrieved successfully',
        data: mockAccessibleCompliances.map(access => access.compliance),
        status: 200,
      });
    });

    it('should handle database errors', async () => {
      // Setup mock to throw error
      vi.mocked(db.query.Compliance.findMany).mockRejectedValue(new Error('Database error'));

      // Mock Hono context
      const mockContext = {
        json: vi.fn().mockImplementation((data, status) => ({ ...data, status })),
        get: vi.fn().mockReturnValue({ id: 1, role: 'Administrator' }),
      } as unknown as Context;

      // Call the controller
      const result = await getAllCompliances(mockContext);

      // Assertions
      expect(result).toEqual({
        error: 'Failed to retrieve compliances',
        status: 500,
      });
    });
  });
}); 