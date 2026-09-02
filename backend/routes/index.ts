import { Router } from 'express';
import healthRoutes from './health.routes.ts';
import uploadRoutes from './upload.routes.ts';
import dashboardRoutes from './dashboard.routes.ts';
import demoRoutes from './demo.routes.ts';

const apiRouter = Router();

apiRouter.use(healthRoutes);
apiRouter.use(uploadRoutes);
apiRouter.use(dashboardRoutes);
apiRouter.use(demoRoutes);

export default apiRouter;
