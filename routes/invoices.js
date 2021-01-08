"use strict";

const db = require("../db");

const express = require("express");

const router = new express.Router();

//errors class to throw
const { NotFoundError, BadRequestError } = require("../expressError");

const FOREIGN_KEY_CONSTRAINTS_COMP_CODE = 'invoices_comp_code_fkey';

/** GET /invoices:
 *  Return info on invoices: like {invoices: [{id, comp_code}, ...]} */
router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT id, comp_code
      FROM invoices
      ORDER BY id`
  );
  const invoices = results.rows;
  return res.json({ invoices });
});

/** GET /invoices/:id:
 *  Returns obj on given invoice.
 * If invoice cannot be found, returns 404.
 * Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name description}}
 */
router.get("/:id", async function (req, res, next) {
  const id = req.params.id;
  
  const iResults = await db.query(
    `SELECT id, amt, paid, add_date, paid_date, comp_code
      FROM invoices
      WHERE id = $1`,[id]);
  if (iResults.rows.length === 0){
    throw new NotFoundError(`Invoice ${id} is not in the database`);
  }
  const invoice = iResults.rows[0];
  const cResults = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1`,[invoice.comp_code])
  
  // if (cResults.rows.length === 0){
  //   throw new NotFoundError(`${invoice.comp_code} is not in the database`);
  // }
  const company = cResults.rows[0];
  invoice.company = company;
  delete invoice.comp_code;
  return res.json({ invoice });
});


/** POST /invoices:
 * Adds an invoice.
 * Needs to be passed in JSON body of: {comp_code, amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post("/", async function (req, res, next) {
  const { comp_code, amt } = req.body;
  let results;
  try{
    results = await db.query(
      `INSERT INTO invoices ( comp_code, amt )
        VALUES ( $1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]);}
  catch(err){
    if (err.constraint === FOREIGN_KEY_CONSTRAINTS_COMP_CODE){
      throw new NotFoundError(`${comp_code} is not in the database`)
    }
  }
  // console.log(results, "results");
  const invoice = results.rows[0];
  return res.status(201).json({ invoice});
});

/* PUT /invoices/[id]
    updates an invoice.
    Should return 404 if invoice cannot be found.
    Needs to be given JSON like: { amt }
    Returns update like: 
    {invoice: {id, comp_code, amt, paid, add_date, paid_date}} 
*/
router.put("/:id", async function (req, res, next) {
  //validation 
  const { amt } = req.body;
  const id = req.params.id;
  const results = await db.query(
    `UPDATE invoices
           SET amt=$1
           WHERE id = $2
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, id],);

  if (results.rows.length === 0){
    throw new NotFoundError(`Invoice ${id} is not in the database`);
  }
  const invoice = results.rows[0];
  return res.json({ invoice });
});

/* DELETE /invoices/[id]
    Deletes invoice.
    Should return 404 if invoice cannot be found.
    Returns {status: "deleted"} 
*/
router.delete("/:id", async function (req, res, next) {
  const id = req.params.id;
  const results = await db.query(
    `DELETE FROM invoices 
      WHERE id = $1
      RETURNING id`,
    [id],
  );
  if (results.rows.length === 0){
    throw new NotFoundError(`Invoice ${id} is not in the database`);
  }
  return res.json({status: "deleted"});
});



module.exports = router;