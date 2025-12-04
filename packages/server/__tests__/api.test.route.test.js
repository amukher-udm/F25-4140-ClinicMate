const request = require('supertest');

// Points to your running Express server (students must start it first)
const api = request('http://localhost:3000');

describe('GET /api/test', () => {
  it('returns the expected message', async () => {
    const res = await api.get('/api/test');

    expect(res.status).toBe(200);

    expect(res.body).toEqual({
      message: 'Hello from Express!',
    });
  });
});
