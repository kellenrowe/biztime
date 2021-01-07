"use strict";

const db = require("../db");

const express = require("express");

const router = new express.Router();

//errors class to throw
const { NotFoundError, BadRequestError } = require("../expressError");

/** GET /companies: Returns list of companies, like
 *  {companies: [{code, name}, ...]} */
router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT code, name
      FROM companies`
  );
  const companies = results.rows;
  return res.json({ companies });
});

/** GET /companies/:code:
 *  Return obj of company: {company:
 *  {code, name, description}}
 *  or
 *  404 if not found
 */
router.get("/:code", async function (req, res, next) {
  const code = req.params.code;
  
  const results = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1`,[code]);
  
  if (results.rows.length === 0){
    throw new NotFoundError(`${code} is not found the database`);
  }
  const company = results.rows[0];
  return res.json({ company });
});


/** POST /companies:
 *  given JSON like: {code, name, description}
 *  returns obj like: {company: {code, name, description}}
 */
router.post("/", async function (req, res, next) {
  const { code, name, description } = req.body;

  const results = await db.query(
    `INSERT INTO companies ( code, name, description )
      VALUES ( $1, $2, $3 )
      RETURNING code, name, description`,
    [code, name, description]);
  
  const company = results.rows[0];
  return res.status(201).json({ company });
});

/* PUT /companies/[code]
Edit existing company.

Should return 404 if company cannot be found.

Needs to be given JSON like: {name, description}

Returns update company object: {company: {code, name, description}} */

router.put("/:code", async function (req, res, next) {
  //validation 
  const { name, description } = req.body;
  const code = req.params.code;
  const results = await db.query(
    `UPDATE companies
           SET name=$1,
               description=$2
           WHERE code = $3
           RETURNING code, name, description`,
    [name, description, code],);

  if (results.rows.length === 0){
    throw new NotFoundError(`${code} is not found the database`);
  }
  const company = results.rows[0];
  return res.json({ company });
});

/* DELETE /companies/[code]
Deletes company.

Should return 404 if company cannot be found.

Returns {status: "deleted"} */

router.delete("/:code", async function (req, res, next) {
  const code = req.params.code;
  const results = await db.query(
    `DELETE FROM companies 
      WHERE code = $1
      RETURNING code`,
    [code],
  );
  if (results.rows.length === 0){
    throw new NotFoundError(`${code} is not found the database`);
  }
  return res.json({status: "deleted"});
});

module.exports = router;
