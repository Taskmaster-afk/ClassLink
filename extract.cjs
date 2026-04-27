const fs = require('fs');
const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');

// ClassroomView
const classroomViewLines = lines.slice(527, 944);
const crImports = `import { useState, useEffect } from 'react';
import { Book, ArrowLeft, ChevronRight, User, Send, ClipboardCheck, Library, FileText, Download, Plus, FileUp } from 'lucide-react';
import { motion } from 'motion/react';
import { BASE_URL, cn } from '../lib/utils.js';

`;
fs.writeFileSync('src/components/ClassroomView.jsx', crImports + classroomViewLines.join('\n') + '\nexport default ClassroomView;\n');

// AssignmentView
const assignmentViewLines = lines.slice(945, 1195);
const avImports = `import { useState, useEffect } from 'react';
import { ArrowLeft, Book, FileText, Download, Upload, ClipboardCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { BASE_URL, cn } from '../lib/utils.js';

`;
fs.writeFileSync('src/components/AssignmentView.jsx', avImports + assignmentViewLines.join('\n') + '\nexport default AssignmentView;\n');
