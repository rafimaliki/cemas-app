import * as XLSX from 'xlsx';
import { writeFile } from 'fs/promises';
import path from 'path';

async function createSampleTemplate() {
  
  const data = [
    { prefix: "1", name: "Access Control" },
    { prefix: "1.1", name: "User Registration" },
    { prefix: "1.1.1", name: "Identity Verification" },
    { prefix: "1.2", name: "Authentication" },
    { prefix: "2", name: "Data Protection" },
    { prefix: "2.1", name: "Encryption" },
    { prefix: "2.1.1", name: "Key Management" },
    { prefix: "2.1.2", name: "Algorithm Standards" },
    { prefix: "2.2", name: "Data Classification" }
  ];
  

  const ws = XLSX.utils.json_to_sheet(data);
  

  XLSX.utils.sheet_add_aoa(ws, [["prefix", "name"]], { origin: "A1" });
  

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Criteria");
  

  const helpData = [
    ["Field", "Description", "Format/Values"],
    ["prefix", "Hierarchical identifier", "Use dot notation: 1, 1.1, 1.1.1"],
    ["name", "Criteria name", "Text"],
    ["", "", ""],
    ["Note:", "Level is automatically determined from the prefix structure.", ""],
    ["", "Description will be set to null.", ""],
    ["", "Status will default to 'in-progress'.", ""]
  ];
  
  const helpWs = XLSX.utils.aoa_to_sheet(helpData);
  XLSX.utils.book_append_sheet(wb, helpWs, "Help");
  

  XLSX.writeFile(wb, "compliance_template.xlsx");
  console.log(`Sample template created: compliance_template.xlsx`);
  console.log(`Template has been simplified to only include prefix and name columns.`);
}

createSampleTemplate()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Error:', err));