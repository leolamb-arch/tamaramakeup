import { Router } from 'express';
import healthCheck from './health-check.js';
import googleStatus from './googleStatus.js';
import googleAuth from './googleAuth.js';
import googleCallback from './googleCallback.js';
import googleDisconnect from './googleDisconnect.js';
import googleAvailability from './googleAvailability.js';
import googleCreateEvent from './googleCreateEvent.js';
import scheduleConfig from './scheduleConfig.js';
import scheduleAvailability from './scheduleAvailability.js';
import scheduleBook from './scheduleBook.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);

    // Google Calendar (OAuth + disponibilidad + creación de eventos)
    router.get('/google/status', googleStatus);
    router.get('/google/auth', googleAuth);
    router.get('/google/callback', googleCallback);
    router.post('/google/disconnect', googleDisconnect);
    router.get('/google/availability', googleAvailability);
    router.post('/google/create-event', googleCreateEvent);

    // Administración de agenda (panel privado + calendario público)
    router.get('/schedule/config', scheduleConfig);
    router.get('/schedule/availability', scheduleAvailability);
    router.post('/schedule/book', scheduleBook);

    return router;
};
