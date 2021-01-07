const request = require("supertest");
const app = require("../app");
let db = require("../db");
let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('TestCom', "TestCompany", "TestDescription")
    RETURNING code, name, description`);
  testCompany = result.rows[0];
});


/** GET /companies - returns `{companies: [{code, name}, ...]}` */
describe("GET /companies", function () {
  debugger
  test("Gets a list of all companies - testcompany", async function () {
    const resp = await request(app).get(`/companies`);
    expect(resp.body).toEqual({
      companies: [testCompany],
    });
  });
});


