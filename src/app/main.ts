import { EnvService } from '@/env/env.service';

import { createNestApp } from './app';

async function bootstrap(): Promise<void> {
  const app = await createNestApp();

  const envService = app.get(EnvService);

  const BASE_URL = envService.get('API_BASE_URL');
  const PORT = envService.get('API_PORT');
  const JWT_SECRET = envService.get('JWT_SECRET');

  await app.listen(PORT).then(() => {
    console.log(`🚀 Server running on ${BASE_URL}:${PORT}`);
    console.log(`📘 Swagger running on ${BASE_URL}:${PORT}/swagger`);
    console.log('🔑 JWT_SECRET value:', JWT_SECRET);
  });
}

void bootstrap();
