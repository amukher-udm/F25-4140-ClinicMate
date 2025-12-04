const request = require('supertest');
const api = request('http://localhost:3000'); // server must be running

describe("DELETE /api/admin/delete_availability", () => {

  it("successfully deletes availability", async () => {
    const res = await api
      .delete('/api/admin/delete_availability')
      .set('Authorization', 'Bearer testtoken123')
      .query({ id: 'some-test-uuid' });

    expect(res.body.message).toBe('Availability deleted successfully');
  });

  it('fails if user is not admin', async () => {
    
    const res = await api
      .delete('/api/admin/delete_availability')
      .set('Authorization', 'Bearer testtoken123')
      .query({ id: 'some-test-uuid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Not Allowed: Admins only');
  });

});