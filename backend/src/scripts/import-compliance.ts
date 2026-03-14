import { parseExcelForCompliance } from './excel-parser.ts';
import path from 'path';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: node import-compliance.js <excel-file> <compliance-name> <compliance-description> [expiry-date]');
    process.exit(1);
  }
  
  const [filePath, complianceName, complianceDescription] = args;
  const expiryDate = args[3] ? new Date(args[3]) : undefined;
  
  try {
    const result = await parseExcelForCompliance(
      filePath,
      complianceName,
      complianceDescription,
      expiryDate
    );
    
    console.log('Import successful:', result);
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main();