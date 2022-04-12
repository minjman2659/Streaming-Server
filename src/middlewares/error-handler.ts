import { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const message = err.stack || err;

  console.error(message);

  res.status(500).send(err.message || err);
  next();
};
