import './env.js';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import shopsRoutes from './routes/shops.js';
import adminsRoutes from './routes/admins.js';
import workersRoutes from './routes/workers.js';
import carsRoutes from './routes/cars.js';
import billingRoutes from './routes/billing.js';
import notificationsRoutes from './routes/notifications.js';
import dashboardRoutes from './routes/dashboard.js';
import servicesRoutes from './routes/services.js';
import customersRoutes from './routes/customers.js';
import invitesRoutes from './routes/invites.js';
import { attachAuth } from './middleware/auth.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use(attachAuth);
app.use('/api/invites', invitesRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/workers', workersRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/customers', customersRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
