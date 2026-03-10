import request from 'supertest';
import app from '../src/server';
import { Pool } from 'pg';

jest.mock('pg', () => {
    const mPool = {
        query: jest.fn(),
        on: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

describe('API Endpoints', () => {
    let pool: any;

    beforeEach(() => {
        pool = new Pool();
        jest.clearAllMocks();
    });

    it('GET /health should return 200 and db connected status', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
        const res = await request(app).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'healthy');
        expect(res.body).toHaveProperty('db', 'connected');
    });

    it('GET /health should return 503 if db fails', async () => {
        pool.query.mockRejectedValueOnce(new Error('Connection failed'));
        const res = await request(app).get('/health');
        expect(res.statusCode).toEqual(503);
        expect(res.body).toHaveProperty('status', 'unhealthy');
        expect(res.body).toHaveProperty('db', 'disconnected');
    });

    it('GET /status should return 200 and OK message', async () => {
        const res = await request(app).get('/status');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'OK');
    });

    it('POST /process should return 200 with data and insert to DB', async () => {
        const testData = { key: 'value' };
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1, data: testData }] });

        const res = await request(app)
            .post('/process')
            .send(testData);
            
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Data processed successfully');
        expect(res.body.receivedData).toEqual(testData);
        expect(res.body.id).toEqual(1);
        expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('POST /process should return 400 without data', async () => {
        const res = await request(app)
            .post('/process')
            .send({});
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'No data provided');
        expect(pool.query).not.toHaveBeenCalled();
    });
});
