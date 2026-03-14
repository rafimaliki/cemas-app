import { describe, it, expect, vi, beforeAll } from 'vitest';
import { 
  getAllEvidences, 
  getEvidenceById, 
  getEvidencesByCriteriaId,
  createEvidenceCriteria,
  deleteEvidenceCriteria 
} from '../controllers/evidence-controller.js';
import { db } from '../db/index.js';
import type { Context } from 'hono';
import { ComplianceSchema } from '../schema/compliance-schema.js';
import { CriteriaSchema } from '../schema/criteria-schema.js';

// Mock the database module
vi.mock('../db/index.js', () => ({
  db: {
    query: {
      Evidences: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      EvidenceCriteria: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      Criteria: {
        findFirst: vi.fn(),
      }
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn()
      }))
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn()
      }))
    })),
  }
}));

// Mock the logger utility
vi.mock('../utils/logger-util.ts', () => ({
  logUserAction: vi.fn().mockResolvedValue(undefined),
}));

describe('Evidence Controller', () => {
  // Ensure schemas are valid before running tests
  beforeAll(() => {
    // Validate that our schemas work correctly
    const validCompliance = {
      name: 'Test Compliance',
      description: 'Test Description',
      expiry_date: new Date().toISOString()
    };
    
    const validCriteria = {
      compliance_id: 1,
      parent_id: null,
      prefix: 'TEST',
      name: 'Test Criteria',
      description: 'Test Description',
      level: 1,
      pic_id: 1,
      status: 'Active'
    };

    const complianceResult = ComplianceSchema.safeParse(validCompliance);
    const criteriaResult = CriteriaSchema.safeParse(validCriteria);

    expect(complianceResult.success).toBe(true);
    expect(criteriaResult.success).toBe(true);
  });

  describe('getAllEvidences', () => {
    it('should return all evidences successfully', async () => {
      // Mock data
      const mockEvidences = [
        {
          id: 1,
          file_name: 'test1.pdf',
          file_path: '/path/to/test1.pdf',
          drive_file_id: 'drive123',
          uploaded_by: 1,
          uploaded_at: new Date(),
          criteria: []
        },
        {
          id: 2,
          file_name: 'test2.pdf',
          file_path: '/path/to/test2.pdf',
          drive_file_id: 'drive456',
          uploaded_by: 1,
          uploaded_at: new Date(),
          criteria: []
        }
      ];

      // Setup mock implementation
      vi.mocked(db.query.Evidences.findMany).mockResolvedValue(mockEvidences);

      // Mock Hono context
      const mockContext = {
        json: vi.fn().mockImplementation((data) => data),
      } as unknown as Context;

      // Call the controller
      const result = await getAllEvidences(mockContext);

      // Assertions
      expect(result).toEqual({
        success: true,
        data: mockEvidences
      });
      expect(db.query.Evidences.findMany).toHaveBeenCalled();
    });

    it('should handle errors when fetching evidences', async () => {
      // Setup mock to throw error
      vi.mocked(db.query.Evidences.findMany).mockRejectedValue(new Error('Database error'));

      // Mock Hono context
      const mockContext = {
        json: vi.fn().mockImplementation((data, status) => ({ ...data, status })),
      } as unknown as Context;

      // Call the controller
      const result = await getAllEvidences(mockContext);

      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to fetch evidences',
        status: 500
      });
    });
  });

  describe('getEvidenceById', () => {
    it('should return evidence by ID successfully', async () => {
      // Mock data
      const mockEvidence = {
        id: 1,
        file_name: 'test1.pdf',
        file_path: '/path/to/test1.pdf',
        drive_file_id: 'drive123',
        uploaded_by: 1,
        uploaded_at: new Date(),
        criteria: []
      };

      // Setup mock implementation
      vi.mocked(db.query.Evidences.findFirst).mockResolvedValue(mockEvidence);

      // Mock Hono context
      const mockContext = {
        json: vi.fn().mockImplementation((data) => data),
        req: {
          param: vi.fn().mockReturnValue('1')
        }
      } as unknown as Context;

      // Call the controller
      const result = await getEvidenceById(mockContext);

      // Assertions
      expect(result).toEqual({
        success: true,
        data: mockEvidence
      });
      expect(db.query.Evidences.findFirst).toHaveBeenCalledWith({
        where: expect.any(Object),
        with: expect.any(Object)
      });
    });

    it('should handle non-existent evidence ID', async () => {
      // Setup mock implementation
      vi.mocked(db.query.Evidences.findFirst).mockResolvedValue(undefined);

      // Mock Hono context
      const mockContext = {
        json: vi.fn().mockImplementation((data, status) => ({ ...data, status })),
        req: {
          param: vi.fn().mockReturnValue('999')
        }
      } as unknown as Context;

      // Call the controller
      const result = await getEvidenceById(mockContext);

      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Evidence not found',
        status: 404
      });
    });
  });

  describe('createEvidenceCriteria', () => {
    it('should create evidence-criteria relationship successfully', async () => {
      // Mock data
      const mockCriteria = {
        id: 1,
        name: 'Test Criteria'
      };
      const mockEvidence = {
        id: 1,
        file_name: 'test.pdf',
        file_path: '/path/to/test.pdf',
        drive_file_id: 'drive123',
        uploaded_by: 1,
        uploaded_at: new Date(),
        expired_by: new Date(),
        notified: false,

      };
      const mockRelationship = {
        id: 1,
        criteria_id: 1,
        evidence_id: 1,
        added_at: new Date()
      };

      // Setup mock implementations
      vi.mocked(db.query.Criteria.findFirst).mockResolvedValue(mockCriteria);
      vi.mocked(db.query.Evidences.findFirst).mockResolvedValue(mockEvidence);
      vi.mocked(db.query.EvidenceCriteria.findFirst).mockResolvedValue(undefined);
      const mockReturning = vi.fn().mockResolvedValue([mockRelationship]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
      vi.mocked(db.insert).mockImplementation(mockInsert);

      // Mock Hono context
      const mockContext = {
        json: vi.fn().mockImplementation((data, status) => ({ ...data, status })),
        req: {
          json: vi.fn().mockResolvedValue({
            criteria_id: 1,
            drive_file_id: 'drive123'
          })
        },
        get: vi.fn().mockReturnValue({ id: 1, email: 'test@example.com' })
      } as unknown as Context;

      // Call the controller
      const result = await createEvidenceCriteria(mockContext);

      // Assertions
      expect(result).toEqual(expect.objectContaining({
        success: true,
        message: 'Evidence-Criteria relationship created successfully',
        evidence: expect.objectContaining({
          id: 1,
          file_name: 'test.pdf'
        }),
        status: 201
      }));
  });
  });
  describe('deleteEvidenceCriteria', () => {
    it('should delete evidence-criteria relationship successfully', async () => {
      // Mock data
      const mockRelation = {
        id: 1,
        criteria_id: 1,
        evidence_id: 1,
        added_at: new Date()
      };
      const mockEvidence = {
        id: 1,
        file_name: 'test.pdf',
        file_path: '/path/to/test.pdf',
        drive_file_id: 'drive123',
        uploaded_by: 1,
        uploaded_at: new Date()
      };
      const mockCriteria = {
        id: 1,
        name: 'Test Criteria'
      };

      // Setup mock implementations
      vi.mocked(db.query.EvidenceCriteria.findFirst).mockResolvedValue(mockRelation);
      vi.mocked(db.query.Evidences.findFirst).mockResolvedValue(mockEvidence);
      vi.mocked(db.query.Criteria.findFirst).mockResolvedValue(mockCriteria);
      const mockReturning = vi.fn().mockResolvedValue([mockRelation]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockDelete = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.delete).mockImplementation(mockDelete);

      // Mock Hono context
      const mockContext = {
        json: vi.fn().mockImplementation((data) => data),
        req: {
          param: vi.fn().mockReturnValue('1')
        },
        get: vi.fn().mockReturnValue({ id: 1, email: 'test@example.com' })
      } as unknown as Context;

      // Call the controller
      const result = await deleteEvidenceCriteria(mockContext);

      // Assertions
      expect(result).toEqual({
        success: true,
        message: 'Evidence-Criteria relationship deleted successfully'
      });
    });

    it('should handle non-existent relationship', async () => {
      // Setup mock implementation
      vi.mocked(db.query.EvidenceCriteria.findFirst).mockResolvedValue(undefined);

      // Mock Hono context
      const mockContext = {
        json: vi.fn().mockImplementation((data, status) => ({ ...data, status })),
        req: {
          param: vi.fn().mockReturnValue('999')
        }
      } as unknown as Context;

      // Call the controller
      const result = await deleteEvidenceCriteria(mockContext);

      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Evidence-Criteria relationship not found',
        status: 404
      });
    });
  });
}); 