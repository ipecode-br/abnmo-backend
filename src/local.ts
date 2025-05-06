import express, { Request, Response } from 'express';
import cors from 'cors';
import { app } from './app';

const server = express();
const port = process.env.PORT || 3000;

server.use(cors());
server.use(express.json());

server.post('/', (req: Request, res: Response) => {
  try {
    const result = app(req);
    res.json(result);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

if (require.main === module) {
  server.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
}

export default server;
