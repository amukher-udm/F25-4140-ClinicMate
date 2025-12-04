const request = require('supertest');
const api = request('http://localhost:3000'); // server must be running

describe('Admin Availability API', () => {
  it('POST /api/admin/insert_availability' , async () => {
    const res = await api 
        .post ('/api/admin/insert_availability')
       // .set('Authorization', 'Bearer testtoken123')
        .send({
            provider_id: '3', 
            date: '2025-12-03', 
            slot_start: '09:00:00',
            slot_end: '10:00:00'
          });

          expect(res.status).toBe(200);
          expect(res.body.message).toBe("Availability created successfully");
        });

        it("fail if missing fields", async () => {
            const res = await api 
            .post ('/api/admin/insert_availability')
           // .set('Authorization', 'Bearer testtoken123')
            .send({ 
                provider_id: '3', 
                date: '2025-12-03', 
                //slot_start and end missing

            });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Missing required fields");
        });


});
