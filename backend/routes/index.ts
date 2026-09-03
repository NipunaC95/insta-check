import { Router } from 'express';
import healthRoutes from './health.routes.ts';
import uploadRoutes from './upload.routes.ts';
import dashboardRoutes from './dashboard.routes.ts';
import demoRoutes from './demo.routes.ts';
import unfollowedRoutes from './unfollowed.routes.ts';
import notFoundRoutes from './not-found.routes.ts';
import falsePositiveRoutes from './false-positive.routes.ts';

const apiRouter = Router();

apiRouter.use(healthRoutes);
apiRouter.use(uploadRoutes);
apiRouter.use(dashboardRoutes);
apiRouter.use(demoRoutes);
apiRouter.use(unfollowedRoutes);
apiRouter.use(notFoundRoutes);
apiRouter.use(falsePositiveRoutes);

export default apiRouter;
