#!/bin/sh
npx prisma db push
npm run seed # Optional: only if you want to seed every time
npm run start:prod
