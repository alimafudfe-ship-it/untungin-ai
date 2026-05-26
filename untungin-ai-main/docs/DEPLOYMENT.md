# Deployment Guide

## Railway Worker
- Deploy crawler worker separately
- Add PLAYWRIGHT_BROWSERS_PATH=0

## Vercel Frontend
- Deploy Next.js dashboard
- Add Supabase env keys

## VPS Recommendation
- 4 CPU
- 8 GB RAM
- Ubuntu 22
- PM2 + Docker

## Scheduler
- node-cron every 1 hour
- save to Supabase snapshots
