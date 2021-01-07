"use strict";
const request = require("supertest");
const app = require("../app");
let db = require("../db");
let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('TestCom', 'TestCompany', 'TestDescription')
    RETURNING code, name, description`);
  // console.log("results", result.rows)
  testCompany = result.rows[0];
});


/** GET /companies - returns `{companies: [{code, name}, ...]}` */
describe("GET /companies", function () {
  test("Gets a list of all companies - testcompany", async function () {
    const resp = await request(app).get(`/companies`);
    expect(resp.body).toEqual({
      companies: [{"code": testCompany.code, 
                   "name": testCompany.name}]});
  });
});

/** GET /companies/:code - 
 *  Return obj of company: {company:
 *  {code, name, description}}
 *  or
 *  404 if not found */
describe("GET /companies/:code", function () {
  test("Gets a company based on url param", async function () {
    const resp = await request(app).get(`/companies/${testCompany.code}`);
    expect(resp.body).toEqual({ company: testCompany });
  });
  // bad code given
  test("Gives 404 if code not found", async function () {
    const resp = await request(app).get(`/companies/badCode`);
    expect(resp.statusCode).toEqual(404);
  });
});

/** POST /companies/ - 
 *  given JSON like: {code, name, description}
 *  returns obj like: {company: {code, name, description}} */
describe("POST /companies", function () {
  test("POSTS a company to db", async function () {
    let companyToAdd = {
      code: "testComp2",
      name: "testCompName2",
      description: "description2"
    }
    const resp = await request(app)
      .post(`/companies`)
      .send(companyToAdd);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ company: companyToAdd });
  });
});

/** PUT /companies/:code - 
 *  Edit existing company.
    Should return 404 if company cannot be found.
    Needs to be given JSON like: {name, description}
    Returns update company object: {company: {code, name, description}} */
describe("PUT /companies/:code", function () {
  test("updates a company in db", async function () {
    let companyToUpdate = {
      code: "TestCom",
      name: "testCompNameUpdated",
      description: "descriptionUpdated"
    }
    const resp = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send(companyToUpdate);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ company: companyToUpdate });
  });
  // bad code given
  test("Gives 404 if code not found", async function () {
    const resp = await request(app).put(`/companies/badCode`);
    expect(resp.statusCode).toEqual(404);
  });
});

/** DELETE /companies/:code - 
 *  deletes existing company.
    Deletes company.
    Should return 404 if company cannot be found.
    Returns {status: "deleted"} */
describe("DELETE /companies/:code", function () {
  test("deletes a company from db", async function () {
    const resp = await request(app)
      .delete(`/companies/${testCompany.code}`)
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ status: "deleted" });
  });
  // bad code given
  test("Gives 404 if code not found", async function () {
    const resp = await request(app).delete(`/companies/badCode`);
    expect(resp.statusCode).toEqual(404);
  });
});