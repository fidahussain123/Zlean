import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: join(__dirname, '..', '..', '.env') });
dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '..', '.env') });
dotenv.config({ path: join(process.cwd(), '..', '..', '.env') });
