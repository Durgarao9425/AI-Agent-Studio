// routes/rag.ts — Manual RAG pipeline endpoints
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  indexDocument,
  ragQuery,
  getIndexedDocuments,
  chunkText,
} from '../services/rag.service';

const router = Router();

const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// GET /api/rag/documents — Returns all indexed documents (without embeddings)
router.get('/documents', (_req, res: Response) => {
  res.json({ documents: getIndexedDocuments() });
});

// POST /api/rag/chunk — Preview chunking without indexing (for visualization)
router.post('/chunk', (req: Request, res: Response) => {
  const { text, chunkSize = 500, overlap = 50 } = req.body;
  if (!text) { res.status(400).json({ error: 'text is required' }); return; }
  const chunks = chunkText(text, chunkSize, overlap);
  res.json({ chunks, totalChunks: chunks.length });
});

// POST /api/rag/index — Upload and index a document
router.post('/index', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  const apiKey = (req.headers['x-api-key'] as string) || 'demo-mode';

  let text = req.body.text;
  let filename = req.body.filename || 'document.txt';

  if (req.file) {
    text = fs.readFileSync(req.file.path, 'utf-8');
    filename = req.file.originalname;
    fs.unlink(req.file.path, () => {});
  }

  if (!text) { res.status(400).json({ error: 'File or text content is required' }); return; }

  try {
    const chunkSize = parseInt(req.body.chunkSize) || 500;
    const overlap = parseInt(req.body.overlap) || 50;
    const result = await indexDocument(apiKey, filename, text, chunkSize, overlap);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Indexing failed' });
  }
});

// POST /api/rag/query — Query the RAG pipeline
router.post('/query', async (req: Request, res: Response): Promise<void> => {
  const { documentId, query, topK = 3, model } = req.body;
  const apiKey = (req.headers['x-api-key'] as string) || 'demo-mode';
  if (!documentId || !query) {
    res.status(400).json({ error: 'documentId and query are required' });
    return;
  }

  try {
    const result = await ragQuery(apiKey, documentId, query, model, topK);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'RAG query failed' });
  }
});

export default router;
