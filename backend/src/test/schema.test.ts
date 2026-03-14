import { describe, it, expect } from 'vitest';
import { ComplianceSchema } from '../schema/compliance-schema.js';
import { CriteriaSchema } from '../schema/criteria-schema.js';

describe('Schema Validation', () => {
  describe('ComplianceSchema', () => {
    it('should validate valid compliance data', () => {
      const validData = {
        name: 'Test Compliance',
        description: 'Test Description',
        expiry_date: new Date().toISOString()
      };

      const result = ComplianceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid compliance data', () => {
      const invalidData = {
        name: '', // empty name should fail
        description: 'Test Description',
        expiry_date: 'not-a-date' // invalid date format
      };

      const result = ComplianceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toHaveLength(2); // should have 2 validation errors
      }
    });
  });

  describe('CriteriaSchema', () => {
    it('should validate valid criteria data', () => {
      const validData = {
        compliance_id: 1,
        parent_id: null,
        prefix: 'TEST',
        name: 'Test Criteria',
        description: 'Test Description',
        level: 1,
        pic_id: 1,
        status: 'Active'
      };

      const result = CriteriaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow nullable fields', () => {
      const validData = {
        compliance_id: null,
        parent_id: null,
        prefix: null,
        name: null,
        description: null,
        level: null,
        pic_id: null,
        status: null
      };

      const result = CriteriaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
}); 