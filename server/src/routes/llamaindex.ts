// routes/llamaindex.ts — LlamaIndex PDF indexing and Q&A endpoints
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { indexPDF, queryIndex, getIndexedFiles } from '../services/llamaindex.service';

const router = Router();

// Configure multer for PDF uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// GET /api/llamaindex/files — Returns all indexed files
router.get('/files', (_req, res: Response) => {
  res.json({ files: getIndexedFiles() });
});

// POST /api/llamaindex/index — Upload and index a PDF
router.post('/index', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  const apiKey = (req.headers['x-api-key'] as string) || 'demo-mode';
  if (!req.file) { res.status(400).json({ error: 'File is required' }); return; }

  try {
    const result = await indexPDF(
      apiKey,
      req.file.path,
      req.file.originalname,
      req.body.model || 'gpt-4o'
    );

    // Clean up the uploaded file after indexing
    fs.unlink(req.file.path, () => {});

    res.json(result);
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: err instanceof Error ? err.message : 'Indexing failed' });
  }
});

// POST /api/llamaindex/query — Query an indexed document
router.post('/query', async (req: Request, res: Response): Promise<void> => {
  const { indexId, query, topK = 3, model } = req.body;
  const apiKey = (req.headers['x-api-key'] as string) || 'demo-mode';
  if (!indexId || !query) {
    res.status(400).json({ error: 'indexId and query are required' });
    return;
  }

  try {
    const result = await queryIndex(apiKey, indexId, query, model, topK);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Query failed' });
  }
});

export default router;
